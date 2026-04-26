import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Counslling from '@/lib/model';
import Otp from '@/lib/otp';
import { appendAdmissionToSheet } from '@/lib/googleSheet.js';
import { sendConfirmationMail } from '@/lib/sendmail';

export async function POST(req) {
    try {
        const body = await req.json();

        // ── Basic validation ──────────────────────────────────────────────
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

        // ── OTP verification ──────────────────────────────────────────────
        const otpRecord = await Otp.findOne({ phone: body.studentContactNo });

        if (!otpRecord || !otpRecord.verified) {
            return NextResponse.json(
                { message: 'Phone number is not verified. Please complete OTP verification.' },
                { status: 403 }
            );
        }

        // 🔥 ── REVISIT LOGIC START ────────────────────────────────────────
        const existingUser = await Counslling.findOne({
            studentContactNo: body.studentContactNo,
        }).sort({ createdAt: -1 });

        if (existingUser) {
            const today = new Date().toDateString();

            const alreadyVisitedToday = existingUser.revisitDates?.some(
                (d) => new Date(d).toDateString() === today
            );

            if (!alreadyVisitedToday) {
                await Counslling.updateOne(
                    { _id: existingUser._id },
                    { $push: { revisitDates: new Date() } }
                );
            }
        }
        // 🔥 ── REVISIT LOGIC END ──────────────────────────────────────────

        // ── Save NEW entry ────────────────────────────────────────────────
        const admission = await Counslling.create({
            ...body,
            revisitDates: [], // always fresh
            submittedAt: new Date(),
            sheetSynced: false,
        });

        // ── Send mail ─────────────────────────────────────────────────────
        await sendConfirmationMail(admission);

        // ── Google Sheets sync (async) ────────────────────────────────────
        appendAdmissionToSheet(admission)
            .then(async (synced) => {
                if (synced) {
                    await Counslling.findByIdAndUpdate(admission._id, {
                        sheetSynced: true,
                    });
                }
            })
            .catch((err) => {
                console.error('[counslling] Google Sheets sync failed:', err.message);
            });

        // ── Delete OTP ────────────────────────────────────────────────────
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