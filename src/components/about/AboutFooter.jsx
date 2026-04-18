import React from 'react';
import { Input } from "@/components/ui/input";

const footerLinks = {
    Product: ['Features', 'Pricing', 'How It Works', 'Case Studies', 'API Documentation'],
    Resources: ['Blog', 'AI Search Guide', 'Help Center', 'Status Page'],
    Company: ['About Us', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service'],
};

const socialLinks = [
    { name: 'X', icon: '𝕏' },
    { name: 'LinkedIn', icon: 'in' },
];

export default function AboutFooter() {
    return (
        <footer className="bg-[var(--bg-primary)] border-t border-[var(--border)] py-12 md:py-16">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
                    {/* Brand column */}
                    <div className="lg:col-span-1">
                        <a href="/">
                            <img 
                                src="/searchlyst_logo.png" 
                                alt="Searchlyst" 
                                className="h-8 md:h-10 mb-4"
                            />
                        </a>
                        <p className="text-[var(--text-secondary)] text-sm">
                            Making brands visible in the age of AI search. Track, optimize, and dominate AI search results.
                        </p>
                    </div>

                    {/* Links columns - 3 equal columns */}
                    <div>
                        <h4 className="text-[var(--text-primary)] font-semibold mb-4">Product</h4>
                        <ul className="space-y-3">
                            {footerLinks.Product.map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-[var(--text-primary)] font-semibold mb-4">Resources</h4>
                        <ul className="space-y-3">
                            {footerLinks.Resources.map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-[var(--text-primary)] font-semibold mb-4">Company</h4>
                        <ul className="space-y-3">
                            {footerLinks.Company.map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect column */}
                    <div>
                        <h4 className="text-[var(--text-primary)] font-semibold mb-4">Connect</h4>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a 
                                    key={social.name}
                                    href="#"
                                    className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all duration-300 hover:scale-110 text-sm"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[var(--text-secondary)] text-sm">
                        © 2026 Searchlyst. Making brands visible in the age of AI search. v2.1
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Privacy</a>
                        <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Terms</a>
                        <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}