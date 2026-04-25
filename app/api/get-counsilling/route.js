import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Counslling from '@/lib/model';

/**
 * POST /api/counslling
 * Body: { page, limit, pin }
 */
export async function POST(req) {
    try {
        const body = await req.json();

        const {
            page = 1,
            limit = 20,
            pin,
        } = body;

        // 🔐 PIN VALIDATION
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

        const safePage = Math.max(1, parseInt(page));
        const safeLimit = Math.min(100, parseInt(limit));
        const skip = (safePage - 1) * safeLimit;

        const [submissions, total] = await Promise.all([
            Counslling.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean(),
            Counslling.countDocuments({}),
        ]);

        return NextResponse.json(
            {
                submissions,
                total,
                page: safePage,
                limit: safeLimit,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error('[counslling POST] Error:', err);

        return NextResponse.json(
            { message: 'Failed to fetch submissions' },
            { status: 500 }
        );
    }
}