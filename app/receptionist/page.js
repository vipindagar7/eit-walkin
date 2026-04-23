'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import AdmissionPrintSlip from '@/components/printSlip';

const CORRECT_PIN = process.env.NEXT_PUBLIC_RECEPTIONIST_PIN || '1234';

export default function ReceptionistDashboard() {
    const [authed, setAuthed] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');

    const [submissions, setSubmissions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [search, setSearch] = useState('');

    const limit = 20;

    // FETCH DATA
    const fetchSubmissions = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/counslling?page=${p}&limit=${limit}`);
            setSubmissions(data.submissions || []);
            setTotal(data.total || 0);
            setPage(p);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedPin = localStorage.getItem('receptionist_pin');
        if (storedPin === CORRECT_PIN) {
            setAuthed(true);
        } else {
            localStorage.removeItem('receptionist_pin');
        }
    }, []);

    useEffect(() => {
        if (authed) fetchSubmissions(1);
    }, [authed, fetchSubmissions]);

    // PIN AUTH
    const handlePinSubmit = () => {
        if (pin === CORRECT_PIN) {
            localStorage.setItem('receptionist_pin', pin);
            setAuthed(true);
            setPinError('');
        } else {
            localStorage.removeItem('receptionist_pin');
            setPinError('Incorrect PIN');
            setPin('');
        }
    };

    // FILTER
    const filtered = submissions.filter((s) => {
        const q = search.toLowerCase();
        return (
            s.fullName?.toLowerCase().includes(q) ||
            s.studentContactNo?.includes(q) ||
            s.emailId?.toLowerCase().includes(q) ||
            (s.coursesInterested || []).some(c => c.toLowerCase().includes(q))
        );
    });

    const totalPages = Math.ceil(total / limit);

    // ================= PIN SCREEN =================
    if (!authed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 w-[360px] text-center">

                    <div className="text-4xl mb-2">🔐</div>

                    <h2 className="text-blue-700 font-bold text-lg">
                        Receptionist Dashboard
                    </h2>

                    <p className="text-gray-600 text-sm mb-6">
                        Enter PIN to continue
                    </p>

                    <input
                        type="password"
                        value={pin}
                        onChange={(e) =>
                            setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                        placeholder="••••"
                        className={`w-full text-center text-xl tracking-widest px-4 py-3 rounded-lg border ${pinError ? 'border-red-500' : 'border-gray-400'
                            } bg-white text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none`}
                    />

                    {pinError && (
                        <p className="text-red-600 text-sm mt-2 font-medium">
                            {pinError}
                        </p>
                    )}

                    <button
                        onClick={handlePinSubmit}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                        Unlock →
                    </button>

                    <p className="text-gray-500 text-xs mt-4">
                        Set PIN via .env
                    </p>
                </div>
            </div>
        );
    }

    // ================= DASHBOARD =================
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
            <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6">

                {/* HEADER */}
                <div className="flex justify-between items-end border-b border-gray-300 pb-4 mb-6">
                    <div>
                        <h1 className="text-xl font-extrabold text-blue-700">
                            🎓 Echelon Dashboard
                        </h1>
                        <p className="text-gray-700 text-sm">
                            Total: <span className="font-semibold text-black">{total}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setAuthed(false)}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 font-medium"
                    >
                        🔒 Lock
                    </button>
                </div>

                {/* SEARCH + REFRESH */}
                <div className="flex gap-3 flex-wrap mb-5">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone, email, course..."
                        className="flex-1 min-w-[220px] px-4 py-2 border border-gray-400 rounded-md bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                        onClick={() => fetchSubmissions(page)}
                        className="px-4 py-2 bg-gray-100 border border-gray-400 rounded-md hover:bg-gray-200 font-medium"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">

                        <thead className="bg-blue-600 text-white">
                            <tr>
                                {['#', 'Name', 'Phone', 'Email', 'Category', 'Courses', 'Submitted At', 'Sheet', 'Action'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-gray-500">
                                        No submissions found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s, idx) => {
                                    const isOpen = expandedId === s._id;

                                    const submittedAt = (s.submittedAt || s.createdAt)
                                        ? new Date(s.submittedAt || s.createdAt)
                                            .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                                        : '—';

                                    return (
                                        <React.Fragment key={s._id}>
                                            <tr className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-700">
                                                    {(page - 1) * limit + idx + 1}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-black">
                                                    {s.fullName}
                                                </td>

                                                <td className="px-4 py-3 text-gray-800">
                                                    {s.studentContactNo}
                                                </td>

                                                <td className="px-4 py-3 text-gray-800">
                                                    {s.emailId}
                                                </td>

                                                <td className="px-4 py-3 text-gray-800">
                                                    {s.category}
                                                </td>

                                                <td className="px-4 py-3 flex flex-wrap gap-2 max-w-[220px]">
                                                    {(s.coursesInterested || []).map((c, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded-full text-xs font-medium"
                                                        >
                                                            {c}
                                                        </span>
                                                    ))}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                                                    {submittedAt}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {s.sheetSynced ? (
                                                        <span className="text-green-600 font-bold">✓</span>
                                                    ) : (
                                                        <span className="text-yellow-500 font-bold">⏳</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() =>
                                                            setExpandedId(isOpen ? null : s._id)
                                                        }
                                                        className={`px-3 py-1 rounded-md text-sm font-medium ${isOpen
                                                                ? 'bg-gray-200 text-gray-800'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        {isOpen ? 'Close' : 'Print'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={9} className="bg-gray-100 border-t border-gray-300 p-6">
                                                        <AdmissionPrintSlip data={s} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-6">
                        <button
                            onClick={() => fetchSubmissions(page - 1)}
                            disabled={page <= 1}
                            className="px-4 py-2 border border-gray-400 bg-white hover:bg-gray-100 rounded-md font-medium disabled:opacity-50"
                        >
                            ← Prev
                        </button>

                        <span className="text-sm text-gray-800 font-medium">
                            Page {page} / {totalPages}
                        </span>

                        <button
                            onClick={() => fetchSubmissions(page + 1)}
                            disabled={page >= totalPages}
                            className="px-4 py-2 border border-gray-400 bg-white hover:bg-gray-100 rounded-md font-medium disabled:opacity-50"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}