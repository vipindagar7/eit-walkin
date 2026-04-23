"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from "next/navigation";

import toast from 'react-hot-toast';
import './AdmissionForm.css';

const ENTRANCE_EXAMS = ['CET', 'CUET', 'NIMCET', 'JEE MAINS', 'GATE', 'CMAT-2026', 'CAT-2025', 'None / Not Applicable'];
const CATEGORIES = ['General', 'SC', 'ST', 'OBC', 'EWS', 'Jain'];
const PROGRAMS = {
    "B.Tech": [
        "Computer Science and Engineering (CSE)",
        "Civil Engineering (CE)",
        "Mechanical Engineering (ME)",
        "Electronics & Communication Engineering (ECE)",
        "Mechatronics Engineering",
        "Robotics & Artificial Intelligence",
        "Artificial Intelligence & Data Science",
        "CSE Core",
        "Artificial Intelligence & Machine Learning",
        "Cyber Security",
        "Data Science",
        "Internet of Things and Cyber Security including Blockchain Technology"
    ],
    "BCA": ["General", "Data Science"],
    "BBA": ["General", "Digital Marketing", "Financial Services"],
    "M.Tech": ["Computer Science & Engineering (CSE)", "Mechanical Engineering (ME)"],
    "MBA": ["General"],
    "MCA": ["General"]
};
const SOURCE_OPTIONS = ['Website', 'Newspaper', 'Seminar', 'Friends', 'Social Media', 'Others'];
const COLLEGE_FACTORS = [
    'Strong Placement Record & Internship Opportunities',
    'Industry-Integrated Curriculum & Live Projects',
    'Modern Campus Infrastructure & Learning Environment',
    'Experienced & Supportive Faculty Mentors',
    'Skill Development, Certifications & Career Training',
    'Affordable Fee Structure & Scholarship Support',
    'Vibrant Campus Life (Sports, Cultural & Technical Clubs)',
    'Safe Campus with Good Connectivity',
    'Startup Incubation & Entrepreneurship Support',
    'Global Exposure / Industry Collaborations',
];

const STEPS = ['Personal Info', 'Entrance & Category', 'Academics', 'Courses', 'Preferences'];

const initialForm = {
    fullName: '', program: '', branch: '',
    fatherName: '', motherName: '', dateOfBirth: '', age: '',
    studentContactNo: '', fatherContactNo: '', alternateContact: '',
    emailId: '', aadhaarNumber: '', permanentAddress: '', gender: '',
    entranceExamsGiven: [], entranceScore: '', rankDetails: '',
    category: '', nationality: '',
    academicDetails: [
        { examination: 'Xth', schoolOrCollegeName: '', boardOrUniversity: '', yearOfPassing: '', aggregatePercentageCGPA: '', pcmPercentage: '', subjects: '' },
        { examination: 'XIIth', schoolOrCollegeName: '', boardOrUniversity: '', yearOfPassing: '', aggregatePercentageCGPA: '', pcmPercentage: '', subjects: '' },
        { examination: 'Diploma/Graduation (If applicable)', schoolOrCollegeName: '', boardOrUniversity: '', yearOfPassing: '', aggregatePercentageCGPA: '', pcmPercentage: '', subjects: '' },
    ],
    coursesInterested: [],
    sourceOfInformation: [], sourceOther: '',
    collegeChoiceFactors: [],
};

