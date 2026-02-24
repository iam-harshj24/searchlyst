import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Check, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import WaitlistModal from '../WaitlistModal';

const plans = [
    {
        name: 'Starter',
        subtitle: 'Serious Startups & Niche Brands',
        price: { monthly: 99, annual: 69 },
        features: [
            '150 Custom Prompts',
            '3 Brands + 5 Competitors',
            'Weekly Visibility Reports',
            'Basic GEO Intelligence: Track ranking in 1 Country',
            'Sentiment Analysis (Positive/Neutral/Negative)',
            '4 Platforms: ChatGPT, Gemini, Perplexity, Claude',
            'AI Content Generation',
            'Email Support',
        ],
        highlighted: false,
    },
    {
        name: 'Growth',
        subtitle: 'High-Growth Teams & Scale-ups',
        price: { monthly: 199, annual: 139 },
        features: [
            '600 Custom Prompts',
            '10 Brands + 15 Competitors',
            'Weekly Visibility Updates',
            'Advanced GEO Intelligence: Track ranking in 5 Regions',
            'Technical AEO: Schema & llms.txt generation',
            'Citation Gap Analysis: Direct competitor comparison',
            'Basic AEO Audits: Automated content recommendations',
            'AI Content Generation',
            'Priority Support (Email)',
        ],
        highlighted: true,
    },
    {
        name: 'Scale',
        subtitle: 'Agencies & Dominant Brands',
        price: { monthly: 299, annual: 209 },
        features: [
            '1,500 Custom Prompts',
            'Unlimited Brands + 50 Competitors',
            'Real-Time Monitoring Capability',
            'Global GEO Intelligence: Unlimited regional tracking',
            'Technical AEO: Schema & llms.txt generation',
            'White-Label Reporting: PDF exports for clients',
            'AI Content Generation',
            'Dedicated Account Manager',
        ],
        highlighted: false,
    },
];

export default function PricingSection() {
    const [isAnnual, setIsAnnual] = useState(false);
    const [showWaitlist, setShowWaitlist] = useState(false);

    return (
        <>
        <section id="pricing" className="relative bg-[var(--bg-primary)] py-12 md:py-24 overflow-hidden">
            <div className="relative max-w-6xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <DollarSign className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">Pricing</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                        Plans That Scale With
                    </h2>
                    <p className="text-3xl md:text-4xl font-bold text-red-500">
                        Your Ambition
                    </p>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center max-w-xl mx-auto mb-10"
                >
                    Choose the perfect plan to dominate AI search results and grow your<br />
                    brand visibility
                </motion.p>

                {/* Billing toggle */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center items-center gap-4 mb-12"
                >
                    <span className={`text-sm ${!isAnnual ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Monthly</span>
                    <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
                    <span className={`text-sm ${isAnnual ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Annual</span>
                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium rounded-full">
                        Save 30%
                    </span>
                </motion.div>

                {/* Pricing cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="grid md:grid-cols-3 gap-6 mb-12"
                >
                    {plans.map((plan, index) => (
                        <div 
                            key={index}
                            className={`relative rounded-2xl p-6 hover:scale-105 transition-all duration-300 ${
                                plan.highlighted 
                                    ? 'bg-[var(--bg-secondary)] border-2 border-red-500/50 -mt-4 mb-4 md:mb-0 hover:shadow-lg hover:shadow-red-500/20' 
                                    : 'bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10'
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                                    Most Popular
                                </div>
                            )}
                            
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{plan.name}</h3>
                                <p className="text-[var(--text-secondary)] text-sm">{plan.subtitle}</p>
                            </div>
                            
                            <div className="text-center mb-6">
                                <span className="text-4xl font-bold text-red-500">
                                    ${isAnnual ? plan.price.annual : plan.price.monthly}
                                </span>
                                <span className="text-[var(--text-secondary)]">/month</span>
                            </div>
                            
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-[var(--text-secondary)] text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <Button 
                                onClick={() => setShowWaitlist(true)}
                                className={`w-full rounded-xl ${
                                    plan.highlighted
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                                }`}
                            >
                                Join Waitlist
                            </Button>
                        </div>
                    ))}
                </motion.div>

                {/* Enterprise card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Enterprise & Custom Solutions</h3>
                        <p className="text-[var(--text-secondary)] text-sm">
                            Need unlimited prompts, API access, custom integrations, or dedicated support? Let's build a plan<br />
                            tailored to your organization's needs.
                        </p>
                    </div>
                    <Button className="bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-xl flex items-center gap-2 whitespace-nowrap">
                        <Mail className="w-4 h-4" />
                        Contact Us
                    </Button>
                </motion.div>
            </div>
        </section>
        <WaitlistModal open={showWaitlist} onOpenChange={setShowWaitlist} source="pricing" />
        </>
    );
}