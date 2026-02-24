import React from 'react';
import { motion } from 'framer-motion';
import { Shield, X, Check } from 'lucide-react';

const traditionalApproach = [
    'Guess what AI platforms want',
    'Manual tracking across platforms',
    'Generic SEO tactics',
    'Wait months for results',
    'Hope for citations'
];

const ourApproach = [
    'Data-driven insights from 1.5B+ queries',
    'Automated real-time monitoring',
    'AI-specific optimization strategies',
    'See improvements in weeks',
    'Engineer citation-worthy content'
];

export default function MoatSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10">
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span className="text-purple-400 text-sm font-medium">The Moat</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-4"
                >
                    <h2 className="text-4xl md:text-5xl font-bold">
                        <span className="text-[var(--text-primary)]">We Don't Guess. </span>
                        <span className="text-red-500">We Engineer Authority.</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center mb-12"
                >
                    Transforming SEO from a "Black Box" into a Scientific Process.
                </motion.p>

                {/* Comparison */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* Traditional */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-[var(--text-secondary)] font-semibold mb-6">Traditional Approach</h3>
                        <ul className="space-y-4">
                            {traditionalApproach.map((item, index) => (
                                <li key={index} className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-2">
                                    <div className="w-6 h-6 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                                        <X className="w-3 h-3 text-[var(--text-secondary)]" />
                                    </div>
                                    <span className="text-[var(--text-secondary)]">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Our Approach */}
                    <div className="bg-[var(--bg-secondary)] border border-red-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-red-500 font-semibold mb-6">Our AI-Enhanced Process</h3>
                        <ul className="space-y-4">
                            {ourApproach.map((item, index) => (
                                <li key={index} className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-2">
                                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-red-500" />
                                    </div>
                                    <span className="text-[var(--text-primary)]">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}