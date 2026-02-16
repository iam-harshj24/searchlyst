import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import WaitlistModal from '../WaitlistModal';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/[0.08]">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <a href="https://searchlyst.com" className="cursor-pointer">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69824440a17c76d392c103dc/2787700e8_Group123-Picsart-BackgroundRemover.png" 
                            alt="Searchlyst" 
                            className="h-10 md:h-12"
                            loading="eager"
                            fetchpriority="high"
                        />
                    </a>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link to={createPageUrl('AboutUs')} className="text-white/60 hover:text-white text-sm transition-colors font-medium">About Us</Link>
                        <a href="#features" className="text-white/60 hover:text-white text-sm transition-colors font-medium">Features</a>
                        <a href="#how-it-works" className="text-white/60 hover:text-white text-sm transition-colors font-medium">How It Works</a>
                        <a href="#pricing" className="text-white/60 hover:text-white text-sm transition-colors font-medium">Pricing</a>
                        <a href="#faq" className="text-white/60 hover:text-white text-sm transition-colors font-medium">FAQ</a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={() => setShowWaitlist(true)}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 md:px-5 h-9 md:h-10 text-sm font-medium shadow-lg shadow-red-500/20 transition-all hover:shadow-xl hover:shadow-red-500/30"
                        >
                            Join Waitlist
                        </Button>
                        
                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
                
                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/[0.08] bg-black/95 backdrop-blur-xl">
                        <div className="px-4 py-4 space-y-3">
                            <Link 
                                to={createPageUrl('AboutUs')} 
                                className="block text-white/60 hover:text-white py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                About Us
                            </Link>
                            <a 
                                href="#features" 
                                className="block text-white/60 hover:text-white py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Features
                            </a>
                            <a 
                                href="#how-it-works" 
                                className="block text-white/60 hover:text-white py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                How It Works
                            </a>
                            <a 
                                href="#pricing" 
                                className="block text-white/60 hover:text-white py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Pricing
                            </a>
                            <a 
                                href="#faq" 
                                className="block text-white/60 hover:text-white py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                FAQ
                            </a>
                        </div>
                    </div>
                )}
            </nav>
            <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} source="home" />
        </>
    );
}