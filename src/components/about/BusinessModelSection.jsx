import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Users } from 'lucide-react';

export default function BusinessModelSection() {
    return (
        <section className="relative bg-black py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10">
                        <Layers className="w-4 h-4 text-cyan-500" />
                        <span className="text-cyan-400 text-sm font-medium">Business Model</span>
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
                        <span className="text-white">Scalable SaaS with </span>
                        <span className="text-red-500">"Land & Expand"</span>
                        <span className="text-white"> Potential.</span>
                    </h2>
                </motion.div>

                {/* Agency Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-8 max-w-2xl mx-auto"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-red-500" />
                        <h3 className="text-white text-xl font-semibold">Agency Partnership Strategy</h3>
                    </div>
                    <p className="text-gray-400">
                        We enable marketing agencies to sell "AI SEO Services" using our white-label reports, creating a B2B2B viral loop.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}