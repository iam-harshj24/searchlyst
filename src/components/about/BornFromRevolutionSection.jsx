import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function BornFromRevolutionSection() {
    return (
        <section className="relative bg-black py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            
            <div className="relative max-w-4xl mx-auto px-6">
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
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-4xl md:text-5xl font-bold">
                        <span className="text-white">Born from the </span>
                        <span className="text-red-500">AI Revolution</span>
                    </h2>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-center space-y-6 mb-12"
                >
                    <p>
                        In 2023, we noticed a seismic shift in how people discover information. AI platforms like ChatGPT, Perplexity, and Claude weren't just answering questions—they were becoming the new search engines.
                    </p>
                    <p>
                        Traditional SEO tools couldn't track this new landscape. Brands were flying blind in a world where 1.5 billion users now rely on AI for recommendations.
                    </p>
                    <p>
                        We built Searchlyst to fill this gap—a platform that helps brands understand, track, and optimize their visibility across every major AI search platform.
                    </p>
                </motion.div>

                {/* Gartner Quote Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-8 relative"
                >
                    {/* 55% badge */}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10">
                        <span className="text-green-400 text-sm font-medium">55% by 2028</span>
                    </div>
                    
                    <p className="text-gray-300 text-lg mb-6 pr-24">
                        "AI platforms like ChatGPT, Perplexity, Gemini, and Claude now serve 1.5 billion users and already handle 32% of global search queries — projected to reach 55% by 2028."
                    </p>
                    
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white rounded-lg">
                            <span className="text-black font-semibold">Gartner</span>
                        </div>
                        <span className="text-gray-500">Industry Research</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}