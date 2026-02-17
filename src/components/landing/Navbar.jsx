import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white">
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
                    <Link to={createPageUrl('AboutUs')} className="text-white hover:text-white/90 text-sm transition-colors font-medium">About Us</Link>
                    <a href="#features" className="text-white hover:text-white/90 text-sm transition-colors font-medium">Features</a>
                    <a href="#how-it-works" className="text-white hover:text-white/90 text-sm transition-colors font-medium">How It Works</a>
                    <a href="#pricing" className="text-white hover:text-white/90 text-sm transition-colors font-medium">Pricing</a>
                    <a href="#faq" className="text-white hover:text-white/90 text-sm transition-colors font-medium">FAQ</a>
                </div>
                
                <div className="flex items-center gap-3">
                    <Link to="/Login">
                        <Button 
                            variant="ghost"
                            className="hidden md:inline-flex text-white hover:text-white hover:bg-white/10 rounded-full px-4 h-9 md:h-10 text-sm font-medium"
                        >
                            Log In
                        </Button>
                    </Link>
                    <Link to="/Signup">
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 md:px-5 h-9 md:h-10 text-sm font-medium shadow-lg shadow-red-500/20 transition-all hover:shadow-xl hover:shadow-red-500/30"
                        >
                            Get Started
                        </Button>
                    </Link>
                    
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
                <div className="md:hidden border-t border-white bg-black/95 backdrop-blur-xl">
                    <div className="px-4 py-4 space-y-3">
                        <Link 
                            to={createPageUrl('AboutUs')} 
                            className="block text-white hover:text-white/90 py-2 transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            About Us
                        </Link>
                        <a 
                            href="#features" 
                            className="block text-white hover:text-white/90 py-2 transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Features
                        </a>
                        <a 
                            href="#how-it-works" 
                            className="block text-white hover:text-white/90 py-2 transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            How It Works
                        </a>
                        <a 
                            href="#pricing" 
                            className="block text-white hover:text-white/90 py-2 transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Pricing
                        </a>
                        <a 
                            href="#faq" 
                            className="block text-white hover:text-white/90 py-2 transition-colors font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            FAQ
                        </a>
                        <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                            <Link 
                                to="/Login"
                                className="block text-white/70 hover:text-white py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link 
                                to="/Signup"
                                className="block text-red-400 hover:text-red-300 py-2 transition-colors font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
