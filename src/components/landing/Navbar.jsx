import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <a href="https://searchlyst.com" className="cursor-pointer">
                        <img 
                            src="/searchlyst_logo.png" 
                            alt="Searchlyst" 
                            className="h-10 md:h-12"
                            loading="eager"
                            fetchpriority="high"
                        />
                    </a>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link to={createPageUrl('AboutUs')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">About Us</Link>
                        <a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Features</a>
                        <a href="#how-it-works" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">How It Works</a>
                        <a href="#pricing" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Pricing</a>
                        <a href="#faq" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">FAQ</a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link to="/Dashboard">
                            <Button 
                                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 md:px-5 h-9 md:h-10 text-sm"
                            >
                                Try Searchlyst
                            </Button>
                        </Link>
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-[var(--text-primary)]"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
                
                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-primary)]">
                        <div className="px-4 py-4 space-y-3">
                            <Link 
                                to="/Dashboard" 
                                className="flex items-center gap-2 text-red-500 hover:text-red-400 py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Try Searchlyst
                            </Link>
                            <Link 
                                to={createPageUrl('AboutUs')} 
                                className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                About Us
                            </Link>
                            <a 
                                href="#features" 
                                className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Features
                            </a>
                            <a 
                                href="#how-it-works" 
                                className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                How It Works
                            </a>
                            <a 
                                href="#pricing" 
                                className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Pricing
                            </a>
                            <a 
                                href="#faq" 
                                className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                FAQ
                            </a>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}