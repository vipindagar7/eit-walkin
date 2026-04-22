import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Otp from '@/lib/otp';

const MAX_ATTEMPTS = 5;

/**
 * POST /api/verify-otp
 * Body: { phone: "9876543210", otp: "123456" }
 *
 * 1. Validates inputs
 * 2. Looks up active (non-expired) OTP record for the phone
 * 3. Enforces max-attempt lockout (5 wrong guesses)
 * 4. Compares OTP — marks verified on success, increments attempts on failure
 * 5. Returns 200 on success, 400/429 on failure
 */
export async function POST(req) {
    try {
        const { phone, otp } = await req.json();

        // ── Validate input ─────────────────────────────────────────────────
        if (!phone || !/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { message: 'A valid 10-digit phone number is required' },
                { status: 400 }
            );
        }
        if (!otp || !/^\d{4,6}$/.test(otp)) {
            return NextResponse.json(
                { message: 'OTP must be 4–6 digits' },
                { status: 400 }
            );
        }

        await connectDB();

        // ── Find OTP record ────────────────────────────────────────────────
        const record = await Otp.findOne({ phone });

        if (!record) {
            return NextResponse.json(
                { message: 'No OTP found for this number. Please request a new one.' },
                { status: 400 }
            );
        }

        // ── Expiry check ───────────────────────────────────────────────────
        if (new Date() > new Date(record.expiresAt)) {
            await Otp.deleteOne({ phone });
            return NextResponse.json(
                { message: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // ── Lockout check ──────────────────────────────────────────────────
        if (record.attempts >= MAX_ATTEMPTS) {
            await Otp.deleteOne({ phone });
            return NextResponse.json(
                { message: 'Too many incorrect attempts. Please request a new OTP.' },
                { status: 429 }
            );
        }

        // ── Already verified ───────────────────────────────────────────────
        if (record.verified) {
            return NextResponse.json(
                { message: 'This number is already verified.' },
                { status: 200 }
            );
        }

        // ── Compare OTP ────────────────────────────────────────────────────
        if (record.otp !== otp.trim()) {
            record.attempts += 1;
            await record.save();

            const remaining = MAX_ATTEMPTS - record.attempts;
            return NextResponse.json(
                {
                    message: remaining > 0
                        ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
                        : 'Incorrect OTP. No attempts remaining — please request a new OTP.',
                },
                { status: 400 }
            );
        }

        // ── Success ────────────────────────────────────────────────────────
        record.verified = true;
        record.attempts = 0;
        await record.save();

        return NextResponse.json(
            { message: 'Phone number verified successfully' },
            { status: 200 }
        );
    } catch (err) {
        console.error('[verify-otp] Error:', err);
        return NextResponse.json(
            { message: 'Verification failed. Please try again.' },
            { status: 500 }
        );
    }
}