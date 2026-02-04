import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown, Heart, DollarSign } from 'lucide-react';

const problems = [
    {
        icon: TrendingDown,
        title: 'Loss of High-Intent Traffic',
        description: 'AI search queries have 3x higher intent than keyword search.',
        stat: '3x',
        statLabel: 'Higher Intent',
        iconColor: 'text-[var(--text-primary)]'
    },
    {
        icon: Heart,
        title: 'The "Trust Gap"',
        description: 'When AI lists competitors but excludes you, users perceive you as irrelevant.',
        stat: '90%',
        statLabel: 'Invisible Brands',
        iconColor: 'text-[var(--text-primary)]'
    },
    {
        icon: DollarSign,
        title: 'Revenue Impact',
        description: 'Brands losing potential traffic as search volume migrates to AI platforms.',
        stat: '30%',
        statLabel: 'Traffic Loss',
        iconColor: 'text-[var(--text-primary)]'
    }
];

export default function ProblemSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Red glow effect */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-[150px]" />
            
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">The Problem</span>
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
                        <span className="text-[var(--text-primary)]">The "Invisible Brand" Crisis</span><br />
                        <span className="text-[var(--text-primary)]">is Costing </span>
                        <span className="text-red-500">Billions.</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center mb-12"
                >
                    90% of brands ranking on Google Page 1 are completely invisible in ChatGPT.
                </motion.p>

                {/* Problem Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {problems.map((problem, index) => (
                        <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:border-red-500/30 cursor-pointer">
                            <problem.icon className={`w-8 h-8 ${problem.iconColor} mb-4`} />
                            <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-2">{problem.title}</h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-6">{problem.description}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-red-500">{problem.stat}</span>
                                <span className="text-[var(--text-secondary)] text-sm">{problem.statLabel}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}