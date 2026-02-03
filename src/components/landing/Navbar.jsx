import React from 'react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
    return (
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
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                        Log in
                    </Button>
                    <ThemeToggle />
                    <Button className="bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full px-5">
                        Start for free
                    </Button>
                </div>
            </div>
        </nav>
    );
}