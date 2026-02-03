import React from 'react';
import { Button } from "@/components/ui/button";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="text-white text-xl font-semibold tracking-tight italic">
                    searchlyst
                </div>
                
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-gray-300 hover:text-white text-sm transition-colors">Features</a>
                    <a href="#how-it-works" className="text-gray-300 hover:text-white text-sm transition-colors">How It Works</a>
                    <a href="#pricing" className="text-gray-300 hover:text-white text-sm transition-colors">Pricing</a>
                    <a href="#faq" className="text-gray-300 hover:text-white text-sm transition-colors">FAQ</a>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                        Log in
                    </Button>
                    <Button className="bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-full px-5">
                        Start for free
                    </Button>
                </div>
            </div>
        </nav>
    );
}