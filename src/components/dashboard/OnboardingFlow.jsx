import React, { useState, useEffect } from 'react';
import {
    ArrowRight, ArrowLeft, Globe, Building2, Users, MapPin,
    Languages, Target, Loader2, Sparkles, CheckCircle2, Search,
    Plus, X, ExternalLink, Zap, Shield, BarChart3, Check, Eye, Lightbulb
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { setDashboardUser } from '@/pages/Dashboard';

const companySizes = [
    { id: '1-10', label: '1-10', icon: '👤' },
    { id: '11-100', label: '11-100', icon: '👥' },
    { id: '101-500', label: '101-500', icon: '🏢' },
    { id: '501-1000', label: '501-1K', icon: '🏗️' },
    { id: '1001+', label: '1001+', icon: '🌐' },
];

const languages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese',
    'Hindi', 'Mandarin', 'Japanese', 'Korean', 'Arabic',
    'Italian', 'Dutch', 'Russian', 'Turkish', 'Other'
];

const reachOptions = [
    { id: 'worldwide', label: 'Worldwide', icon: '🌍' },
    { id: 'nationwide', label: 'Nationwide', icon: '🗺️' },
    { id: 'regional', label: 'Regional', icon: '📍' },
    { id: 'state', label: 'State', icon: '🏛️' },
    { id: 'city', label: 'City', icon: '🏙️' },
    { id: 'neighborhood', label: 'Local', icon: '🏘️' },
];

const sourceOptions = [
    'Google Search', 'LinkedIn', 'Twitter / X',
    'Friend / Colleague', 'Blog / Article', 'Podcast', 'Other'
];

const testimonials = [
    {
        quote: "Searchlyst helped us understand exactly how AI engines perceive our brand. Game-changing insights.",
        author: "Miihier Singh",
        role: "Founder & CEO, Belegend Supplements",
        avatar: "img/ms_avatar.jpeg", // Optional: Update these with real images if available
        avatarInitials: "MS"
    },
    {
        quote: "Finally, a tool that shows real AI visibility metrics, not just traditional SEO data.",
        author: "Maryna Boyko",
        role: "Luxury Asset Agent, Dubai, Smart Start Properties LLC",
        avatarInitials: "MB"
    },
    {
        quote: "The competitor analysis alone justified the investment. We saw gaps we never knew existed.",
        author: "Crystal Zhong",
        role: "Director, Sales Channel - Banyan Group Residences",
        avatarInitials: "CZ"
    },
    {
        quote: "For the first time, we can track how our brand appears in ChatGPT, Perplexity, and other AI platforms. Searchlyst turns AI discovery into measurable data.",
        author: "Sana Barkati",
        role: "Real Estate Agent, International Sales, Sarsan Capital",
        avatarInitials: "SB"
    }
];

const stepMeta = [
    { num: 1, title: 'Brand', icon: Check },
    { num: 2, title: 'Company', icon: Building2 },
    { num: 3, title: 'Market', icon: MapPin },
    { num: 4, title: 'Competitors', icon: Users },
    { num: 5, title: 'Finish', icon: Sparkles },
];

