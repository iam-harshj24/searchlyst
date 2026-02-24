import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap } from 'lucide-react';

const markets = [
    {
        label: 'TAM',
        title: 'Total Addressable Market',
        value: '$680B',
        description: 'Global Digital Ad Spend. As search moves to AI, budget shifts from Google Ads to AI Optimization.',
        color: 'red'
    },
    {
        label: 'SAM',
        title: 'Serviceable Addressable Market',
        value: '$80B',
        description: 'Global SEO & Content Marketing Industry.',
        color: 'orange'
    },
    {
        label: 'SOM',
        title: 'Serviceable Obtainable Market',
        value: '$100M ARR',
        description: 'Targeting the Top 50,000 SaaS & E-commerce companies who are "Early Adopters."',
        color: 'green'
    }
];

export default function MarketOpportunitySection() {
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-400 text-sm font-medium">Market Opportunity</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold">
                        <span className="text-[var(--text-primary)]">Capturing the </span>
                        <span className="text-red-500">$600B</span>
                        <span className="text-[var(--text-primary)]"> Ad Spend Transition.</span>
                    </h2>
                </motion.div>

                {/* Market Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {markets.map((market, index) => (
                        <div key={index} className={`bg-[var(--bg-secondary)] border rounded-2xl p-6 transition-all duration-300 hover:scale-105 cursor-pointer ${
                            market.color === 'red' ? 'border-red-500/30' :
                            market.color === 'orange' ? 'border-orange-500/30' :
                            'border-green-500/30'
                        }`}>
                            <div className={`text-xs font-bold mb-2 ${
                                market.color === 'red' ? 'text-red-500' :
                                market.color === 'orange' ? 'text-orange-500' :
                                'text-green-500'
                            }`}>{market.label}</div>
                            <p className="text-[var(--text-secondary)] text-sm mb-4">{market.title}</p>
                            <div className={`text-4xl font-bold mb-4 ${
                                market.color === 'red' ? 'text-red-500' :
                                market.color === 'orange' ? 'text-orange-500' :
                                'text-green-500'
                            }`}>{market.value}</div>
                            <p className="text-[var(--text-secondary)] text-sm">{market.description}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Stats */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap justify-center gap-8"
                >
                    <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                        <Zap className="w-5 h-5 text-[var(--text-primary)]" />
                        <span className="text-[var(--text-primary)] font-semibold">3x Higher Intent</span>
                    </div>
                    <div className="flex items-center gap-2 transition-transform duration-300 hover:scale-110 cursor-pointer">
                        <TrendingUp className="w-5 h-5 text-[var(--text-primary)]" />
                        <span className="text-[var(--text-primary)] font-semibold">30% Traffic Loss</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}