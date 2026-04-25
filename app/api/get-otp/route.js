import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Otp from '@/lib/otp';

export async function POST(req) {
    try {
        const body = await req.json();

        const {
            page = 1,
            limit = 20,
            search = '',
            pin,
        } = body;

        // 🔐 PIN VALIDATION (SERVER SIDE)
        const ADMIN_PIN =
            process.env.RECEPTIONIST_PIN ||
            process.env.NEXT_PUBLIC_RECEPTIONIST_PIN;

        if (!pin || pin !== ADMIN_PIN) {
            return NextResponse.json(
                { message: 'Unauthorized: Invalid PIN' },
                { status: 401 }
            );
        }

        await connectDB();

        // 🔍 SEARCH FILTER
        const query = search
            ? {
                  $or: [
                      { phone: { $regex: search, $options: 'i' } },
                      { otp: { $regex: search, $options: 'i' } },
                  ],
              }
            : {};

        const total = await Otp.countDocuments(query);

        const otps = await Otp.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return NextResponse.json({
            total,
            otps,
        });

    } catch (error) {
        console.error('[OTP ADMIN ERROR]', error);

        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}