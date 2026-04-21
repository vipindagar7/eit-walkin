import { connectDB } from "@/lib/db";
import { sendConfirmationMail } from "@/lib/sendmail";
import { NextResponse } from "next/server";

import Admission from "@/lib/model";
export async function POST(req) {
    try {
        await connectDB();

        const body = await req.json();

        const admission = new Admission(body);
        const saved = await admission.save();

        // ✅ SEND EMAIL (important)
        await sendConfirmationMail(saved);

        return NextResponse.json(
            {
                success: true,
                message: "Form submitted successfully!",
                data: saved,
            },
            { status: 201 }
        );
    } catch (err) {
        console.log("FULL ERROR:", err.response); // 👈 add this

        const message =
            err.response?.data?.message ||
            err.message ||
            "Submission failed";

        toast.error(message);
    }
}