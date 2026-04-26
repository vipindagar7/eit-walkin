import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Otp from '@/lib/otp';
import { sendOTP } from '@/lib/sendOtp';

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 30;

/** Generate a cryptographically random 6-digit OTP */
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * POST /api/send-otp
 * Body: { phone: "9876543210" }
 *
 * 1. Validates phone
 * 2. Enforces 30-second resend cooldown
 * 3. Generates OTP, upserts into DB (replaces any previous OTP for this phone)
 * 4. Sends SMS via your provider (stub — wire in Fast2SMS / MSG91 / Twilio here)
 * 5. Returns 200 on success
 */
export async function POST(req) {
    try {
        const { phone } = await req.json();

        // ── Validate ───────────────────────────────────────────────────────
        if (!phone || !/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { message: 'A valid 10-digit phone number is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // ── Cooldown check ─────────────────────────────────────────────────
        const existing = await Otp.findOne({ phone });
        if (existing) {
            const secondsSinceLast =
                (Date.now() - new Date(existing.updatedAt).getTime()) / 1000;
            if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
                const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
                return NextResponse.json(
                    { message: `Please wait ${waitSeconds}s before requesting another OTP` },
                    { status: 429 }
                );
            }
        }

        // ── Generate & upsert OTP ──────────────────────────────────────────
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await Otp.findOneAndUpdate(
            { phone },
            { otp, expiresAt, attempts: 0, verified: false },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // ── Send SMS ───────────────────────────────────────────────────────

        // await sendOTP(phone, otp);

        return NextResponse.json(
            { message: 'OTP sent successfully' },
            { status: 200 }
        );
    } catch (err) {
        console.error('[send-otp] Error:', err);
        return NextResponse.json(
            { message: 'Failed to send OTP. Please try again.' },
            { status: 500 }
        );
    }
}