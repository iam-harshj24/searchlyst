import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from './ThemeToggle';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WaitlistModal from '../WaitlistModal';

export default function Navbar() {
    const [showWaitlist, setShowWaitlist] = useState(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)] backdrop-blur-md border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="text-[var(--text-primary)] text-xl font-semibold tracking-tight italic">
                        searchlyst
                    </div>
                    
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Features</a>
                        <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">How It Works</a>
                        <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Pricing</a>
                        <a href="#faq" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">FAQ</a>
                        <Link to={createPageUrl('AboutUs')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">About Us</Link>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button 
                            onClick={() => setShowWaitlist(true)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5"
                        >
                            Join Waitlist
                        </Button>
                    </div>
                </div>
            </nav>
            <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} source="home" />
        </>
    );
}