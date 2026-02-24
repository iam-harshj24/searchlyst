import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const footerLinks = {
    Product: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Case Studies', href: '#' },
        { label: 'API Documentation', href: '#' }
    ],
    Resources: [
        { label: 'Blog', href: 'Blogs', isPage: true },
        'AI Search Guide', 
        'Help Center', 
        'Status Page'
    ],
    Company: [
        { label: 'About Us', href: 'AboutUs', isPage: true },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' }
    ],
};

const socialLinks = [
    { name: 'X', icon: '𝕏' },
    { name: 'LinkedIn', icon: 'in' },
];

export default function Footer() {
    return (
        <footer className="bg-[var(--bg-primary)] border-t border-[var(--border)] py-12 md:py-16">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
                    {/* Brand column */}
                    <div className="lg:col-span-1">
                        <Link to={createPageUrl('Home')}>
                            <img 
                                src="/searchlyst_logo.png" 
                                alt="Searchlyst" 
                                className="h-10 md:h-12 mb-4"
                                loading="lazy"
                            />
                        </Link>
                        <p className="text-[var(--text-secondary)] text-sm">
                            Making brands visible in the age of AI search. Track, optimize, and dominate AI search results.
                        </p>
                    </div>

                    {/* Links columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-[var(--text-primary)] font-semibold mb-4">{category}</h4>
                            <ul className="space-y-3">
                                {links.map((link) => {
                                    const isObject = typeof link === 'object';
                                    const label = isObject ? link.label : link;
                                    const isPage = isObject && link.isPage;
                                    const href = isObject ? link.href : '#';
                                    
                                    return (
                                        <li key={label}>
                                            {isPage ? (
                                                <Link 
                                                    to={createPageUrl(href)} 
                                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
                                                >
                                                    {label}
                                                </Link>
                                            ) : (
                                                <a 
                                                    href={href}
                                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition-colors"
                                                >
                                                    {label}
                                                </a>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {/* Connect column */}
                    <div>
                        <h4 className="text-[var(--text-primary)] font-semibold mb-4">Connect</h4>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a 
                                    key={social.name}
                                    href="#"
                                    className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors text-sm"
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