export default function OnboardingFlow({ userId, onComplete, mode = 'firstTime' }) {
    const isAddProject = mode === 'addProject';
    const [step, setStep] = useState(1);
    const [testimonialIndex, setTestimonialIndex] = useState(0);

    // Step 1: Basic Info
    const [domain, setDomain] = useState('');
    const [brandName, setBrandName] = useState('');
    const [industry, setIndustry] = useState('');

    // Step 2: Company Details
    const [companySize, setCompanySize] = useState('');
    const [isAgency, setIsAgency] = useState(false);

    // Step 3: Location & Reach
    const [location, setLocation] = useState('');
    const [language, setLanguage] = useState('English');
    const [reach, setReach] = useState('');

    // Step 4: Competitors
    const [competitors, setCompetitors] = useState(['', '', '']);
    const [suggestedCompetitors, setSuggestedCompetitors] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [reSuggestTimer, setReSuggestTimer] = useState(null);

    // Step 5: Source (skipped in addProject mode)
    const [source, setSource] = useState('');

    // Step 6: Generating
    const [generating, setGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState(0);

    const totalSteps = isAddProject ? 4 : 6;

    // Rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch competitor suggestions when entering step 4
    useEffect(() => {
        if (step === 4 && domain && brandName && industry && suggestedCompetitors.length === 0) {
            fetchCompetitorSuggestions();
        }
    }, [step, domain, brandName, industry]);

    const fetchCompetitorSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const response = await apiClient.onboarding.suggestCompetitors({
                domain, brandName, industry, companySize, location, language
            });
            if (response.competitors && Array.isArray(response.competitors)) {
                setSuggestedCompetitors(response.competitors);
            }
        } catch (error) {
            console.error('Failed to fetch competitor suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const addCompetitor = (competitor) => {
        const emptyIndex = competitors.findIndex(c => !c);
        if (emptyIndex !== -1) {
            const newCompetitors = [...competitors];
            newCompetitors[emptyIndex] = competitor;
            setCompetitors(newCompetitors);
        } else if (competitors.length < 10) {
            setCompetitors([...competitors, competitor]);
        }
    };

    const removeCompetitor = (index) => {
        const newCompetitors = [...competitors];
        newCompetitors[index] = '';
        setCompetitors(newCompetitors);
    };

    const addCompetitorField = () => {
        if (competitors.length < 10) setCompetitors([...competitors, '']);
    };

    const triggerReSuggest = () => {
        if (reSuggestTimer) clearTimeout(reSuggestTimer);
        const timer = setTimeout(() => {
            if (domain && brandName && industry) fetchCompetitorSuggestions();
        }, 1500);
        setReSuggestTimer(timer);
    };

    const updateCompetitor = (index, value) => {
        const newCompetitors = [...competitors];
        newCompetitors[index] = value;
        setCompetitors(newCompetitors);
        if (value.trim().length > 2) triggerReSuggest();
    };

    const handleFinish = async () => {
        const userData = {
            domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            brandName, industry, companySize, isAgency,
            location, language, reach,
            competitors: competitors.filter(c => c.trim()),
            suggested_competitors: suggestedCompetitors,
            source, onboarded: true,
            createdAt: new Date().toISOString()
        };

        const triggerAutoScan = async (ud) => {
            try {
                const comps = (ud.competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
                const res = await apiClient.visibility.startScan({
                    brandName: ud.brandName || '', domain: ud.domain || '', industry: ud.industry || '',
                    competitors: comps, location: ud.location || '', language: ud.language || 'English',
                    country: ud.location?.toLowerCase().includes('india') ? 'IN' : '',
                    projectId: ud.projectId || undefined,
                });
                if (res.scanId) {
                    localStorage.setItem(`searchlyst_active_scan_${ud.domain}`, JSON.stringify({
                        scanId: res.scanId, startedAt: new Date().toISOString(),
                    }));
                }
            } catch (err) {
                console.error('Auto-scan trigger failed (non-blocking):', err);
            }
        };

        if (isAddProject) {
            try {
                const { project } = await apiClient.projects.create(userData);
                if (project?.id) userData.projectId = project.id;
            } catch (error) { console.error('Failed to save project:', error); }
            triggerAutoScan(userData);
            onComplete(userData.role || 'founder');
            return;
        }

        setStep(6);
        setGenerating(true);

        const generationSteps = [
            'Analyzing your brand identity...',
            'Scanning AI search engines...',
            'Mapping competitor landscape...',
            'Calculating visibility scores...',
            'Generating insights...',
            'Finalizing your dashboard...'
        ];

        for (let i = 0; i < generationSteps.length; i++) {
            setGenerationStep(i);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        try {
            const { project } = await apiClient.projects.create(userData);
            if (project?.id) userData.projectId = project.id;
        } catch (error) { console.error('Failed to save project:', error); }
        triggerAutoScan(userData);
        setDashboardUser(userId, userData);

        const projects = [{ id: 'project-1', name: brandName, domain: userData.domain, ...userData }];
        localStorage.setItem('searchlyst_projects', JSON.stringify(projects));
        setGenerating(false);
        onComplete(userData.role || 'founder');
    };

    const canProceed = () => {
        switch (step) {
            case 1: return domain.trim() && brandName.trim() && industry.trim();
            case 2: return companySize;
            case 3: return location.trim() && language && reach;
            case 4: return competitors.filter(c => c.trim()).length >= 1;
            case 5: return true;
            default: return false;
        }
    };

    const goNext = () => {
        if (step === 4 && isAddProject) { handleFinish(); return; }
        if (step === 5) { handleFinish(); return; }
        setStep(prev => prev + 1);
    };
    const goBack = () => setStep(prev => Math.max(1, prev - 1));

    const currentTestimonial = testimonials[testimonialIndex];

    const NavButtons = ({ nextLabel, showBack = true, onNext }) => (
        <div className="flex gap-4 pt-2">
            {showBack && (
                <Button onClick={goBack} variant="outline" className="h-[46px] px-6 border-[#222] bg-transparent text-[#aaa] hover:bg-[#1A1A1A] hover:text-white rounded-xl transition-all">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
            )}
            <Button
                onClick={onNext || goNext}
                disabled={!canProceed()}
                className="flex-1 h-[46px] bg-[#E92A15] hover:bg-[#D4220E] text-white rounded-xl shadow-[0_0_20px_rgba(233,42,21,0.3)] disabled:opacity-40 disabled:shadow-none transition-all font-medium text-[14px]"
            >
                {nextLabel || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );

    return (
        <div className="h-screen bg-[#0B0B0B] flex text-white font-sans overflow-hidden">
            {isAddProject && (
                <button onClick={() => onComplete('founder')} className="fixed top-6 right-6 z-50 px-4 py-2 text-sm text-[#888] hover:text-white border border-[#333] rounded-lg hover:bg-[#1A1A1A] transition-colors">
                    ← Back to Dashboard
                </button>
            )}

            {/* Left Side - Form (Scrollable) */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative w-full lg:max-w-none max-w-2xl mx-auto">
              <div className="min-h-full flex flex-col justify-center px-8 lg:px-16 py-8 max-w-[600px] mx-auto">
                {/* Logo */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2">
                        <img src="/searchlyst_logo.png" alt="Searchlyst" className="h-5 object-contain filter invert" />
                    </div>
                </div>

                {/* Step Indicator */}
                {step <= 5 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-0 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {stepMeta.slice(0, isAddProject ? 4 : 5).map((s, i) => {
                                const isActive = step === s.num;
                                const isDone = step > s.num;
                                return (
                                    <React.Fragment key={s.num}>
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border shrink-0 ${
                                            isActive 
                                                ? 'border-[#E92A15] text-[#E92A15] bg-[#E92A15]/5'
                                                : isDone 
                                                    ? 'border-[#222] text-[#888] bg-transparent'
                                                    : 'border-[#222] text-[#555] bg-transparent'
                                        }`}>
                                            {isDone ? <Check className={`w-3.5 h-3.5 ${isActive ? 'text-[#E92A15]' : 'text-[#888]'}`} /> 
                                                : s.num === 1 && !isActive ? <Globe className="w-3.5 h-3.5" /> 
                                                : null}
                                            {s.num === 1 && isActive && <Globe className="w-3.5 h-3.5" />}
                                            {s.num === 2 && !isDone && <Building2 className="w-3.5 h-3.5" />}
                                            {s.num === 3 && !isDone && <MapPin className="w-3.5 h-3.5" />}
                                            {s.num === 4 && !isDone && <Users className="w-3.5 h-3.5" />}
                                            {s.num === 5 && !isDone && <Sparkles className="w-3.5 h-3.5" />}
                                            <span>{s.title}</span>
                                        </div>
                                        {i < (isAddProject ? 3 : 4) && (
                                            <div className={`w-6 h-[1px] shrink-0 mx-2 ${isDone ? 'bg-[#444]' : 'bg-[#222]'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── STEP 1: Basic Info ─── */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-[28px] font-bold text-white tracking-tight">{isAddProject ? 'Add a new project' : "Let's get started"}</h1>
                            <p className="text-[#888] mt-1 text-[14px]">
                                {isAddProject ? 'Set up a new domain to track its AI visibility' : (
                                    <>Tell us about your <span className="text-[#E92A15] font-semibold">brand</span> so we can track your AI visibility</>
                                )}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[12px] font-semibold text-[#aaa] mb-1.5 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" /> Website Domain
                                </label>
                                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourcompany.com"
                                    className="h-[46px] border-[#222] bg-[#111]/50 focus:border-[#E92A15] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-white placeholder:text-[#555] rounded-xl text-[14px] px-4 transition-colors" />
                            </div>

                            <div>
                                <label className="text-[12px] font-semibold text-[#aaa] mb-1.5 flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" /> Brand Name
                                </label>
                                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your Company Name"
                                    className="h-[46px] border-[#222] bg-[#111]/50 focus:border-[#E92A15] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-white placeholder:text-[#555] rounded-xl text-[14px] px-4 transition-colors" />
                            </div>

                            <div>
                                <label className="text-[12px] font-semibold text-[#aaa] mb-1.5 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5" /> Industry
                                </label>
                                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, HealthTech, FinTech, E-commerce"
                                    className="h-[46px] border-[#222] bg-[#111]/50 focus:border-[#E92A15] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-white placeholder:text-[#555] rounded-xl text-[14px] px-4 transition-colors" />
                            </div>
                        </div>

                        <NavButtons showBack={false} />

                        {/* Smart hint */}
                        <div className="mt-6 pt-4 border-t border-[#222]">
                            <div className="flex items-start gap-3 p-3 bg-[#111]/40 rounded-xl border border-[#222]">
                                <Zap className="w-4 h-4 text-[#888] mt-0.5 shrink-0" />
                                <p className="text-[12px] text-[#888] leading-relaxed">
                                    Our AI will use your domain to auto-discover competitors, analyze your market position, and set up tracking across <span className="font-semibold text-white">Perplexity, Gemini</span> & <span className="font-semibold text-white">Google AI</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: Company Details ─── */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-[28px] font-bold text-white tracking-tight">Tell us about your company</h1>
                            <p className="text-[#888] mt-1 text-[14px]">This helps us tailor your <span className="text-[#E92A15] font-semibold">visibility benchmarks</span></p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[12px] font-semibold text-[#aaa] mb-2.5 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Company Size
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                    {companySizes.map(size => (
                                        <button key={size.id} onClick={() => setCompanySize(size.id)}
                                            className={`flex flex-col items-center justify-center gap-1.5 p-2 h-[72px] rounded-xl border transition-all ${
                                                companySize === size.id
                                                    ? 'bg-[#111] border-[#E92A15] text-white'
                                                    : 'bg-transparent border-[#222] text-[#888] hover:border-[#444] hover:text-[#ccc]'
                                            }`}>
                                            <span className="text-lg opacity-80">{size.icon}</span>
                                            <span className="text-[12px] font-medium">{size.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setIsAgency(!isAgency)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-transparent border border-[#222] hover:border-[#444] transition-colors text-left group mt-2">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isAgency ? 'bg-[#E92A15] border-[#E92A15]' : 'bg-transparent border-[#444] group-hover:border-[#666]'
                                }`}>
                                    {isAgency && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <div>
                                    <span className="text-[14px] font-medium text-white block">I'm an agency tracking multiple brands</span>
                                    <span className="text-[12px] text-[#888] mt-0.5 block">You'll be able to add more projects later</span>
                                </div>
                            </button>
                        </div>

                        <NavButtons />

                        <div className="mt-6 pt-4 border-t border-[#222]">
                            <div className="flex items-start gap-3 p-3 bg-[#111]/40 rounded-xl border border-[#222]">
                                <Building2 className="w-4 h-4 text-[#888] mt-0.5 shrink-0" />
                                <p className="text-[12px] text-[#888] leading-relaxed">
                                    Company size helps us benchmark your AI visibility against <span className="font-semibold text-white">similar-scale competitors</span> and set realistic growth targets for your market segment.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: Location & Reach ─── */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-[28px] font-bold text-white tracking-tight">Where are you located?</h1>
                            <p className="text-[#888] mt-1 text-[14px]">Help us target the right <span className="text-[#E92A15] font-semibold">AI engines</span> for your market</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[12px] font-semibold text-[#aaa] mb-2 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> Location
                                </label>
                                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA or United States"
                                    className="h-[46px] border-[#222] bg-[#111]/50 focus:border-[#E92A15] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-white placeholder:text-[#555] rounded-xl text-[14px] px-4 transition-colors" />
                            </div>

                            <div>
                                <label className="text-[12px] font-semibold text-[#aaa] mb-2 flex items-center gap-2">
                                    <Languages className="w-3.5 h-3.5" /> Primary Language
                                </label>
                                <div className="relative">
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full h-[46px] px-4 rounded-xl border border-[#222] bg-[#111]/50 text-white focus:border-[#E92A15] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-[14px] appearance-none transition-colors outline-none cursor-pointer">
                                        <option value="" disabled className="text-black">Select</option>
                                        {languages.map(lang => <option key={lang} value={lang} className="text-black">{lang}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]">
                                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="text-[12px] font-semibold text-[#aaa] mb-2 block">
                                    Brand's Reach
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {reachOptions.map(opt => (
                                        <button key={opt.id} onClick={() => setReach(opt.id)}
                                            className={`flex flex-col items-center justify-center gap-1.5 p-2 h-[72px] rounded-xl border transition-all ${
                                                reach === opt.id
                                                    ? 'bg-[#111] border-[#E92A15] text-white'
                                                    : 'bg-transparent border-[#222] text-[#888] hover:border-[#444] hover:text-[#ccc]'
                                            }`}>
                                            <span className="text-lg opacity-80">{opt.icon}</span>
                                            <span className="text-[12px] font-medium">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <NavButtons />
                    </div>
                )}

                {/* ─── STEP 4: Competitors ─── */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-[28px] font-bold text-white tracking-tight">Who are your competitors?</h1>
                            <p className="text-[#888] mt-1 text-[14px]">Add at least one competitor to track their <span className="text-[#E92A15] font-semibold">AI visibility</span> vs yours</p>
                        </div>

                        <div className="space-y-3">
                            {competitors.map((comp, index) => (
                                <div key={index} className="relative group">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                                    <Input value={comp} onChange={(e) => updateCompetitor(index, e.target.value)}
                                        placeholder={`Competitor ${index + 1} domain e.g. rival.com`}
                                        className="h-[46px] pl-11 pr-11 border-[#222] bg-[#111]/50 focus:border-[#E92A15] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-white placeholder:text-[#555] rounded-xl text-[14px] transition-colors" />
                                    {comp && (
                                        <button onClick={() => removeCompetitor(index)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#555] hover:text-white rounded-lg hover:bg-[#222] transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {competitors.length < 10 && (
                                <button onClick={addCompetitorField} className="flex items-center gap-2 text-[13px] text-[#aaa] hover:text-white transition-colors font-medium mt-3">
                                    <Plus className="w-3.5 h-3.5" /> Add another competitor
                                </button>
                            )}
                        </div>

                        {/* AI Suggested Competitors */}
                        <div className="pt-4 border-t border-[#222]">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-transparent border border-[#E92A15]/50 rounded text-white">
                                    <Sparkles className="w-3 h-3 text-[#E92A15]" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">AI-Powered</span>
                                </div>
                                <span className="text-[13px] font-medium text-[#aaa]">Suggested Competitors</span>
                                {loadingSuggestions && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E92A15]" />}
                            </div>

                            {loadingSuggestions ? (
                                <div className="flex flex-wrap gap-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-8 bg-[#222] rounded-full animate-pulse" style={{ width: `${80 + (i%3) * 30}px` }} />
                                    ))}
                                </div>
                            ) : suggestedCompetitors.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {suggestedCompetitors.map((sugg, i) => {
                                        const key = sugg.domain || sugg.name;
                                        const isAdded = competitors.includes(key);
                                        return (
                                            <button key={i} onClick={() => addCompetitor(key)} disabled={isAdded}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] transition-all whitespace-nowrap ${
                                                    isAdded 
                                                        ? 'bg-transparent border-[#444] text-[#666] cursor-not-allowed'
                                                        : 'bg-transparent border-[#333] text-[#ddd] hover:border-[#666] hover:text-white'
                                                }`}>
                                                {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                <span>{sugg.name || sugg.domain}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 p-3 bg-[#111]/40 rounded-xl border border-[#222]">
                                    <p className="text-[12px] text-[#888] leading-relaxed italic">
                                        Enter your domain and industry to get AI-powered competitor suggestions.
                                    </p>
                                </div>
                            )}
                        </div>

                        <NavButtons nextLabel={isAddProject ? 'Create Project' : 'Continue'} />
                    </div>
                )}

                {/* ─── STEP 5: Source & Complete (firstTime only) ─── */}
                {step === 5 && !isAddProject && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-[28px] font-bold text-white tracking-tight">Almost there!</h1>
                            <p className="text-[#888] mt-1 text-[14px]">One last question before we set up your dashboard</p>
                        </div>

                        {/* What you get */}
                        <div className="border border-[#331111] rounded-2xl p-6 bg-[#0B0505] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-[80%] h-full bg-gradient-to-r from-[#E92A15]/10 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-10 h-10 rounded-xl border border-[#E92A15]/40 bg-[#E92A15]/10 flex items-center justify-center text-[#E92A15] shadow-[0_0_15px_rgba(233,42,21,0.15)] shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-white text-[18px]">Your Dashboard Is Almost Ready</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 relative z-10">
                                {[
                                    { icon: Eye, text: 'AI visibility tracking' },
                                    { icon: BarChart3, text: 'Competitor analytics' },
                                    { icon: Shield, text: 'Website health audits' },
                                    { icon: Lightbulb, text: 'Content recommendations' },
                                ].map((item, i) => {
                                    const IconNode = item.icon;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl border border-[#333] bg-[#1A1A1A] flex items-center justify-center shrink-0 text-[#888]">
                                                <IconNode className="w-4 h-4" />
                                            </div>
                                            <span className="text-[14px] text-[#ccc] font-medium">{item.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-[13px] font-medium text-[#aaa] mb-3 block">
                                How did you hear about Searchlyst?
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {sourceOptions.map(opt => (
                                    <button key={opt} onClick={() => setSource(opt)}
                                        className={`px-3 py-2 rounded-full border text-[12px] transition-all whitespace-nowrap ${
                                            source === opt
                                                ? 'bg-[#111] border-[#E92A15] text-white'
                                                : 'bg-transparent border-[#222] text-[#888] hover:border-[#444] hover:text-[#ccc]'
                                        }`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <NavButtons nextLabel="Complete Setup" showBack={true} onNext={handleFinish} />
                    </div>
                )}

                {/* ─── STEP 6: Generating Report ─── */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in py-12 flex flex-col items-center justify-center flex-1 h-full text-center w-full max-w-[360px] mx-auto">
                        <div className="text-center w-full">
                            <h1 className="text-[28px] font-bold text-white tracking-tight">Setting up your dashboard</h1>
                            <p className="text-[#888] mt-1 text-[14px]">This will only take a moment...</p>
                        </div>

                        <div className="relative w-24 h-24 flex items-center justify-center my-6 shrink-0">
                            {/* Outer dashed ring */}
                            <svg className="absolute inset-0 w-full h-full text-[#333] animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                            </svg>
                            {/* Inner loader ring */}
                            <svg className="absolute inset-2 w-20 h-20 text-[#222]" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <svg className="absolute inset-2 w-20 h-20 text-[#E92A15] animate-[spin_2s_linear_infinite]" viewBox="0 0 100 100" style={{ transformOrigin: 'center' }}>
                                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="290" strokeDashoffset="220" strokeLinecap="round" />
                            </svg>
                            {/* Inner circle */}
                            <div className="w-12 h-12 rounded-full border border-[#333] bg-[#111] flex items-center justify-center z-10 shadow-[0_0_30px_rgba(233,42,21,0.2)]">
                                <Search className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="space-y-3 w-full text-left">
                            {[
                                'Analyzing your brand identity...',
                                'Scanning AI search engines...',
                                'Mapping competitor landscape...',
                                'Calculating visibility scores...',
                                'Generating insights...',
                                'Finalizing your dashboard...'
                            ].map((text, i) => (
                                <div key={i} className={`flex items-center gap-3 text-[13px] transition-all duration-300 ${i <= generationStep ? 'text-white' : 'text-[#555]'}`}>
                                    {i < generationStep ? (
                                        <div className="w-4 h-4 rounded-full bg-transparent flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-[#E92A15]" />
                                        </div>
                                    ) : i === generationStep ? (
                                        <div className="w-4 h-4 rounded-full border border-[#E92A15] border-t-transparent animate-spin shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-[#333] shrink-0" />
                                    )}
                                    <span className="truncate">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Right Side - Fixed Panel with Testimonial Carousel OR Engine Logos */}
            {step === 6 ? (
                <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative p-10 border-l border-[#1A1A1A] bg-[#0A0A0A] h-full">
                   <div className="flex flex-col items-center gap-10 text-[#555] opacity-50">
                        <div className="text-lg font-medium tracking-widest uppercase">Analyzing across engines</div>
                        <div className="flex justify-center flex-wrap max-w-sm gap-10">
                            {['ChatGPT', 'Gemini', 'Perplexity', 'Claude'].map(engine => (
                                <div key={engine} className="text-base font-semibold">{engine}</div>
                            ))}
                        </div>
                   </div>
                </div>
            ) : (
                <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative p-8 lg:p-12 border-l border-[#222] bg-[#0B0B0B] h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0D0D0D] to-[#0A0A0A] pointer-events-none" />
                    
                    <div className="relative w-full max-w-[380px] z-10 flex flex-col items-center">
                        <div className="bg-[#111]/80 backdrop-blur-md rounded-[24px] p-8 border border-[#222] relative group transition-colors hover:border-[#333] w-full">
                            {/* Custom Red Quotes SVG / Graphics */}
                            <div className="flex gap-2 mb-6">
                                <div className="w-2.5 h-8 rounded-[4px] bg-[#E92A15]" />
                                <div className="w-2.5 h-8 rounded-[4px] bg-[#E92A15]" />
                            </div>
                            
                            <p className="text-[16px] text-white leading-relaxed mb-6 font-medium">
                                {currentTestimonial.quote}
                            </p>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-[#333] bg-[#222] overflow-hidden flex items-center justify-center shrink-0">
                                    <span className="text-xs font-semibold text-[#888]">{currentTestimonial.avatarInitials}</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-[14px]">{currentTestimonial.author}</h4>
                                    <p className="text-[12px] text-[#888]">{currentTestimonial.role}</p>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Indicators */}
                        <div className="flex justify-center gap-1.5 mt-6">
                            {testimonials.map((_, i) => (
                                <button key={i} onClick={() => setTestimonialIndex(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === testimonialIndex ? 'bg-[#E92A15] w-5' : 'bg-[#333] w-1.5 hover:bg-[#555]'}`} aria-label={`Go to slide ${i + 1}`} />
                            ))}
                        </div>
                    </div>
                        
                    {/* Features directly below carousel, wide container for single line */}
                    <div className="flex justify-center items-center gap-x-8 w-full mt-10 z-10 whitespace-nowrap relative">
                        {[
                            { label: 'AI Citation Tracking' },
                            { label: 'Competitor Intelligence' },
                            { label: 'Daily Health Audits' }
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[14px] text-[#aaa] font-medium">
                                <div className="w-5 h-5 rounded-full border border-[#E92A15] flex items-center justify-center">
                                    <Check className="w-3 h-3 text-[#E92A15]" />
                                </div>
                                {feature.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
