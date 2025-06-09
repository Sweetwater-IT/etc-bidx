"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PasswordEntryPage() {
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = () => {
        if (password === '444') {
            // Set a cookie to indicate authentication
            document.cookie = 'isAuthenticated=true; path=/; max-age=3600'; // Expires in 1 hour
            toast.success('Login successful!');
            // Redirect to the original page or a default dashboard
            router.push('/'); 
        } else {
            toast.error('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Enter Password to Access</h1>
                <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mb-4"
                />
                <Button onClick={handleLogin} className="w-full">
                    Submit
                </Button>
            </div>
        </div>
    );
} 