"use client";

import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
        
        {/* Icon */}
        <div className="text-5xl text-green-600 mb-4">✓</div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Application Submitted!
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          Thank you for your interest in{" "}
          <strong>Echelon Institute of Technology, Faridabad</strong>.
        </p>
        <p className="text-gray-600 mb-6">
          Your walking form has been successfully submitted. Our admissions team will reach out to you shortly.
        </p>

        {/* Info Section */}
        <div className="space-y-3 text-left mb-6">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <span className="text-lg">📞</span>
            <span className="text-gray-700 text-sm">
              Our team will call you within 24 hours
            </span>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <span className="text-lg">📧</span>
            <span className="text-gray-700 text-sm">
              Check your email for confirmation
            </span>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <span className="text-lg">🎓</span>
            <span className="text-gray-700 text-sm">
              Academic Session: 2026-27
            </span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => router.push("/")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition duration-200"
        >
          Submit Another Form
        </button>
      </div>
    </div>
  );
}