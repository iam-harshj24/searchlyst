import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Briefcase, ArrowRight, Mail, Globe, Loader2, CheckCircle, Linkedin, MapPin, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import { waitlistSchema } from '@/validations/waitlist';

export default function CTASection() {
    const [activeTab, setActiveTab] = useState('brand');
    const [investorData, setInvestorData] = useState({
        fullName: '',
        email: '',
        linkedinUrl: '',
        firmName: '',
        location: '',
        investorType: '',
        investmentInterest: '',
        valueAdd: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const brandForm = useForm({
        resolver: zodResolver(waitlistSchema),
        defaultValues: {
            full_name: '',
            email: '',
            website_url: '',
            source: 'about',
        },
    });

    const handleBrandSubmit = async (values) => {
        setLoading(true);
        try {
            await apiClient.waitlist.create({
                ...values,
                source: 'about',
            });
            setSuccess(true);
            toast.success('Successfully joined the waitlist!');
            setTimeout(() => {
                setSuccess(false);
                brandForm.reset({ full_name: '', email: '', website_url: '', source: 'about' });
            }, 3000);
        } catch (error) {
            toast.error(error.message || 'Failed to join waitlist. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInvestorSubmit = async (e) => {
        e.preventDefault();
        if (!investorData.fullName || !investorData.email) {
            toast.error('Please fill in required fields');
            return;
        }
        setLoading(true);
        // Mock investor submission - can be connected to backend later
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Investor submission:', investorData);
        setLoading(false);
        setSuccess(true);
        toast.success('Request submitted! We\'ll be in touch soon.');
        setTimeout(() => {
            setSuccess(false);
            setInvestorData({ fullName: '', email: '', linkedinUrl: '', firmName: '', location: '', investorType: '', investmentInterest: '', valueAdd: '' });
        }, 3000);
    };

    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            
            <div className="relative max-w-xl mx-auto px-6">
                {/* Tabs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex bg-[var(--bg-secondary)] rounded-full p-1">
                        <button
                            onClick={() => setActiveTab('brand')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                                activeTab === 'brand' 
                                    ? 'bg-red-600 text-white' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8"
                >
                    {success ? (
                        <div className="py-8 text-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">You're on the list!</h3>
                            <p className="text-[var(--text-secondary)]">We'll be in touch soon.</p>
                        </div>
                    ) : activeTab === 'brand' ? (
                        <>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                Stop Being Invisible
                            </h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                Secure early access to the Searchlyst Discovery Engine. Optimize your brand for ChatGPT, Perplexity, and Gemini.
                            </p>

                            <Form {...brandForm}>
                                <form onSubmit={brandForm.handleSubmit(handleBrandSubmit)} className="space-y-4">
                                    <FormField
                                        control={brandForm.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[var(--text-secondary)]">Full Name</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                                        <Input 
                                                            placeholder="John Smith"
                                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] pl-10"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={brandForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[var(--text-secondary)]">Email</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                                        <Input 
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] pl-10"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={brandForm.control}
                                        name="website_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[var(--text-secondary)]">Website</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                                                        <Input 
                                                            placeholder="Website link"
                                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] pl-10"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                    <Button 
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium group"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Join Waitlist
                                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">
                                Fuel the Future of Search.
                            </h3>
                            <p className="text-[var(--text-secondary)] mb-6 text-center">
                                We are opening a strategic round for value-add partners. Request access to our Data Room and Pitch Deck.
                            </p>

                            <form onSubmit={handleInvestorSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Full Name</label>
                                        <Input 
                                            placeholder="Jane Doe"
                                            value={investorData.fullName}
                                            onChange={(e) => setInvestorData({...investorData, fullName: e.target.value})}
                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Direct Email</label>
                                        <Input 
                                            type="email"
                                            placeholder="jane@vc.com"
                                            value={investorData.email}
                                            onChange={(e) => setInvestorData({...investorData, email: e.target.value})}
                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[var(--text-secondary)] text-sm mb-2 block">LinkedIn Profile URL</label>
                                    <Input 
                                        placeholder="https://linkedin.com/in/yourprofile"
                                        value={investorData.linkedinUrl}
                                        onChange={(e) => setInvestorData({...investorData, linkedinUrl: e.target.value})}
                                        className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Firm / Syndicate Name</label>
                                        <Input 
                                            placeholder="Acme Ventures"
                                            value={investorData.firmName}
                                            onChange={(e) => setInvestorData({...investorData, firmName: e.target.value})}
                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Location</label>
                                        <Input 
                                            placeholder="Dubai, UAE"
                                            value={investorData.location}
                                            onChange={(e) => setInvestorData({...investorData, location: e.target.value})}
                                            className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Investor Type</label>
                                        <Select value={investorData.investorType} onValueChange={(value) => setInvestorData({...investorData, investorType: value})}>
                                            <SelectTrigger className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)]">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Angel">Angel</SelectItem>
                                                <SelectItem value="VC Fund">VC Fund</SelectItem>
                                                <SelectItem value="Family Office">Family Office</SelectItem>
                                                <SelectItem value="Strategic">Strategic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Investment Interest</label>
                                        <Select value={investorData.investmentInterest} onValueChange={(value) => setInvestorData({...investorData, investmentInterest: value})}>
                                            <SelectTrigger className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)]">
                                                <SelectValue placeholder="Select range" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="$50,000 - $100,000 (Angel)">$50,000 - $100,000 (Angel)</SelectItem>
                                                <SelectItem value="$100,000 - $250,000 (Super Angel)">$100,000 - $250,000 (Super Angel)</SelectItem>
                                                <SelectItem value="$250,000 - $500,000 (Strategic)">$250,000 - $500,000 (Strategic)</SelectItem>
                                                <SelectItem value="$500,000 - $1,000,000 (Lead)">$500,000 - $1,000,000 (Lead)</SelectItem>
                                                <SelectItem value="$1,000,000+ (Full Round)">$1,000,000+ (Full Round)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[var(--text-secondary)] text-sm mb-2 block">How can you help beyond capital? (Optional)</label>
                                    <Textarea 
                                        placeholder="Network connections, strategic partnerships, industry expertise..."
                                        value={investorData.valueAdd}
                                        onChange={(e) => setInvestorData({...investorData, valueAdd: e.target.value})}
                                        className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] min-h-[80px]"
                                    />
                                </div>
                                <Button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-medium group"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Request Data Room Access
                                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </motion.div>
            </div>
        </section>
    );
}