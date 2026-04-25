import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Counslling from '@/lib/model';
import Otp from '@/lib/otp';
import { appendAdmissionToSheet } from '@/lib/googleSheet.js';
import { sendConfirmationMail } from '@/lib/sendmail';

/**
 * POST /api/counslling
 * Body: full AdmissionForm payload
 *
 * 1. Verifies that the student's phone was OTP-verified
 * 2. Saves the admission record to MongoDB
 * 3. Asynchronously appends a row to Google Sheets
 * 4. Cleans up the OTP record
 */
export async function POST(req) {
    try {
        const body = await req.json();

        // ── Basic presence check ───────────────────────────────────────────
        if (!body.fullName?.trim() || !body.emailId?.trim() || !body.studentContactNo) {
            return NextResponse.json(
                { message: 'Full Name, Email, and Contact Number are required' },
                { status: 400 }
            );
        }
        if (!/^\d{10}$/.test(body.studentContactNo)) {
            return NextResponse.json(
                { message: 'Invalid phone number' },
                { status: 400 }
            );
        }

        await connectDB();

        // ── OTP verification guard ─────────────────────────────────────────
        const otpRecord = await Otp.findOne({ phone: body.studentContactNo });
        if (!otpRecord || !otpRecord.verified) {
            return NextResponse.json(
                { message: 'Phone number is not verified. Please complete OTP verification.' },
                { status: 403 }
            );
        }

        // ── Save to MongoDB ────────────────────────────────────────────────
        const admission = await Counslling.create({
            ...body,
            submittedAt: new Date(),
            sheetSynced: false,
        });

        await sendConfirmationMail(admission)
        // ── Sync to Google Sheets (non-blocking — don't fail the request) ──
        appendAdmissionToSheet(admission)
            .then(async (synced) => {
                if (synced) {
                    await Counslling.findByIdAndUpdate(admission._id, { sheetSynced: true });
                }
            })
            .catch((err) => {
                console.error('[counslling] Google Sheets sync failed:', err.message);
                // Record stays in DB with sheetSynced: false — can be retried later
            });

        // ── Clean up the used OTP ──────────────────────────────────────────
        await Otp.deleteOne({ phone: body.studentContactNo });

        return NextResponse.json(
            {
                message: 'Application submitted successfully',
                id: admission._id,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error('[counslling] Error:', err);

        // Mongoose duplicate / validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return NextResponse.json({ message: messages.join(', ') }, { status: 400 });
        }

        return NextResponse.json(
            { message: 'Submission failed. Please try again.' },
            { status: 500 }
        );
    }
}

