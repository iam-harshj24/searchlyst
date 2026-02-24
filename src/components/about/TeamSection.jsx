import React from 'react';
import { motion } from 'framer-motion';
import { Users, Linkedin, Twitter } from 'lucide-react';

const team = [
    {
        name: 'Vijay Singh',
        role: 'Founder & CEO',
        description: 'Founder of Searchlyst with deep domain expertise in Search technology and Real Estate tech.',
        why: 'Built Searchlyst to solve the specific "AI Discovery" problem he faced in his own ventures.',
        superpower: 'Product Strategy & Market Penetration'
    },
    {
        name: 'Madhur Sinha',
        role: 'Founder & COO',
        description: 'Founder of Searchlyst. Responsible for turning our proprietary "Optimization Cycle" into a scalable operational machine.',
        why: 'Overseeing the delivery pipeline, customer success infrastructure, and agency partnerships.',
        superpower: 'Operational Efficiency & Scaling Teams'
    },
    {
        name: 'Simerpreet Singh',
        role: 'Partner & CFO',
        description: 'Managing capital allocation to ensure unit economics remain healthy as we scale from $0 to $2M ARR.',
        why: 'Financial modeling, fundraising strategy, and SaaS metric optimization (CAC/LTV).',
        superpower: 'Financial Discipline & Growth Modeling'
    }
];

export default function TeamSection() {
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/10">
                        <Users className="w-4 h-4 text-pink-500" />
                        <span className="text-pink-400 text-sm font-medium">The Team</span>
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
                        <span className="text-[var(--text-primary)]">A C-Suite Built for </span>
                        <span className="text-red-500">Scale</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center mb-12"
                >
                    Deep expertise in AI Search, SaaS Operations, and Financial Strategy.
                </motion.p>

                {/* Team Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {team.map((member, index) => (
                        <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:border-pink-500/30 cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-[var(--text-primary)] font-semibold text-lg">{member.name}</h3>
                                    <p className="text-red-500 text-sm">{member.role}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Linkedin className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors" />
                                    <Twitter className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors" />
                                </div>
                            </div>
                            
                            <p className="text-[var(--text-secondary)] text-sm mb-4">{member.description}</p>
                            
                            <div className="mb-4">
                                <p className="text-[var(--text-secondary)] text-xs font-semibold mb-1">The {index === 0 ? '"Why"' : 'Focus'}</p>
                                <p className="text-[var(--text-secondary)] text-sm">{member.why}</p>
                            </div>
                            
                            <div className="pt-4 border-t border-[var(--border)]">
                                <p className="text-[var(--text-secondary)] text-xs font-semibold mb-1">Superpower</p>
                                <p className="text-red-400 text-sm">{member.superpower}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}