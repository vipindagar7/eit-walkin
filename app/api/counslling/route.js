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

// 🔍 Find last visit
const visits = await Counslling.find({
    studentContactNo: body.studentContactNo,
}).sort({ createdAt: -1 });

const now = new Date()

let lastVisitDates;

if (visits){
    console.log("1",visits)
 lastVisitDates = visits.map((visit) => visit.createdAt);
  
} 
  console.log("2", lastVisitDates)


// 🆕 Create new entry
const admission = await Counslling.create({
    ...body,
    submittedAt: now,
    sheetSynced: false,
    lastVisit: null,
    lastVisitDates: lastVisitDates,
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
        data: "admission",
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