import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Home, Plane, Heart, Search } from 'lucide-react';

const solutions = [
    {
        industry: 'REAL ESTATE',
        subtext: 'Property search',
        icon: Home,
        queryType: 'ChatGPT Query',
        query: '"luxury waterfront homes in Dubai under $5M"',
        resultTitle: 'Luxury Estates Dubai',
        resultDescription: 'Your brand appearing with featured listings and citation link',
        features: ['Premium waterfront villas', 'Price range: $2.8M - $4.9M', 'Direct booking available']
    },
    {
        industry: 'TRAVEL',
        subtext: 'Itinerary building',
        icon: Plane,
        queryType: 'Perplexity Query',
        query: '"perfect 7-day Japan itinerary for first-time visitors"',
        resultTitle: 'Japan Travel Experts',
        resultDescription: 'Your travel agency featured as the source with detailed day-by-day plan',
        features: ['Day 1-3: Tokyo highlights', 'Day 4-5: Kyoto temples', 'Day 6-7: Osaka food tour']
    },
    {
        industry: 'HEALTHCARE',
        subtext: 'Symptom research',
        icon: Heart,
        queryType: 'ChatGPT Query',
        query: '"what are early signs of vitamin D deficiency?"',
        resultTitle: 'HealthFirst Clinic',
        resultDescription: 'Your medical clinic/health brand cited with authoritative symptoms list',
        features: ['Fatigue and tiredness', 'Bone and muscle pain', 'Mood changes']
    }
];

export default function SolutionSection() {
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10">
                        <Sparkles className="w-4 h-4 text-teal-500" />
                        <span className="text-teal-400 text-sm font-medium">The Solution</span>
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
                        <span className="text-white">The </span>
                        <span className="text-red-500">AI Search</span>
                        <span className="text-white"> Infrastructure</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-center mb-12"
                >
                    We turn brand invisibility into authoritative citations.
                </motion.p>

                {/* Solution Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {solutions.map((solution, index) => (
                        <div key={index} className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-bold text-sm tracking-wider">{solution.industry}</h3>
                                    <p className="text-gray-500 text-sm">{solution.subtext}</p>
                                </div>
                                <solution.icon className="w-6 h-6 text-red-500" />
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Search className="w-3 h-3 text-gray-500" />
                                    <span className="text-gray-500 text-xs">{solution.queryType}</span>
                                </div>
                                <p className="text-gray-400 text-sm italic">{solution.query}</p>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-3 h-3 text-red-500" />
                                    <span className="text-gray-500 text-xs">AI Citation Result</span>
                                </div>
                                <div className="bg-gray-900 rounded-xl p-4 border-l-2 border-red-500">
                                    <h4 className="text-red-500 font-semibold mb-1">{solution.resultTitle}</h4>
                                    <p className="text-gray-500 text-xs mb-3">{solution.resultDescription}</p>
                                    <ul className="space-y-1">
                                        {solution.features.map((feature, idx) => (
                                            <li key={idx} className="text-gray-400 text-xs flex items-center gap-2">
                                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}