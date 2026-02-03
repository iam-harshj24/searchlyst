import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Mail, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const aiPlatforms = [
    { name: 'Perplexity', icon: '⚡' },
    { name: 'ChatGPT', icon: '●' },
    { name: 'Gemini', icon: '✦' },
    { name: 'Claude', icon: '✳' },
];

export default function HeroSection() {
    const [currentPlatform, setCurrentPlatform] = useState(0);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPlatform((prev) => (prev + 1) % aiPlatforms.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen bg-black pt-32 pb-20 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 rounded-full blur-[120px]" />
            
            <div className="relative max-w-4xl mx-auto px-6 text-center">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 mb-8"
                >
                    <span className="text-red-500 text-sm">★</span>
                    <span className="text-red-400 text-sm font-medium">AI search optimisation platform</span>
                </motion.div>

                {/* Main heading */}
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
                >
                    Get your brand<br />recommended by
                </motion.h1>

                {/* Animated platform name */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="h-16 mb-6 flex items-center justify-center"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPlatform}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-3 text-3xl md:text-4xl text-white font-semibold"
                        >
                            <span className="text-2xl">{aiPlatforms[currentPlatform].icon}</span>
                            {aiPlatforms[currentPlatform].name}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Platform indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {aiPlatforms.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 rounded-full transition-all duration-300 ${
                                index === currentPlatform ? 'w-8 bg-red-500' : 'w-2 bg-gray-600'
                            }`}
                        />
                    ))}
                </div>

                {/* Description */}
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto"
                >
                    The all-in-one platform to track, optimize, and control your brand's<br />
                    presence in the age of AI search.
                </motion.p>

                {/* Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-2xl mx-auto bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input 
                                type="text"
                                placeholder="Enter Your Website URL"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                className="w-full bg-zinc-900/80 border-white/10 text-white pl-12 h-12 rounded-xl placeholder:text-gray-500"
                            />
                        </div>
                        <div className="flex-1 relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input 
                                type="email"
                                placeholder="Your Work Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-900/80 border-white/10 text-white pl-12 h-12 rounded-xl placeholder:text-gray-500"
                            />
                        </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white h-12 rounded-xl font-medium text-base group">
                        Get Your Free AI Visibility Score
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            Setup in 5 minutes
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            No technical skills needed
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            Cancel anytime
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}