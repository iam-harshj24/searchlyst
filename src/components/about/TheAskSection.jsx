import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, DollarSign } from 'lucide-react';

const fundAllocation = [
    { label: 'Product Engineering', percent: 40, description: 'Developing the "One-Click Optimization" API and expanding to video/multimodal search tracking.' },
    { label: 'Go-to-Market', percent: 35, description: 'Aggressive sales targeting Top 50 Marketing Agencies to integrate our tool.' },
    { label: 'Talent', percent: 25, description: 'Hiring Head of AEO Research and Customer Success leads.' }
];

export default function TheAskSection() {
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10">
                        <Rocket className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-400 text-sm font-medium">The Ask</span>
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
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Fueling the Future of Search
                    </h2>
                </motion.div>

                {/* Funding Stats */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    <div className="bg-gray-950 border border-red-500/30 rounded-2xl p-6 text-center">
                        <p className="text-gray-500 text-sm mb-2">Raise</p>
                        <p className="text-4xl font-bold text-red-500">$1,000,000</p>
                        <p className="text-gray-500 text-sm">USD</p>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-center">
                        <p className="text-gray-500 text-sm mb-2">Equity</p>
                        <p className="text-4xl font-bold text-white">17%</p>
                        <p className="text-gray-500 text-sm">Offered</p>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-center">
                        <p className="text-gray-500 text-sm mb-2">Valuation</p>
                        <p className="text-4xl font-bold text-white">~$5.8M</p>
                        <p className="text-gray-500 text-sm">Post-Money</p>
                    </div>
                </motion.div>

                {/* Use of Funds */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-950 border border-gray-800 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <h3 className="text-white font-semibold">Use of Funds</h3>
                        <span className="text-gray-500 text-sm ml-auto">18-Month Runway</span>
                    </div>

                    <div className="space-y-6">
                        {fundAllocation.map((item, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-white">{item.label}</span>
                                    <span className="text-red-500 font-semibold">{item.percent}%</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                                <p className="text-gray-500 text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}