export default function AdmissionForm() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [showCoursePopup, setShowCoursePopup] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // ── OTP state ──────────────────────────────────────────────────────────
    const [otpVerified, setOtpVerified] = useState(false);    // true once verified
    const [showOtpModal, setShowOtpModal] = useState(false);  // modal visibility
    const [otpValue, setOtpValue] = useState('');             // what user types
    const [otpSending, setOtpSending] = useState(false);      // send API in-flight
    const [otpVerifying, setOtpVerifying] = useState(false);  // verify API in-flight
    const [otpResendTimer, setOtpResendTimer] = useState(0);  // countdown seconds
    const otpTimerRef = React.useRef(null);

    const router = useRouter();

    // Clear a field's error as soon as the user starts correcting it
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: false }));
    };

    const handleCheckbox = (field, value) => {
        setForm(prev => {
            const arr = prev[field];
            return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
        });
    };

    const handleAcademic = (idx, field, value) => {
        setForm(prev => {
            const updated = [...prev.academicDetails];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, academicDetails: updated };
        });
    };

    // ── OTP helpers ────────────────────────────────────────────────────────

    const startResendTimer = () => {
        setOtpResendTimer(30);
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = setInterval(() => {
            setOtpResendTimer(prev => {
                if (prev <= 1) { clearInterval(otpTimerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async () => {
        if (!/^\d{10}$/.test(form.studentContactNo)) {
            toast.error('Please enter a valid 10-digit mobile number first');
            setFieldErrors(prev => ({ ...prev, studentContactNo: true }));
            return;
        }
        setOtpSending(true);
        try {
            await axios.post('/api/send-otp', { phone: form.studentContactNo });
            toast.success(`OTP sent to +91 ${form.studentContactNo}`);
            setOtpValue('');
            setShowOtpModal(true);
            startResendTimer();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
            toast.error(msg);
        } finally {
            setOtpSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpValue.trim() || !/^\d{4,6}$/.test(otpValue)) {
            toast.error('Please enter the OTP (4–6 digits)');
            return;
        }
        setOtpVerifying(true);
        try {
            await axios.post('/api/verify-otp', { phone: form.studentContactNo, otp: otpValue });
            setOtpVerified(true);
            setShowOtpModal(false);
            clearInterval(otpTimerRef.current);
            toast.success('Mobile number verified successfully ✓');
        } catch (err) {
            const msg = err.response?.data?.message || 'Incorrect OTP. Please try again.';
            toast.error(msg);
            setOtpValue('');
        } finally {
            setOtpVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        if (otpResendTimer > 0) return;
        await handleSendOtp();
    };

    // Reset OTP verification if the phone number changes
    const handleChangeWithOtpReset = (e) => {
        handleChange(e);
        if (e.target.name === 'studentContactNo' && otpVerified) {
            setOtpVerified(false);
            setOtpValue('');
        }
    };

    const validateStep = () => {
        const errs = {};

        // ── Step 0: Personal Info ──────────────────────────────────────────
        if (step === 0) {
            if (!form.fullName.trim()) {
                toast.error('Full Name is required'); errs.fullName = true;
            } else if (!/^[A-Za-z\s.'-]{2,}$/.test(form.fullName.trim())) {
                toast.error('Full Name must contain only letters'); errs.fullName = true;
            }
            if (!form.gender) {
                toast.error('Please select your Gender'); errs.gender = true;
            }
            if (!form.dateOfBirth) {
                toast.error('Date of Birth is required'); errs.dateOfBirth = true;
            } else {
                const dob = new Date(form.dateOfBirth);
                const today = new Date();
                const age = today.getFullYear() - dob.getFullYear();
                if (dob >= today) { toast.error('Date of Birth must be in the past'); errs.dateOfBirth = true; }
                else if (age < 15 || age > 40) { toast.error('Age must be between 15 and 40 years'); errs.dateOfBirth = true; }
            }
            if (!form.studentContactNo.trim()) {
                toast.error('Student Contact No. is required'); errs.studentContactNo = true;
            } else if (!/^\d{10}$/.test(form.studentContactNo)) {
                toast.error('Student Contact No. must be exactly 10 digits'); errs.studentContactNo = true;
            }
            if (form.fatherContactNo && !/^\d{10}$/.test(form.fatherContactNo)) {
                toast.error("Father's Contact No. must be exactly 10 digits"); errs.fatherContactNo = true;
            }
            if (form.alternateContact && !/^\d{10}$/.test(form.alternateContact)) {
                toast.error('Alternate Contact must be exactly 10 digits'); errs.alternateContact = true;
            }
            if (!form.emailId.trim()) {
                toast.error('Email ID is required'); errs.emailId = true;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId.trim())) {
                toast.error('Please enter a valid Email ID'); errs.emailId = true;
            }
            if (form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber)) {
                toast.error('Aadhaar Number must be exactly 12 digits'); errs.aadhaarNumber = true;
            }
            if (!form.permanentAddress.trim()) {
                toast.error('Permanent Address is required'); errs.permanentAddress = true;
            }
        }

        // ── Step 1: Entrance & Category ────────────────────────────────────
        if (step === 1) {
            if (!form.category) {
                toast.error('Please select a Category'); errs.category = true;
            }
            if (form.entranceExamsGiven.length === 0) {
                toast.error('Please select at least one Entrance Exam (or "None / Not Applicable")'); errs.entranceExamsGiven = true;
            }
            const hasNone = form.entranceExamsGiven.includes('None / Not Applicable');
            const hasRealExam = form.entranceExamsGiven.some(e => e !== 'None / Not Applicable');
            if (hasRealExam && !hasNone && !form.entranceScore.trim()) {
                toast.error('Please enter your Entrance Score'); errs.entranceScore = true;
            }
        }

        // ── Step 2: Academic Details ───────────────────────────────────────
        if (step === 2) {
            const xth = form.academicDetails[0];
            const xiith = form.academicDetails[1];

            if (!xth.schoolOrCollegeName.trim()) {
                toast.error('Xth: School/College Name is required'); errs['acad_0_school'] = true;
            }
            if (!xth.boardOrUniversity.trim()) {
                toast.error('Xth: Board/University is required'); errs['acad_0_board'] = true;
            }
            if (!xth.yearOfPassing.trim()) {
                toast.error('Xth: Year of Passing is required'); errs['acad_0_year'] = true;
            } else if (!/^\d{4}$/.test(xth.yearOfPassing) || +xth.yearOfPassing < 2000 || +xth.yearOfPassing > new Date().getFullYear()) {
                toast.error('Xth: Enter a valid 4-digit Year of Passing'); errs['acad_0_year'] = true;
            }
            if (!xth.aggregatePercentageCGPA.trim()) {
                toast.error('Xth: Aggregate % / CGPA is required'); errs['acad_0_agg'] = true;
            }

            if (!xiith.schoolOrCollegeName.trim()) {
                toast.error('XIIth: School/College Name is required'); errs['acad_1_school'] = true;
            }
            if (!xiith.boardOrUniversity.trim()) {
                toast.error('XIIth: Board/University is required'); errs['acad_1_board'] = true;
            }
            if (!xiith.yearOfPassing.trim()) {
                toast.error('XIIth: Year of Passing is required'); errs['acad_1_year'] = true;
            } else if (!/^\d{4}$/.test(xiith.yearOfPassing) || +xiith.yearOfPassing < 2000 || +xiith.yearOfPassing > new Date().getFullYear() + 1) {
                toast.error('XIIth: Enter a valid 4-digit Year of Passing'); errs['acad_1_year'] = true;
            }
            if (!xiith.aggregatePercentageCGPA.trim()) {
                toast.error('XIIth: Aggregate % / CGPA is required'); errs['acad_1_agg'] = true;
            }
        }

        // ── Step 3: Courses ────────────────────────────────────────────────
        if (step === 3) {
            if (!form.coursesInterested.length) {
                toast.error('Please select at least one course before proceeding'); errs.coursesInterested = true;
            }
        }

        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return false; }
        setFieldErrors({});
        return true;
    };

    const nextStep = () => {
        if (!validateStep()) return;
        // After Step 0 passes validation, require OTP before advancing
        if (step === 0 && !otpVerified) {
            handleSendOtp();
            return;
        }
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);


    const handleSubmit = async () => {
        // ── Step 4 (Preferences) validation on submit ──────────────────────
        if (!form.sourceOfInformation.length) {
            toast.error('Please select how you heard about Echelon'); return;
        }
        if (form.sourceOfInformation.includes('Others') && !form.sourceOther.trim()) {
            toast.error('Please specify your source of information'); return;
        }
        if (!form.collegeChoiceFactors.length) {
            toast.error('Please select at least one college choice factor'); return;
        }

        // ── Cross-step safety re-checks ────────────────────────────────────
        if (!form.coursesInterested?.length) {
            toast.error('Please select at least one course'); return;
        }
        if (!form.fullName?.trim() || !form.emailId?.trim()) {
            toast.error('Full Name and Email are required'); return;
        }
        if (!/^\d{10}$/.test(form.studentContactNo)) {
            toast.error('Enter a valid 10-digit mobile number'); return;
        }
        setLoading(true);
        try {
            await axios.post("/api/counslling", form); // ✅ fixed API

            toast.success("Form submitted successfully!");

            setForm(initialForm);
            setStep(0);

            router.replace("/success");

        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Submission failed. Please try again.";

            toast.error(message);
            console.error("Admission Error:", err);

        } finally {
            setLoading(false);
        }
    };

    // Returns inline style to highlight a field red when it has an error
    const errStyle = (key) => fieldErrors[key]
        ? { border: '1.5px solid #e53e3e', borderRadius: '6px', boxShadow: '0 0 0 3px rgba(229,62,62,0.15)' }
        : {};

    return (
        <div className="form-wrapper">
            {/* Header */}
            <header className="form-header">
                <div className="header-content">
                    <div className="header-logo">
                        <img src="/eitLogoWhite.png" alt="Echelon Institute of Technology" />
                    </div>
                    <div className="header-text">
                        <h1>ECHELON INSTITUTE OF TECHNOLOGY</h1>
                        <p>Affiliated to GGSIPU, New Delhi | Approved by AICTE | Academic Session 2026-27</p>
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <div className="stepper">
                {STEPS.map((label, i) => (
                    <div key={i} className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                        <div className="step-circle">{i < step ? '✓' : i + 1}</div>
                        <span className="step-label">{label}</span>
                        {i < STEPS.length - 1 && <div className="step-line" />}
                    </div>
                ))}
            </div>

            <div className="form-card">
                {/* STEP 0: Personal Info */}
                {step === 0 && (
                    <div className="step-content">
                        <h2 className="section-title">Personal Information</h2>
                        <div className="form-grid">
                            <div className="field full">
                                <label>Full Name <span className="req">*</span><small> (as per 10th Certificate)</small></label>
                                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" style={errStyle('fullName')} />
                            </div>
                            <div className="field">
                                <label>{"Father's Name"}</label>
                                <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father's name" />
                            </div>
                            <div className="field">
                                <label>{"Mother's Name"}</label>
                                <input name="motherName" value={form.motherName} onChange={handleChange} placeholder="Mother's name" />
                            </div>
                            <div className="field">
                                <label>Date of Birth <span className="req">*</span></label>
                                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} style={errStyle('dateOfBirth')} />
                            </div>
                            <div className="field">
                                <label>Age</label>
                                <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="Age" min="15" max="35" />
                            </div>
                            <div className="field">
                                <label>
                                    Student Contact No. <span className="req">*</span>
                                    {otpVerified && (
                                        <span style={{
                                            marginLeft: '8px',
                                            color: '#16a34a',
                                            fontWeight: '600',
                                            fontSize: '0.8rem',
                                            backgroundColor: '#dcfce7',
                                            border: '1px solid #16a34a',
                                            borderRadius: '12px',
                                            padding: '1px 8px',
                                            verticalAlign: 'middle',
                                        }}>✓ Verified</span>
                                    )}
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        name="studentContactNo"
                                        value={form.studentContactNo}
                                        onChange={handleChangeWithOtpReset}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                        style={{ flex: 1, ...errStyle('studentContactNo') }}
                                        disabled={otpVerified}
                                    />
                                    {!otpVerified && (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={otpSending || form.studentContactNo.length !== 10}
                                            style={{
                                                flexShrink: 0,
                                                padding: '0 14px',
                                                height: '40px',
                                                fontSize: '0.82rem',
                                                fontWeight: '600',
                                                borderRadius: '6px',
                                                border: '1.5px solid var(--primary, #1a56db)',
                                                backgroundColor: form.studentContactNo.length === 10 ? 'var(--primary, #1a56db)' : '#e5e7eb',
                                                color: form.studentContactNo.length === 10 ? '#fff' : '#9ca3af',
                                                cursor: form.studentContactNo.length === 10 ? 'pointer' : 'not-allowed',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {otpSending ? 'Sending…' : 'Send OTP'}
                                        </button>
                                    )}
                                </div>
                                {!otpVerified && (
                                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                                        OTP will be sent to this number. Clicking “Next” will also trigger it.
                                    </p>
                                )}
                            </div>
                            <div className="field">
                                <label>{"Father's Contact No."}</label>
                                <input name="fatherContactNo" value={form.fatherContactNo} onChange={handleChange} placeholder="Father's mobile number" maxLength="10" style={errStyle('fatherContactNo')} />
                            </div>
                            <div className="field">
                                <label>Alternate Contact</label>
                                <input name="alternateContact" value={form.alternateContact} onChange={handleChange} placeholder="Alternate contact" maxLength="10" style={errStyle('alternateContact')} />
                            </div>
                            <div className="field">
                                <label>Email ID <span className="req">*</span></label>
                                <input type="email" name="emailId" value={form.emailId} onChange={handleChange} placeholder="student@email.com" style={errStyle('emailId')} />
                            </div>
                            <div className="field">
                                <label>Aadhaar Number</label>
                                <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} placeholder="12-digit Aadhaar" maxLength="12" style={errStyle('aadhaarNumber')} />
                            </div>
                            <div className="field full">
                                <label>Permanent Address <span className="req">*</span></label>
                                <textarea name="permanentAddress" value={form.permanentAddress} onChange={handleChange} placeholder="Enter full address" rows="2" style={errStyle('permanentAddress')} />
                            </div>
                            <div className="field">
                                <label>Gender <span className="req">*</span></label>
                                <div className="radio-group" style={fieldErrors.gender ? { padding: '6px', borderRadius: '6px', border: '1.5px solid #e53e3e' } : {}}>
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <label key={g} className="radio-label">
                                            <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={handleChange} />
                                            {g}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: Entrance & Category */}
                {step === 1 && (
                    <div className="step-content">
                        <h2 className="section-title">Entrance Exam & Category</h2>
                        <div className="form-section">
                            <label className="group-label">Entrance Exam Given <span className="req">*</span><small> (select all that apply, or "None / Not Applicable")</small></label>
                            <div className="checkbox-grid" style={fieldErrors.entranceExamsGiven ? { padding: '8px', borderRadius: '6px', border: '1.5px solid #e53e3e' } : {}}>
                                {ENTRANCE_EXAMS.map(exam => (
                                    <label key={exam} className="checkbox-label">
                                        <input type="checkbox" checked={form.entranceExamsGiven.includes(exam)}
                                            onChange={() => {
                                                handleCheckbox('entranceExamsGiven', exam);
                                                if (fieldErrors.entranceExamsGiven) setFieldErrors(prev => ({ ...prev, entranceExamsGiven: false }));
                                            }} />
                                        {exam}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-grid">
                            {form.entranceExamsGiven.some(e => e !== 'None / Not Applicable') && (
                                <div className="field">
                                    <label>Entrance Score <span className="req">*</span></label>
                                    <input name="entranceScore" value={form.entranceScore} onChange={handleChange} placeholder="Score obtained" style={errStyle('entranceScore')} />
                                </div>
                            )}
                            <div className="field">
                                <label>Rank Details</label>
                                <input name="rankDetails" value={form.rankDetails} onChange={handleChange} placeholder="Rank details" />
                            </div>
                        </div>
                        <div className="form-section">
                            <label className="group-label">Category <span className="req">*</span></label>
                            <div className="checkbox-grid" style={fieldErrors.category ? { padding: '8px', borderRadius: '6px', border: '1.5px solid #e53e3e' } : {}}>
                                {CATEGORIES.map(cat => (
                                    <label key={cat} className="radio-label">
                                        <input type="radio" name="category" value={cat} checked={form.category === cat}
                                            onChange={(e) => { handleChange(e); setFieldErrors(prev => ({ ...prev, category: false })); }} />
                                        {cat}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="field">
                                <label>Nationality</label>
                                <input name="nationality" value={form.nationality} onChange={handleChange} placeholder="e.g. Indian" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Academic Details */}
                {step === 2 && (
                    <div className="step-content">
                        <h2 className="section-title">Academic Details</h2>
                        {form.academicDetails.map((row, idx) => (
                            <div className="academic-block" key={idx}>
                                <h3 className="academic-title">{row.examination}</h3>
                                <div className="form-grid">
                                    <div className="field full">
                                        <label>School / College Name{idx < 2 && <span className="req"> *</span>}</label>
                                        <input value={row.schoolOrCollegeName}
                                            onChange={e => { handleAcademic(idx, 'schoolOrCollegeName', e.target.value); setFieldErrors(p => ({ ...p, [`acad_${idx}_school`]: false })); }}
                                            placeholder="Enter institution name (Delhi / Outside Delhi)"
                                            style={errStyle(`acad_${idx}_school`)} />
                                    </div>
                                    <div className="field">
                                        <label>Board / University{idx < 2 && <span className="req"> *</span>}</label>
                                        <input value={row.boardOrUniversity}
                                            onChange={e => { handleAcademic(idx, 'boardOrUniversity', e.target.value); setFieldErrors(p => ({ ...p, [`acad_${idx}_board`]: false })); }}
                                            placeholder="e.g. CBSE, GGSIPU"
                                            style={errStyle(`acad_${idx}_board`)} />
                                    </div>
                                    <div className="field">
                                        <label>Year of Passing{idx < 2 && <span className="req"> *</span>}</label>
                                        <input value={row.yearOfPassing}
                                            onChange={e => { handleAcademic(idx, 'yearOfPassing', e.target.value); setFieldErrors(p => ({ ...p, [`acad_${idx}_year`]: false })); }}
                                            placeholder="e.g. 2024" maxLength="4"
                                            style={errStyle(`acad_${idx}_year`)} />
                                    </div>
                                    <div className="field">
                                        <label>Aggregate % / CGPA{idx < 2 && <span className="req"> *</span>}</label>
                                        <input value={row.aggregatePercentageCGPA}
                                            onChange={e => { handleAcademic(idx, 'aggregatePercentageCGPA', e.target.value); setFieldErrors(p => ({ ...p, [`acad_${idx}_agg`]: false })); }}
                                            placeholder="e.g. 85% or 8.5 CGPA"
                                            style={errStyle(`acad_${idx}_agg`)} />
                                    </div>
                                    {idx === 1 && (
                                        <div className="field">
                                            <label>PCM %</label>
                                            <input value={row.pcmPercentage}
                                                onChange={e => handleAcademic(idx, 'pcmPercentage', e.target.value)}
                                                placeholder="PCM percentage" />
                                        </div>
                                    )}
                                    <div className="field full">
                                        <label>Subjects (mention all)</label>
                                        <input value={row.subjects}
                                            onChange={e => handleAcademic(idx, 'subjects', e.target.value)}
                                            placeholder="e.g. Physics, Chemistry, Mathematics, English" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 3: Courses Interested */}
                {step === 3 && (
                    <div className="step-content">
                        <h2 className="section-title">Courses Interested In</h2>
                        <div className="form-section">
                            <p style={{ marginBottom: '16px', color: 'var(--text-secondary, #555)', fontSize: '0.95rem' }}>
                                Select the program and branches you are interested in applying for.
                            </p>

                            {/* Trigger Button */}
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setShowCoursePopup(true)}
                                style={{ marginBottom: '20px' }}
                            >
                                🎓 Select Program &amp; Branch
                            </button>

                            {/* Selected Courses Display */}
                            {form.coursesInterested.length > 0 && (
                                <div className="selected-courses-wrapper" style={{ marginTop: '8px' }}>
                                    <label className="group-label" style={{ marginBottom: '10px', display: 'block' }}>
                                        Selected Courses ({form.coursesInterested.length}):
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {form.coursesInterested.map((course) => (
                                            <span
                                                key={course}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    backgroundColor: 'var(--primary-light, #e8f0fe)',
                                                    color: 'var(--primary, #1a56db)',
                                                    border: '1px solid var(--primary, #1a56db)',
                                                    borderRadius: '20px',
                                                    padding: '4px 12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {course}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setForm(prev => ({
                                                            ...prev,
                                                            coursesInterested: prev.coursesInterested.filter(c => c !== course)
                                                        }))
                                                    }
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'inherit',
                                                        fontSize: '1rem',
                                                        lineHeight: 1,
                                                        padding: '0',
                                                    }}
                                                    aria-label={`Remove ${course}`}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {form.coursesInterested.length === 0 && (
                                <p style={{ color: 'var(--error, #c0392b)', fontSize: '0.85rem', marginTop: '4px' }}>
                                    * Please select at least one course to proceed.
                                </p>
                            )}
                        </div>

                        {/* Course Selection Popup / Modal */}
                        {showCoursePopup && (
                            <div
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000,
                                    padding: '16px',
                                }}
                                onClick={(e) => { if (e.target === e.currentTarget) setShowCoursePopup(false); }}
                            >
                                <div
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        width: '100%',
                                        maxWidth: '520px',
                                        maxHeight: '85vh',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Modal Header */}
                                    <div style={{
                                        padding: '20px 24px 16px',
                                        borderBottom: '1px solid #e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexShrink: 0,
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1a202c' }}>
                                            🎓 Select Program &amp; Branch
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowCoursePopup(false)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '1.4rem',
                                                cursor: 'pointer',
                                                color: '#6b7280',
                                                lineHeight: 1,
                                                padding: '2px 6px',
                                            }}
                                            aria-label="Close modal"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Modal Body — scrollable */}
                                    <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                                        {/* Program Dropdown */}
                                        <div className="field" style={{ marginBottom: '20px' }}>
                                            <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                                                Step 1: Select a Program <span className="req">*</span>
                                            </label>
                                            <select
                                                value={selectedProgram}
                                                onChange={(e) => setSelectedProgram(e.target.value)}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="">-- Choose a Program --</option>
                                                {Object.keys(PROGRAMS).map(prog => (
                                                    <option key={prog} value={prog}>{prog}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Branch Checkboxes — shown only after program is selected */}
                                        {selectedProgram && (
                                            <div className="field">
                                                <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                                                    Step 2: Select Branch(es) under <strong>{selectedProgram}</strong>
                                                </label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {PROGRAMS[selectedProgram].map(branch => {
                                                        const courseValue = `${selectedProgram} - ${branch}`;
                                                        const isChecked = form.coursesInterested.includes(courseValue);
                                                        return (
                                                            <label
                                                                key={branch}
                                                                className="checkbox-label"
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    padding: '10px 12px',
                                                                    borderRadius: '8px',
                                                                    border: `1px solid ${isChecked ? 'var(--primary, #1a56db)' : '#e5e7eb'}`,
                                                                    backgroundColor: isChecked ? 'var(--primary-light, #e8f0fe)' : '#fafafa',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s ease',
                                                                    fontSize: '0.9rem',
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleCheckbox('coursesInterested', courseValue)}
                                                                    style={{ accentColor: 'var(--primary, #1a56db)', width: '16px', height: '16px', flexShrink: 0 }}
                                                                />
                                                                {branch}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {!selectedProgram && (
                                            <p style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center', marginTop: '8px' }}>
                                                ☝️ Please select a program above to see available branches.
                                            </p>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    <div style={{
                                        padding: '16px 24px',
                                        borderTop: '1px solid #e5e7eb',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexShrink: 0,
                                        backgroundColor: '#f9fafb',
                                    }}>
                                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                            {form.coursesInterested.length} course{form.coursesInterested.length !== 1 ? 's' : ''} selected
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => {
                                                setShowCoursePopup(false);
                                                setSelectedProgram('');
                                            }}
                                        >
                                            ✓ Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: Preferences */}
                {step === 4 && (
                    <div className="step-content">
                        <h2 className="section-title">Source & Preferences</h2>
                        <div className="form-section">
                            <label className="group-label">How did you come to know about Echelon?</label>
                            <div className="checkbox-grid">
                                {SOURCE_OPTIONS.map(src => (
                                    <label key={src} className="checkbox-label">
                                        <input type="checkbox" checked={form.sourceOfInformation.includes(src)}
                                            onChange={() => handleCheckbox('sourceOfInformation', src)} />
                                        {src}
                                    </label>
                                ))}
                            </div>
                            {form.sourceOfInformation.includes('Others') && (
                                <div className="field" style={{ marginTop: '12px' }}>
                                    <input name="sourceOther" value={form.sourceOther} onChange={handleChange}
                                        placeholder="Please specify other source" />
                                </div>
                            )}
                        </div>
                        <div className="form-section">
                            <label className="group-label">What matters most to you while choosing a college? <small>(select all that apply)</small></label>
                            <div className="checkbox-grid two-col">
                                {COLLEGE_FACTORS.map(f => (
                                    <label key={f} className="checkbox-label">
                                        <input type="checkbox" checked={form.collegeChoiceFactors.includes(f)}
                                            onChange={() => handleCheckbox('collegeChoiceFactors', f)} />
                                        {f}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="form-nav">
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={prevStep}>← Previous</button>
                    )}
                    {step < STEPS.length - 1 && (
                        <button className="btn btn-primary" onClick={nextStep}>
                            {step === 0 && !otpVerified ? '🔐 Verify & Next →' : 'Next →'}
                        </button>
                    )}
                    {step === STEPS.length - 1 && (
                        <button className="btn btn-submit" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting...' : '✓ Submit Application'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── OTP Verification Modal ─────────────────────────────────── */}
            {showOtpModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '16px',
                    }}
                >
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '14px',
                        width: '100%',
                        maxWidth: '400px',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                        overflow: 'hidden',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#1a202c' }}>
                                    📱 Verify Mobile Number
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                                    OTP sent to <strong>+91 {form.studentContactNo}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowOtpModal(false)}
                                style={{
                                    background: 'none', border: 'none', fontSize: '1.4rem',
                                    cursor: 'pointer', color: '#6b7280', lineHeight: 1, padding: '2px 6px',
                                }}
                                aria-label="Close OTP modal"
                            >×</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px' }}>
                            <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '8px', color: '#374151' }}>
                                Enter OTP <span style={{ color: '#e53e3e' }}>*</span>
                            </label>
                            <input
                                type="tel"
                                value={otpValue}
                                onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 4–6 digit OTP"
                                maxLength={6}
                                autoFocus
                                style={{
                                    width: '100%',
                                    color:"black",
                                    padding: '12px 14px',
                                    fontSize: '1.4rem',
                                    letterSpacing: '0.35em',
                                    textAlign: 'center',
                                    borderRadius: '8px',
                                    border: '1.5px solid #d1d5db',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                            />

                            {/* Resend row */}
                            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#6b7280', textAlign: 'right' }}>
                                {otpResendTimer > 0 ? (
                                    <span>Resend OTP in <strong>{otpResendTimer}s</strong></span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={otpSending}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--primary, #1a56db)', fontWeight: '600',
                                            fontSize: '0.82rem', padding: 0,
                                        }}
                                    >
                                        {otpSending ? 'Sending…' : '↻ Resend OTP'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '0 24px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleVerifyOtp}
                                disabled={otpVerifying || otpValue.length < 4}
                                style={{ width: '100%', justifyContent: 'center', opacity: otpValue.length < 4 ? 0.6 : 1 }}
                            >
                                {otpVerifying ? 'Verifying…' : '✓ Verify OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowOtpModal(false)}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '7px',
                                    border: '1px solid #d1d5db', background: '#f9fafb',
                                    cursor: 'pointer', fontSize: '0.88rem', color: '#374151',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="form-footer">
                <p>Echelon Institute of Technology, Faridabad | Affiliated to GGSIPU, New Delhi | Approved by AICTE</p>
            </footer>
        </div>
    );
}