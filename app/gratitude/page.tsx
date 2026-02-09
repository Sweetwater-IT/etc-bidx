"use client";

import { CheckCircle2 } from "lucide-react";

export default function ThankYouPage() {

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
            <div className="bg-white p-10 rounded-2xl shadow-md text-center max-w-md w-full">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
                <p className="text-gray-600 mb-8">
                    We’ve received your response.
                    Thank you for taking the time to review the quote.
                </p>
            </div>
        </div>
    );
}
