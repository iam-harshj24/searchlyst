import React, { useState, useEffect } from 'react';
import {
    ArrowRight, ArrowLeft, Globe, Building2, Users, MapPin,
    Languages, Target, Loader2, Sparkles, CheckCircle2, Search,
    Plus, X, ExternalLink, Zap, Shield, BarChart3
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
    'Google Search', 'LinkedIn', 'Twitter/X',
    'Friend/Colleague', 'Blog/Article', 'Podcast', 'Other'
];

const testimonials = [
    {
        quote: "Searchlyst helped us understand exactly how AI engines perceive our brand. Game-changing insights.",
        author: "Sarah Chen",
        role: "CMO at TechFlow",
        avatar: "SC"
    },
    {
        quote: "Finally, a tool that shows real AI visibility metrics, not just traditional SEO data.",
        author: "Marcus Johnson",
        role: "Growth Lead at ScaleUp",
        avatar: "MJ"
    },
    {
        quote: "The competitor analysis alone justified the investment. We saw gaps we never knew existed.",
        author: "Emily Rodriguez",
        role: "Head of Marketing at DataPro",
        avatar: "ER"
    }
];

const stepMeta = [
    { num: 1, title: 'Brand', icon: Globe },
    { num: 2, title: 'Company', icon: Building2 },
    { num: 3, title: 'Market', icon: MapPin },
    { num: 4, title: 'Competitors', icon: Target },
    { num: 5, title: 'Finish', icon: Sparkles },
];

