"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from "next/navigation";

import toast from 'react-hot-toast';
import './AdmissionForm.css';

const ENTRANCE_EXAMS = ['CET', 'CUET', 'NIMCET', 'JEE MAINS', 'GATE', 'CMAT-2026', 'CAT-2025'];
const CATEGORIES = ['General', 'SC', 'ST', 'OBC', 'EWS', 'Jain'];
const BTECH_COURSES = [
    'CSE', 'CSE (AI & ML)', 'CSE (Cyber Security)', 'CSE (Data Science)',
    'CSE (AI & DS)', 'Robotics & AI', 'Mechatronics Engineering',
    'CSE (IoT & Cyber Security incl. Blockchain)', 'ME', 'ECE', 'Civil'
];
const OTHER_COURSES = [
    'BBA - General', 'BBA - Digital Marketing', 'BBA - IFBS',
    'BCA - General', 'BCA - Data Science',
    'MBA - Management', 'MCA - Computer Applications',
    'M.Tech - CSE', 'M.Tech - ME'
];
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
    const router = useRouter();


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
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

    const validateStep = () => {
        if (step === 0) {
            if (!form.fullName.trim()) { toast.error('Full Name is required'); return false; }
            if (!form.gender) { toast.error('Please select Gender'); return false; }
            if (!form.studentContactNo.trim()) { toast.error('Student Contact No. is required'); return false; }
            if (!form.emailId.trim()) { toast.error('Email ID is required'); return false; }
        }
        if (step === 1) {
            if (!form.category) { toast.error('Please select a Category'); return false; }
        }
        return true;
    };

    const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
    const prevStep = () => setStep(s => s - 1);


    const handleSubmit = async () => {
        // Course validation
        if (!form.coursesInterested?.length) {
            toast.error("Please select at least one course");
            return;
        }
        // Correct field validation
        if (!form.fullName?.trim() || !form.emailId?.trim()) {
            toast.error("Full Name and Email are required");
            return;
        }
        // Mobile validation (important)
        if (form.studentContactNo.length !== 10) {
            toast.error("Enter valid 10-digit mobile number");
            return;
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
                                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter full name" />
                            </div>
                            <div className="field">
                                <label>Program</label>
                                <select name="program" value={form.program} onChange={handleChange}>
                                    <option value="">Select Program</option>
                                    <option>B.Tech</option><option>BBA</option><option>BCA</option>
                                    <option>MBA</option><option>MCA</option><option>M.Tech</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Branch</label>
                                <input name="branch" value={form.branch} onChange={handleChange} placeholder="e.g. CSE, ECE" />
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
                                <label>Date of Birth</label>
                                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
                            </div>
                            <div className="field">
                                <label>Age</label>
                                <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="Age" min="15" max="35" />
                            </div>
                            <div className="field">
                                <label>Student Contact No. <span className="req">*</span></label>
                                <input name="studentContactNo" value={form.studentContactNo} onChange={handleChange} placeholder="10-digit mobile number" maxLength="10" />
                            </div>
                            <div className="field">
                                <label>{"Father's Contact No."}</label>
                                <input name="fatherContactNo" value={form.fatherContactNo} onChange={handleChange} placeholder="Father's mobile number" maxLength="10" />
                            </div>
                            <div className="field">
                                <label>Alternate Contact</label>
                                <input name="alternateContact" value={form.alternateContact} onChange={handleChange} placeholder="Alternate contact" />
                            </div>
                            <div className="field">
                                <label>Email ID <span className="req">*</span></label>
                                <input type="email" name="emailId" value={form.emailId} onChange={handleChange} placeholder="student@email.com" />
                            </div>
                            <div className="field">
                                <label>Aadhaar Number</label>
                                <input name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} placeholder="12-digit Aadhaar" maxLength="12" />
                            </div>
                            <div className="field full">
                                <label>Permanent Address</label>
                                <textarea name="permanentAddress" value={form.permanentAddress} onChange={handleChange} placeholder="Enter full address" rows="2" />
                            </div>
                            <div className="field">
                                <label>Gender <span className="req">*</span></label>
                                <div className="radio-group">
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
                            <label className="group-label">Entrance Exam Given (select all that apply)</label>
                            <div className="checkbox-grid">
                                {ENTRANCE_EXAMS.map(exam => (
                                    <label key={exam} className="checkbox-label">
                                        <input type="checkbox" checked={form.entranceExamsGiven.includes(exam)}
                                            onChange={() => handleCheckbox('entranceExamsGiven', exam)} />
                                        {exam}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="field">
                                <label>Entrance Score</label>
                                <input name="entranceScore" value={form.entranceScore} onChange={handleChange} placeholder="Score obtained" />
                            </div>
                            <div className="field">
                                <label>Rank Details</label>
                                <input name="rankDetails" value={form.rankDetails} onChange={handleChange} placeholder="Rank details" />
                            </div>
                        </div>
                        <div className="form-section">
                            <label className="group-label">Category <span className="req">*</span></label>
                            <div className="checkbox-grid">
                                {CATEGORIES.map(cat => (
                                    <label key={cat} className="radio-label">
                                        <input type="radio" name="category" value={cat} checked={form.category === cat} onChange={handleChange} />
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
                                        <label>School / College Name</label>
                                        <input value={row.schoolOrCollegeName}
                                            onChange={e => handleAcademic(idx, 'schoolOrCollegeName', e.target.value)}
                                            placeholder="Enter institution name (Delhi / Outside Delhi)" />
                                    </div>
                                    <div className="field">
                                        <label>Board / University</label>
                                        <input value={row.boardOrUniversity}
                                            onChange={e => handleAcademic(idx, 'boardOrUniversity', e.target.value)}
                                            placeholder="e.g. CBSE, GGSIPU" />
                                    </div>
                                    <div className="field">
                                        <label>Year of Passing</label>
                                        <input value={row.yearOfPassing}
                                            onChange={e => handleAcademic(idx, 'yearOfPassing', e.target.value)}
                                            placeholder="e.g. 2024" maxLength="4" />
                                    </div>
                                    <div className="field">
                                        <label>Aggregate % / CGPA</label>
                                        <input value={row.aggregatePercentageCGPA}
                                            onChange={e => handleAcademic(idx, 'aggregatePercentageCGPA', e.target.value)}
                                            placeholder="e.g. 85% or 8.5 CGPA" />
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
                            <label className="group-label">B.Tech Programs</label>
                            <div className="checkbox-grid">
                                {BTECH_COURSES.map(c => (
                                    <label key={c} className="checkbox-label">
                                        <input type="checkbox" checked={form.coursesInterested.includes(c)}
                                            onChange={() => handleCheckbox('coursesInterested', c)} />
                                        {c}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-section">
                            <label className="group-label">Other Programs (BBA / BCA / MBA / MCA / M.Tech)</label>
                            <div className="checkbox-grid">
                                {OTHER_COURSES.map(c => (
                                    <label key={c} className="checkbox-label">
                                        <input type="checkbox" checked={form.coursesInterested.includes(c)}
                                            onChange={() => handleCheckbox('coursesInterested', c)} />
                                        {c}
                                    </label>
                                ))}
                            </div>
                        </div>
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
                        <button className="btn btn-primary" onClick={nextStep}>Next →</button>
                    )}
                    {step === STEPS.length - 1 && (
                        <button className="btn btn-submit" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting...' : '✓ Submit Application'}
                        </button>
                    )}
                </div>
            </div>

            <footer className="form-footer">
                <p>Echelon Institute of Technology, Faridabad | Affiliated to GGSIPU, New Delhi | Approved by AICTE</p>
                <p><a href="/login">Admin Dashboard</a></p>
            </footer>
        </div>
    );
}