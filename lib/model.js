import mongoose from 'mongoose';

const AcademicDetailSchema = new mongoose.Schema({
    examination: String,
    schoolOrCollegeName: String,
    boardOrUniversity: String,
    yearOfPassing: String,
    aggregatePercentageCGPA: String,
    pcmPercentage: String,
    subjects: String,
}, { _id: false });

const CounsllingSchema = new mongoose.Schema(
    {
        // ── Personal Info ─────────────────────────────────────────────
        fullName: { type: String, required: true, trim: true },
        program: { type: String, trim: true },
        branch: { type: String, trim: true },
        fatherName: { type: String, trim: true },
        motherName: { type: String, trim: true },
        dateOfBirth: { type: String },
        age: { type: String },
        studentContactNo: { type: String, required: true, match: /^\d{10}$/ },
        fatherContactNo: { type: String },
        alternateContact: { type: String },
        emailId: { type: String, required: true, trim: true, lowercase: true },
        aadhaarNumber: { type: String },
        permanentAddress: { type: String },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        nationality: { type: String },

        // ── Entrance & Category ───────────────────────────────────────
        entranceExamsGiven: [{ type: String }],
        entranceScore: { type: String },
        rankDetails: { type: String },
        category: { type: String },

        // ── Academics ─────────────────────────────────────────────────
        academicDetails: [AcademicDetailSchema],

        // ── Courses ───────────────────────────────────────────────────
        coursesInterested: [{ type: String }],

        // ── Preferences ───────────────────────────────────────────────
        sourceOfInformation: [{ type: String }],
        sourceOther: { type: String },
        collegeChoiceFactors: [{ type: String }],

        // ── Meta ──────────────────────────────────────────────────────
        submittedAt: { type: Date, default: Date.now },
        sheetSynced: { type: Boolean, default: false }, // true after Google Sheets write
    },
    { timestamps: true }
);

export default mongoose.models.Counslling ||
    mongoose.model('Counslling', CounsllingSchema);