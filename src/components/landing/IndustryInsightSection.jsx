import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function IndustryInsightSection() {
    return (
        <section id="features" className="relative bg-[var(--bg-primary)] py-12 md:py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            
            {/* Background glow */}
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-red-600/10 rounded-full blur-[120px]" />
            
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <Sparkles className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">Industry Insight</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold mb-6"
                >
                    <span className="text-[var(--text-primary)]">AI Search: </span>
                    <span className="text-red-500">The New Frontier of Search</span>
                </motion.h2>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-lg mb-12 max-w-2xl mx-auto"
                >
                    Traditional SEO is evolving. Brands must now optimize for AI discovery<br />
                    engines to stay visible in the new search landscape.
                </motion.p>

                {/* McKinsey Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-10 py-8 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                    <div className="text-left">
                        <div className="text-5xl md:text-6xl font-bold text-red-500 mb-2">50%</div>
                        <div className="text-[var(--text-secondary)] text-sm">
                            of consumers use AI<br />
                            for buying decisions
                        </div>
                    </div>
                    <div className="h-16 w-px bg-[var(--border)]" />
                    <div className="text-left">
                        <div className="text-2xl md:text-3xl font-serif text-[var(--text-primary)]">McKinsey</div>
                        <div className="text-[var(--text-secondary)] text-sm">&Company</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}