export default function OnboardingFlow({ onComplete, mode = 'firstTime' }) {
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
    }, [step]);

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
            try { await apiClient.projects.create(userData); } catch (error) { console.error('Failed to save project:', error); }
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

        try { await apiClient.projects.create(userData); } catch (error) { console.error('Failed to save project:', error); }
        triggerAutoScan(userData);
        setDashboardUser(userData);

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

    // Navigation buttons — reusable
    const NavButtons = ({ nextLabel, showBack = true, onNext }) => (
        <div className="flex gap-3 pt-2">
            {showBack && (
                <Button onClick={goBack} variant="outline" className="h-12 px-6 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
            )}
            <Button
                onClick={onNext || goNext}
                disabled={!canProceed()}
                className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 disabled:opacity-40 disabled:shadow-none transition-all"
            >
                {nextLabel || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-white flex">
            {isAddProject && (
                <button onClick={() => onComplete('founder')} className="fixed top-6 right-6 z-50 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    ← Back to Dashboard
                </button>
            )}

            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 max-w-2xl mx-auto">
                {/* Logo */}
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <img src="/searchlyst_logo.png" alt="Searchlyst" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold text-gray-900">Searchlyst</span>
                    </div>
                </div>

                {/* Step Indicator */}
                {step <= 5 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-1 mb-2">
                            {stepMeta.slice(0, isAddProject ? 4 : 5).map((s, i) => {
                                const Icon = s.icon;
                                const isActive = step === s.num;
                                const isDone = step > s.num;
                                return (
                                    <React.Fragment key={s.num}>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                                : isDone ? 'bg-green-50 text-green-700'
                                                    : 'bg-gray-50 text-gray-400'
                                            }`}>
                                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                            <span className="hidden sm:inline">{s.title}</span>
                                        </div>
                                        {i < (isAddProject ? 3 : 4) && (
                                            <div className={`w-6 h-0.5 rounded ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                                <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
                                    <div className={`h-full rounded-full transition-all duration-500 ${s <= step ? 'bg-red-500 w-full' : 'w-0'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── STEP 1: Basic Info ─── */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{isAddProject ? 'Add a new project' : "Let's get started"}</h1>
                            <p className="text-gray-500 mt-1">{isAddProject ? 'Set up a new domain to track its AI visibility' : 'Tell us about your brand so we can track your AI visibility'}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400" /> Website Domain
                                </label>
                                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourcompany.com"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 text-gray-900 bg-white placeholder:text-gray-400 rounded-xl" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" /> Brand Name
                                </label>
                                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your Company Name"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 text-gray-900 bg-white placeholder:text-gray-400 rounded-xl" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-gray-400" /> Industry
                                </label>
                                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, HealthTech, FinTech, E-commerce"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 text-gray-900 bg-white placeholder:text-gray-400 rounded-xl" />
                            </div>
                        </div>

                        <NavButtons showBack={false} />

                        {/* Smart hint */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">Our AI will use your domain to auto-discover competitors, analyze your market position, and set up tracking across Perplexity, Gemini & Google AI.</p>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: Company Details ─── */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tell us about your company</h1>
                            <p className="text-gray-500 mt-1">This helps us tailor your visibility benchmarks</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" /> Company Size
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {companySizes.map(size => (
                                        <button key={size.id} onClick={() => setCompanySize(size.id)}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${companySize === size.id
                                                    ? 'bg-red-50 border-red-400 text-red-700 shadow-sm ring-1 ring-red-200'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'}`}>
                                            <span className="text-lg">{size.icon}</span>
                                            <span className="text-xs">{size.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={isAgency} onChange={(e) => setIsAgency(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">I'm an agency tracking multiple brands</span>
                                        <p className="text-xs text-gray-400 mt-0.5">You'll be able to add more projects later</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <NavButtons />
                    </div>
                )}

                {/* ─── STEP 3: Location & Reach ─── */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Where are you located?</h1>
                            <p className="text-gray-500 mt-1">Help us target the right AI engines for your market</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" /> Location
                                </label>
                                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA or United States"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 text-gray-900 bg-white placeholder:text-gray-400 rounded-xl" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-gray-400" /> Primary Language
                                </label>
                                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-red-500 focus:ring-red-500 text-sm">
                                    {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-3 block">
                                    Brand's Reach
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {reachOptions.map(opt => (
                                        <button key={opt.id} onClick={() => setReach(opt.id)}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all ${reach === opt.id
                                                    ? 'bg-red-50 border-red-400 text-red-700 shadow-sm ring-1 ring-red-200'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'}`}>
                                            <span className="text-lg">{opt.icon}</span>
                                            <span className="text-xs">{opt.label}</span>
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
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Who are your competitors?</h1>
                            <p className="text-gray-500 mt-1">Add at least one competitor to track their AI visibility vs yours</p>
                        </div>

                        <div className="space-y-3">
                            {competitors.map((comp, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input value={comp} onChange={(e) => updateCompetitor(index, e.target.value)}
                                        placeholder={index < 3 ? `Competitor ${index + 1} domain e.g. rival.com` : `Competitor ${index + 1} (optional)`}
                                        className="h-11 flex-1 border-gray-200 focus:border-red-500 focus:ring-red-500 text-gray-900 bg-white placeholder:text-gray-400 rounded-xl" />
                                    {comp && (
                                        <button onClick={() => removeCompetitor(index)}
                                            className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200 rounded-xl hover:border-red-200 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {competitors.length < 10 && (
                                <button onClick={addCompetitorField} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
                                    <Plus className="w-4 h-4" /> Add another competitor
                                </button>
                            )}
                        </div>

                        {/* AI Suggested Competitors */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                                    <Sparkles className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-xs font-semibold text-red-700">AI-Powered</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">Suggested Competitors</span>
                                {loadingSuggestions && <Loader2 className="w-4 h-4 animate-spin text-red-400" />}
                            </div>

                            {loadingSuggestions ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" style={{ width: `${60 + i * 8}%` }} />
                                    ))}
                                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                                        <Search className="w-3 h-3" /> Searching G2, Capterra, Reddit & Crunchbase...
                                    </p>
                                </div>
                            ) : suggestedCompetitors.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {suggestedCompetitors.map((sugg, i) => {
                                        const key = sugg.domain || sugg.name;
                                        const isAdded = competitors.includes(key);
                                        return (
                                            <button key={i} onClick={() => addCompetitor(key)} disabled={isAdded}
                                                title={sugg.reason || sugg.compete_reason || ''}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${isAdded ? 'bg-green-50 border-green-200 text-green-700'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:shadow-sm'}`}>
                                                {isAdded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                <span>{sugg.name || sugg.domain}</span>
                                                {sugg.confidence === 'high' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">Enter your details to get AI-powered competitor suggestions</div>
                            )}
                        </div>

                        <NavButtons nextLabel={isAddProject ? 'Create Project' : 'Continue'} />
                    </div>
                )}

                {/* ─── STEP 5: Source & Complete (firstTime only) ─── */}
                {step === 5 && !isAddProject && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Almost there! 🎉</h1>
                            <p className="text-gray-500 mt-1">One last question before we set up your dashboard</p>
                        </div>

                        {/* What you get */}
                        <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-2xl p-5 border border-red-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-red-600" />
                                <span className="font-bold text-gray-900">Your dashboard is almost ready</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { icon: Search, text: 'AI visibility tracking' },
                                    { icon: BarChart3, text: 'Competitor analytics' },
                                    { icon: Shield, text: 'Website health audits' },
                                    { icon: Zap, text: 'Content recommendations' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 rounded-lg px-3 py-2">
                                        <item.icon className="w-4 h-4 text-red-500" />
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-3 block">
                                How did you hear about Searchlyst?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {sourceOptions.map(opt => (
                                    <button key={opt} onClick={() => setSource(opt)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${source === opt
                                                ? 'bg-red-50 border-red-400 text-red-700 ring-1 ring-red-200'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <NavButtons nextLabel="Complete Setup" onNext={handleFinish} />
                    </div>
                )}

                {/* ─── STEP 6: Generating Report ─── */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in text-center py-12">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Setting up your dashboard</h1>
                            <p className="text-gray-500 mt-1">This will only take a moment...</p>
                        </div>

                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-red-100 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full border-4 border-t-red-500 border-r-red-500 border-b-transparent border-l-transparent animate-spin" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 max-w-sm mx-auto">
                            {[
                                'Analyzing your brand identity...',
                                'Scanning AI search engines...',
                                'Mapping competitor landscape...',
                                'Calculating visibility scores...',
                                'Generating insights...',
                                'Finalizing your dashboard...'
                            ].map((text, i) => (
                                <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i <= generationStep ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {i < generationStep ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : i === generationStep ? (
                                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                    )}
                                    {text}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center gap-6 pt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">P</div>
                                Perplexity
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">G</div>
                                Gemini
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">AI</div>
                                Google AI
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side - Testimonial (hidden on mobile, visible on lg+) */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-50 to-gray-100 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }} />
                </div>

                <div className="relative max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-500">
                        <div className="text-5xl text-red-500 mb-4">"</div>
                        <p className="text-xl text-gray-700 leading-relaxed mb-6">
                            {currentTestimonial.quote}
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                                {currentTestimonial.avatar}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{currentTestimonial.author}</p>
                                <p className="text-sm text-gray-500">{currentTestimonial.role}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, i) => (
                            <button key={i} onClick={() => setTestimonialIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === testimonialIndex ? 'bg-red-500 w-6' : 'bg-gray-300'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
