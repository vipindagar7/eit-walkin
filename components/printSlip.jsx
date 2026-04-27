'use client';
import React, { useRef } from 'react';

/**
 * AdmissionPrintSlip
 * Props: { data: CounsllingDocument }
 *
 * Usage (receptionist dashboard):
 *   <AdmissionPrintSlip data={submission} />
 *
 * The component renders a clean A4 slip. Clicking "Print" opens the
 * browser print dialog showing ONLY this component (via @media print CSS).
 */
const formatLastVisit = (date) => {
    if (!date) return 'New';

    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function AdmissionPrintSlip({ data }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Admission Slip – ${data.fullName}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; background: #fff; }
                    .slip { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm 14mm 10mm; }
                    .header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 10px; margin-bottom: 14px; }
                    .header h1 { font-size: 15pt; color: #1a56db; text-transform: uppercase; letter-spacing: 1px; }
                    .header p  { font-size: 9pt; color: #555; margin-top: 3px; }
                    .slip-title { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .meta { display: flex; justify-content: space-between; font-size: 9pt; color: #555; margin-bottom: 12px; }
                    section { margin-bottom: 12px; }
                    section h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.4px; color: #1a56db; border-bottom: 1px solid #c7d8f8; padding-bottom: 3px; margin-bottom: 7px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 20px; }
                    .grid.three { grid-template-columns: 1fr 1fr 1fr; }
                    .field label { font-size: 8pt; color: #666; display: block; }
                    .field span  { font-size: 10pt; font-weight: 600; display: block; min-height: 14px; }
                    .full { grid-column: 1 / -1; }
                    .tag-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
                    .tag { background: #e8f0fe; color: #1a56db; border: 1px solid #b4cafc; border-radius: 10px; padding: 2px 9px; font-size: 8.5pt; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                    th { background: #1a56db; color: #fff; padding: 5px 7px; text-align: left; font-size: 8.5pt; }
                    td { padding: 4px 7px; border-bottom: 1px solid #e5e7eb; }
                    tr:nth-child(even) td { background: #f8f9ff; }
                    .footer { margin-top: 18px; border-top: 1px dashed #ccc; padding-top: 10px; display: flex; justify-content: space-between; }
                    .sig-box { text-align: center; width: 140px; }
                    .sig-box .line { border-bottom: 1px solid #333; height: 30px; margin-bottom: 4px; }
                    .sig-box p { font-size: 8pt; color: #555; }
                    .barcode { font-size: 8pt; color: #999; }
                    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    if (!data) return null;

    const acad = data.academicDetails || [];
    const xth = acad[0] || {};
    const xiith = acad[1] || {};
    const dip = acad[2] || {};

    const submittedAt = data.submittedAt || data.createdAt
        ? new Date(data.submittedAt || data.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : '—';

    return (
        <div>
            {/* Screen-only print button */}
            <button
                onClick={handlePrint}
                style={{
                    marginBottom: '16px',
                    padding: '9px 22px',
                    backgroundColor: '#1a56db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '7px',
                    fontWeight: '700',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                }}
            >
                🖨️ Print Admission Slip
            </button>

            {/* The actual slip — hidden behind print styles on screen */}
            <div ref={printRef}>
                <div className="slip">
                   <div className="header">
    <h1>Echelon Institute of Technology</h1>
    <p>
        Affiliated to GGSIPU, New Delhi &nbsp;|&nbsp; 
        Approved by AICTE &nbsp;|&nbsp; 
        Faridabad, Haryana
    </p>
</div>

<div className="slip-title">Counselling Registration Slip</div>

<div className="meta">
    <span>
        Submitted: <strong>{submittedAt}</strong>
    </span>

    <span>
       
    Last Visit: <strong>{ data.lastVisitDates ? data.lastVisitDates?.map((date, i) => (
  <span key={i}>{formatLastVisit(date)}</span>
)): "N/A" }</strong>
</span>

    <span className="barcode">
        ID: {String(data._id)}
    </span>
</div>

                    {/* Personal Info */}
                    <section>
                        <h2>Personal Information</h2>
                        <div className="grid">
                            <div className="field full">
                                <label>Full Name (as per 10th Certificate)</label>
                                <span>{data.fullName || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Gender</label>
                                <span>{data.gender || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Date of Birth</label>
                                <span>{data.dateOfBirth || '—'}</span>
                            </div>
                            <div className="field">
                                <label>{"Father's Name"}</label>
                                <span>{data.fatherName || '—'}</span>
                            </div>
                            <div className="field">
                                <label>{"Mother's Name"}</label>
                                <span>{data.motherName || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Student Contact No.</label>
                                <span>{data.studentContactNo || '—'}</span>
                            </div>
                            <div className="field">
                                <label>{"Father's Contact No."}</label>
                                <span>{data.fatherContactNo || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Alternate Contact</label>
                                <span>{data.alternateContact || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Email ID</label>
                                <span>{data.emailId || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Aadhaar Number</label>
                                <span>{data.aadhaarNumber || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Category</label>
                                <span>{data.category || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Nationality</label>
                                <span>{data.nationality || '—'}</span>
                            </div>
                            <div className="field full">
                                <label>Permanent Address</label>
                                <span>{data.permanentAddress || '—'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Entrance Exams */}
                    <section>
                        <h2>Entrance Exam Details</h2>
                        <div className="grid three">
                            <div className="field full">
                                <label>Exams Given</label>
                                <span>{(data.entranceExamsGiven || []).join(', ') || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Score</label>
                                <span>{data.entranceScore || '—'}</span>
                            </div>
                            <div className="field">
                                <label>Rank Details</label>
                                <span>{data.rankDetails || '—'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Academic Details */}
                    <section>
                        <h2>Academic Details</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Examination</th>
                                    <th>Subjects</th>
                                    <th>School / College</th>
                                    <th>Board / University</th>
                                    <th>Year</th>
                                    <th>Aggregate %</th>
                                    <th>PCM %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[xth, xiith, dip].map((row, i) => (
                                    <tr key={i}>
                                        <td><strong>{row.examination || ['Xth', 'XIIth', 'Diploma'][i]}</strong></td>
                                        <td>{row.subjects || '—'}</td>
                                        <td>{row.schoolOrCollegeName || '—'}</td>
                                        <td>{row.boardOrUniversity || '—'}</td>
                                        <td>{row.yearOfPassing || '—'}</td>
                                        <td>{row.aggregatePercentageCGPA || '—'}</td>
                                        <td>{row.pcmPercentage || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Courses */}
                    <section>
                        <h2>Courses Interested In</h2>
                        <div className="tag-list">
                            {(data.coursesInterested || []).length > 0
                                ? data.coursesInterested.map((c, i) => (
                                    <span key={i} className="tag">{c}</span>
                                ))
                                : <span>—</span>
                            }
                        </div>
                    </section>

                    {/* Preferences */}
                    <section>
                        <h2>Source & Preferences</h2>
                        <div className="grid">
                            <div className="field">
                                <label>Source of Information</label>
                                <span>
                                    {(data.sourceOfInformation || []).join(', ') || '—'}
                                    {data.sourceOther ? ` (${data.sourceOther})` : ''}
                                </span>
                            </div>
                            <div className="field full">
                                <label>College Choice Factors</label>
                                <span style={{ fontSize: '9pt' }}>
                                    {(data.collegeChoiceFactors || []).join(' • ') || '—'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}