'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const CORRECT_PIN = process.env.NEXT_PUBLIC_RECEPTIONIST_PIN || '1234';

export default function OtpDashboard() {
    const router = useRouter();

    const [authed, setAuthed] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');

    const [otps, setOtps] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const limit = 20;

    const fetchOtps = useCallback(async (p = 1) => {
        setLoading(true);

        try {
            const storedPin = localStorage.getItem('receptionist_pin');

            const { data } = await axios.post('/api/get-otp', {
                page: p,
                limit,
                search,
                pin: storedPin, // 🔐 sending PIN securely in body
            });

            setOtps(data.otps || []);
            setTotal(data.total || 0);
            setPage(p);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const storedPin = localStorage.getItem('receptionist_pin');
        if (storedPin === CORRECT_PIN) setAuthed(true);
    }, []);

    useEffect(() => {
        if (authed) fetchOtps(1);
    }, [authed, fetchOtps]);

    const handlePinSubmit = () => {
        if (pin === CORRECT_PIN) {
            localStorage.setItem('receptionist_pin', pin);
            setAuthed(true);
            setPinError('');
        } else {
            setPinError('Incorrect PIN');
            setPin('');
        }
    };

    const totalPages = Math.ceil(total / limit);

    // 🔐 PIN SCREEN
    if (!authed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 w-[360px] text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        🔐 OTP Dashboard
                    </h2>

                    <p className="text-gray-500 text-sm mb-4">
                        Enter PIN to continue
                    </p>

                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••"
                        className={`w-full text-center text-lg tracking-widest px-4 py-3 rounded-lg border ${pinError ? 'border-red-400' : 'border-gray-300'
                            } focus:ring-2 focus:ring-blue-500 outline-none`}
                    />

                    {pinError && (
                        <p className="text-red-500 mt-2 text-sm">{pinError}</p>
                    )}

                    <button
                        onClick={handlePinSubmit}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                    >
                        Unlock →
                    </button>
                </div>
            </div>
        );
    }

    // 📊 DASHBOARD
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            OTP Dashboard
                        </h1>
                        <p className="text-sm text-gray-500">
                            Total OTPs: <span className="font-semibold text-gray-800">{total}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setAuthed(false)}
                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-md hover:bg-red-100"
                    >
                        🔒 Lock
                    </button>
                    <button
                        onClick={() => router.replace('/receptionist/otp')}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 font-medium"
                    >
                        OTP
                    </button>
                </div>

                {/* SEARCH */}
                <div className="flex gap-3 mb-5">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search phone or OTP..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                        onClick={() => fetchOtps(page)}
                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 text-black"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                {['#', 'Phone', 'OTP', 'Verified', 'Attempts', 'Expires', 'Action'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : otps.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-500">
                                        No OTPs found
                                    </td>
                                </tr>
                            ) : (
                                otps.map((o, i) => {
                                    const isOpen = expandedId === o._id;

                                    return (
                                        <React.Fragment key={o._id} >
                                            <tr className="border-b hover:bg-gray-50 text-black">
                                                <td className="px-4 py-3">
                                                    {(page - 1) * limit + i + 1}
                                                </td>

                                                <td className="px-4 py-3 font-medium ">
                                                    {o.phone}
                                                </td>

                                                <td className="px-4 py-3 text-blue-600 font-bold">
                                                    {o.otp}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {o.verified ? '✅' : '❌'}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {o.attempts}
                                                </td>

                                                <td className="px-4 py-3 text-xs">
                                                    {new Date(o.expiresAt).toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() =>
                                                            setExpandedId(isOpen ? null : o._id)
                                                        }
                                                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                                                    >
                                                        {isOpen ? 'Close' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isOpen && (
                                                <tr>
                                                    <td colSpan="7" className="bg-gray-50 p-4">
                                                        <pre className="text-xs text-gray-700">
                                                            {JSON.stringify(o, null, 2)}
                                                        </pre>
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
                            disabled={page <= 1}
                            onClick={() => fetchOtps(page - 1)}
                            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                            ← Prev
                        </button>

                        <span className="text-sm">
                            Page {page} / {totalPages}
                        </span>

                        <button
                            disabled={page >= totalPages}
                            onClick={() => fetchOtps(page + 1)}
                            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}