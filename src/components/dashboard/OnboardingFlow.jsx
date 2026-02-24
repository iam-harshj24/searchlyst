import React, { useState, useEffect } from 'react';
import {
    ArrowRight, ArrowLeft, Globe, Building2, Users, MapPin,
    Languages, Target, Loader2, Sparkles, CheckCircle2, Search,
    Plus, X, ExternalLink
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { setDashboardUser } from '@/pages/Dashboard';

const companySizes = [
    { id: '1-10', label: '1-10 employees' },
    { id: '11-100', label: '11-100 employees' },
    { id: '101-500', label: '101-500 employees' },
    { id: '501-1000', label: '501-1000 employees' },
    { id: '1001+', label: '1001+ employees' },
];

const languages = [
    'English', 'Spanish', 'French', 'German', 'Portuguese',
    'Hindi', 'Mandarin', 'Japanese', 'Korean', 'Arabic',
    'Italian', 'Dutch', 'Russian', 'Turkish', 'Other'
];

const reachOptions = [
    { id: 'worldwide', label: 'Worldwide' },
    { id: 'nationwide', label: 'Nationwide' },
    { id: 'regional', label: 'Regional' },
    { id: 'state', label: 'State' },
    { id: 'city', label: 'City' },
    { id: 'neighborhood', label: 'Neighborhood' },
];

const sourceOptions = [
    'Google Search',
    'LinkedIn',
    'Twitter/X',
    'Friend/Colleague',
    'Blog/Article',
    'Podcast',
    'Other'
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

    // addProject mode: 4 steps (basic, company, location, competitors)
    // firstTime mode: 6 steps (+ source + generating)
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
                domain,
                brandName,
                industry,
                companySize,
                location,
                language
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
        if (competitors.length < 10) {
            setCompetitors([...competitors, '']);
        }
    };

    // Debounced re-suggestion when user types custom competitors
    const triggerReSuggest = () => {
        if (reSuggestTimer) clearTimeout(reSuggestTimer);
        const timer = setTimeout(() => {
            if (domain && brandName && industry) {
                fetchCompetitorSuggestions();
            }
        }, 1500);
        setReSuggestTimer(timer);
    };

    const updateCompetitor = (index, value) => {
        const newCompetitors = [...competitors];
        newCompetitors[index] = value;
        setCompetitors(newCompetitors);
        // Re-suggest when user types a custom competitor
        if (value.trim().length > 2) triggerReSuggest();
    };

    const handleFinish = async () => {
        const userData = {
            domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
            brandName,
            industry,
            companySize,
            isAgency,
            location,
            language,
            reach,
            competitors: competitors.filter(c => c.trim()),
            suggested_competitors: suggestedCompetitors,
            source,
            onboarded: true,
            createdAt: new Date().toISOString()
        };

        // Helper: kick off visibility scan in background after project creation
        const triggerAutoScan = async (ud) => {
            try {
                const comps = (ud.competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
                const res = await apiClient.visibility.startScan({
                    brandName: ud.brandName || '', domain: ud.domain || '', industry: ud.industry || '',
                    competitors: comps, location: ud.location || '', language: ud.language || 'English',
                    country: ud.location?.toLowerCase().includes('india') ? 'IN' : '',
                });
                if (res.scanId) {
                    // Store active scan so AIVisibilityPage can auto-resume polling
                    localStorage.setItem(`searchlyst_active_scan_${ud.domain}`, JSON.stringify({
                        scanId: res.scanId, startedAt: new Date().toISOString(),
                    }));
                }
            } catch (err) {
                console.error('Auto-scan trigger failed (non-blocking):', err);
            }
        };

        if (isAddProject) {
            // In addProject mode: save project directly and return
            try {
                await apiClient.projects.create(userData);
            } catch (error) {
                console.error('Failed to save project to backend:', error);
            }
            // Fire scan in background (don't await — let dashboard handle polling)
            triggerAutoScan(userData);
            onComplete(userData.role || 'founder');
            return;
        }

        // First-time mode: show generation animation
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
            await apiClient.projects.create(userData);
        } catch (error) {
            console.error('Failed to save project to backend:', error);
        }

        // Fire scan in background right after project creation
        triggerAutoScan(userData);

        setDashboardUser(userData);

        const projects = [{
            id: 'project-1',
            name: brandName,
            domain: userData.domain,
            ...userData
        }];
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

    const currentTestimonial = testimonials[testimonialIndex];

    return (
        <div className="min-h-screen bg-white flex">
            {/* Back to Dashboard button for addProject mode */}
            {isAddProject && (
                <button
                    onClick={() => onComplete('founder')}
                    className="fixed top-6 right-6 z-50 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ← Back to Dashboard
                </button>
            )}
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 max-w-2xl">
                {/* Logo */}
                <div className="mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <Search className="w-4 h-4 text-[var(--text-primary)]" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Searchlyst</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                        <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                            <div className={`h-full rounded-full transition-all duration-500 ${s <= step ? 'bg-red-500 w-full' : 'w-0'
                                }`} />
                        </div>
                    ))}
                    <span className="text-sm text-gray-400 ml-2">{step}/{totalSteps}</span>
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{isAddProject ? 'Add a new project' : "Let's get started"}</h1>
                            <p className="text-gray-500 mt-1">{isAddProject ? 'Set up a new domain to track its AI visibility' : 'Tell us about your brand so we can track your AI visibility'}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400" /> Website Domain
                                </label>
                                <Input
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="yourcompany.com"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" /> Brand Name
                                </label>
                                <Input
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Your Company Name"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                                    <Target className="w-4 h-4 text-gray-400" /> Industry
                                </label>
                                <Input
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    placeholder="e.g. SaaS, HealthTech, FinTech, E-commerce"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            disabled={!canProceed()}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-lg text-sm font-medium"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Company Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Tell us about your company</h1>
                            <p className="text-gray-500 mt-1">This helps us tailor your visibility benchmarks</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" /> Company Size
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {companySizes.map(size => (
                                        <button
                                            key={size.id}
                                            onClick={() => setCompanySize(size.id)}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${companySize === size.id
                                                ? 'bg-red-50 border-red-500 text-red-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {size.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAgency}
                                        onChange={(e) => setIsAgency(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">I'm an agency tracking multiple brands</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setStep(1)}
                                variant="outline"
                                className="flex-1 h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                disabled={!canProceed()}
                                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)]"
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Location & Reach */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Where are you located?</h1>
                            <p className="text-gray-500 mt-1">Help us target the right AI engines for your market</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" /> Location
                                </label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. San Francisco, CA or United States"
                                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-gray-400" /> Primary Language
                                </label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full h-12 px-3 rounded-lg border border-gray-200 text-gray-900 focus:border-red-500 focus:ring-red-500"
                                >
                                    {languages.map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-3 block">
                                    Brand's Reach
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {reachOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setReach(opt.id)}
                                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${reach === opt.id
                                                ? 'bg-red-50 border-red-500 text-red-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setStep(2)}
                                variant="outline"
                                className="flex-1 h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={() => setStep(4)}
                                disabled={!canProceed()}
                                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)]"
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Competitors */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Who are your competitors?</h1>
                            <p className="text-gray-500 mt-1">Add at least one competitor to track their AI visibility vs yours</p>
                        </div>

                        <div className="space-y-3">
                            {competitors.map((comp, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={comp}
                                        onChange={(e) => updateCompetitor(index, e.target.value)}
                                        placeholder={index < 3 ? `Competitor ${index + 1}` : `Competitor ${index + 1} (optional)`}
                                        className="h-12 flex-1 border-gray-200 focus:border-red-500 focus:ring-red-500"
                                    />
                                    {comp && (
                                        <button
                                            onClick={() => removeCompetitor(index)}
                                            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {competitors.length < 10 && (
                                <button
                                    onClick={addCompetitorField}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600"
                                >
                                    <Plus className="w-4 h-4" /> Add another competitor
                                </button>
                            )}
                        </div>

                        {/* AI Suggested Competitors */}
                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-gray-700">AI-Suggested Competitors</span>
                                {loadingSuggestions && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                            </div>

                            {loadingSuggestions ? (
                                <div className="text-sm text-gray-500">Analyzing your industry...</div>
                            ) : suggestedCompetitors.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {suggestedCompetitors.map((sugg, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addCompetitor(sugg.domain || sugg.name)}
                                            disabled={competitors.includes(sugg.domain || sugg.name)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${competitors.includes(sugg.domain || sugg.name)
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                                                }`}
                                        >
                                            {competitors.includes(sugg.domain || sugg.name) ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                            {sugg.name || sugg.domain}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Enter your details to get AI-powered competitor suggestions
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setStep(3)}
                                variant="outline"
                                className="flex-1 h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={() => isAddProject ? handleFinish() : setStep(5)}
                                disabled={!canProceed()}
                                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)]"
                            >
                                {isAddProject ? <><Sparkles className="w-4 h-4 mr-2" /> Create Project</> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Source & Complete */}
                {step === 5 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Almost there!</h1>
                            <p className="text-gray-500 mt-1">One last question before we set up your dashboard</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border border-red-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-red-600" />
                                <span className="font-semibold text-gray-900">14 days free trial</span>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Track AI visibility across Perplexity, Gemini & Google AI
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Monitor up to 5 competitors
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Website health audits (SEO, AEO, GEO)
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    AI-powered content recommendations
                                </li>
                            </ul>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-3 block">
                                How did you hear about Searchlyst?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {sourceOptions.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setSource(opt)}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${source === opt
                                            ? 'bg-red-50 border-red-500 text-red-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setStep(4)}
                                variant="outline"
                                className="flex-1 h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                onClick={handleFinish}
                                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-[var(--text-primary)]"
                            >
                                <Sparkles className="w-4 h-4 mr-2" /> Complete Setup
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 6: Generating Report */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in text-center py-12">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Setting up your dashboard</h1>
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
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 text-sm transition-all duration-300 ${i <= generationStep ? 'text-gray-900' : 'text-gray-300'
                                        }`}
                                >
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

                        {/* AI Platform Logos */}
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
            <div className="hidden lg:flex flex-1 bg-gray-50 items-center justify-center p-12 relative overflow-hidden">
                {/* Dot pattern background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }} />
                </div>

                <div className="relative max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
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

                    {/* Testimonial dots */}
                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setTestimonialIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === testimonialIndex ? 'bg-red-500 w-6' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
