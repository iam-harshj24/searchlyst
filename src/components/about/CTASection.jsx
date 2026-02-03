import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CTASection() {
    const [activeTab, setActiveTab] = useState('brand');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        website: ''
    });

    return (
        <section className="relative bg-black py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            
            <div className="relative max-w-2xl mx-auto px-6">
                {/* Tabs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex bg-gray-900 rounded-full p-1">
                        <button
                            onClick={() => setActiveTab('brand')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                                activeTab === 'brand' 
                                    ? 'bg-red-600 text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <User className="w-4 h-4" />
                            I am a Brand / User
                        </button>
                        <button
                            onClick={() => setActiveTab('investor')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                                activeTab === 'investor' 
                                    ? 'bg-red-600 text-white' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            I am an Investor
                        </button>
                    </div>
                </motion.div>

                {/* Form Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-950 border border-gray-800 rounded-2xl p-8"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {activeTab === 'brand' ? 'Stop Being Invisible' : 'Join Our Journey'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {activeTab === 'brand' 
                            ? 'Secure early access to the Searchlyst Discovery Engine. Optimize your brand for ChatGPT, Perplexity, and Gemini.'
                            : 'Get in touch to learn more about our investment opportunity.'
                        }
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
                            <Input 
                                placeholder="John Smith"
                                value={formData.fullName}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Work Email</label>
                            <Input 
                                type="email"
                                placeholder="john@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
                            />
                        </div>
                        {activeTab === 'brand' && (
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Company Website URL</label>
                                <Input 
                                    placeholder="https://yourcompany.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-600"
                                />
                            </div>
                        )}
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium group">
                            {activeTab === 'brand' ? 'Join Waitlist' : 'Get in Touch'}
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}