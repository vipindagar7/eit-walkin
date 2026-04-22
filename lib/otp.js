import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            match: /^\d{10}$/,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            // TTL index: MongoDB auto-deletes document when expiresAt is reached
            index: { expires: 0 },
        },
        attempts: {
            // Track wrong guesses — lock out after 5
            type: Number,
            default: 0,
        },
        verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// One active OTP per phone at a time — upsert replaces old record
OtpSchema.index({ phone: 1 }, { unique: true });

export default mongoose.models.Otp || mongoose.model('Otp', OtpSchema);