import mongoose from 'mongoose';

const AcademicDetailSchema = new mongoose.Schema({
    examination: String,
    schoolOrCollegeName: String,
    boardOrUniversity: String,
    yearOfPassing: String,
    aggregatePercentageCGPA: String,
    pcmPercentage: String,
    subjects: String,
});

const CounsellingNoteSchema = new mongoose.Schema({
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    counsellorName: String,
    note: String,
    outcome: { type: String, enum: ['Interested', 'Not Interested', 'Follow Up', 'Admitted', 'Pending'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const AdmissionSchema = new mongoose.Schema({
    // Status
    status: {
        type: String,
        enum: ['Waiting', 'In Counselling', 'Counselled', 'Admitted', 'Not Interested'],
        default: 'Waiting'
    },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedCounsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Personal Details
    fullName: { type: String, required: true, trim: true },
    program: String,
    branch: String,
    fatherName: String,
    motherName: String,
    dateOfBirth: Date,
    age: Number,
    studentContactNo: { type: String, trim: true },
    fatherContactNo: String,
    alternateContact: String,
    emailId: { type: String, trim: true, lowercase: true },
    aadhaarNumber: String,
    permanentAddress: String,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },

    // Entrance Exam
    entranceExamsGiven: [String],
    entranceScore: String,
    rankDetails: String,

    // Category
    category: { type: String, enum: ['General', 'SC', 'ST', 'OBC', 'EWS', 'Jain'] },
    nationality: String,

    // Academic Details
    academicDetails: [AcademicDetailSchema],

    // Courses
    coursesInterested: [String],

    // Source
    sourceOfInformation: [String],
    sourceOther: String,
    collegeChoiceFactors: [String],

    // Counselling
    counsellingNotes: [CounsellingNoteSchema],

    submittedAt: { type: Date, default: Date.now },
    academicSession: { type: String, default: '2026-27' },
    updatedAt: { type: Date, default: Date.now }
});

AdmissionSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.model('Admission', AdmissionSchema);