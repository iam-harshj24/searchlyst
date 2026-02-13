import React, { useState } from 'react';
import { 
    Rocket, Palette, Megaphone, ArrowRight, Sparkles, Globe,
    Users, MapPin, Loader2, Building2, Briefcase, Target,
    DollarSign, Lightbulb, Hash, PenTool, Instagram, Linkedin,
    FileText, Heart, BarChart3, Zap, CheckCircle2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const roles = [
    { 
        id: 'founder', label: 'Founder', icon: Rocket, 
        desc: 'Build authority, attract investors & customers through AI-optimized thought leadership',
    },
    { 
        id: 'creator', label: 'Creator', icon: Palette, 
        desc: 'Scale your content across platforms with your unique style — newsletters, blogs, carousels',
    },
    { 
        id: 'influencer', label: 'Influencer', icon: Megaphone, 
        desc: 'Grow your reach, get cited by AI engines, and land brand deals with data-backed presence',
    },
];

const founderGoals = [
    { id: 'thought_leadership', label: 'Thought Leadership', icon: Lightbulb, desc: 'Position as industry expert' },
    { id: 'investor_visibility', label: 'Investor Visibility', icon: DollarSign, desc: 'Get noticed by VCs & angels' },
    { id: 'customer_acquisition', label: 'Customer Acquisition', icon: Target, desc: 'Attract leads through content' },
    { id: 'hiring', label: 'Talent Attraction', icon: Users, desc: 'Build employer brand' },
];

const creatorGoals = [
    { id: 'grow_audience', label: 'Grow My Audience', icon: Users, desc: 'Reach more people organically' },
    { id: 'monetize', label: 'Monetize Content', icon: DollarSign, desc: 'Sponsorships & paid content' },
    { id: 'multi_platform', label: 'Multi-Platform', icon: Globe, desc: 'Repurpose across channels' },
    { id: 'ai_visibility', label: 'AI Visibility', icon: Zap, desc: 'Get cited by AI engines' },
];

const influencerGoals = [
    { id: 'brand_deals', label: 'Land Brand Deals', icon: Briefcase, desc: 'Data-backed pitches' },
    { id: 'grow_followers', label: 'Grow Followers', icon: Heart, desc: 'Scale across platforms' },
    { id: 'personal_brand', label: 'Personal Brand', icon: Sparkles, desc: 'Consistent identity' },
    { id: 'ai_presence', label: 'AI Search Presence', icon: BarChart3, desc: 'Be recommended by AI' },
];

const platformOptions = {
    founder: [
        { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
        { id: 'blog', label: 'Blog / Website', icon: FileText },
        { id: 'newsletter', label: 'Newsletter', icon: PenTool },
        { id: 'twitter', label: 'X (Twitter)', icon: Hash },
    ],
    creator: [
        { id: 'newsletter', label: 'Newsletter', icon: PenTool },
        { id: 'blog', label: 'Blog', icon: FileText },
        { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
        { id: 'instagram', label: 'Instagram', icon: Instagram },
        { id: 'twitter', label: 'X (Twitter)', icon: Hash },
    ],
    influencer: [
        { id: 'instagram', label: 'Instagram', icon: Instagram },
        { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
        { id: 'twitter', label: 'X (Twitter)', icon: Hash },
        { id: 'blog', label: 'Blog', icon: FileText },
    ],
};

export default function OnboardingFlow({ onComplete }) {
    const [step, setStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState('');
    const [industry, setIndustry] = useState('');
    const [audience, setAudience] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [fundingStage, setFundingStage] = useState('');
    const [contentStyle, setContentStyle] = useState('');
    const [followerRange, setFollowerRange] = useState('');

    const totalSteps = 4;
    const roleData = roles.find(r => r.id === selectedRole);

    const toggleGoal = (id) => {
        setSelectedGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };
    const togglePlatform = (id) => {
        setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const getGoals = () => {
        if (selectedRole === 'founder') return founderGoals;
        if (selectedRole === 'creator') return creatorGoals;
        return influencerGoals;
    };

    const handleFinish = async () => {
        setSaving(true);
        await base44.auth.updateMe({
            role_type: selectedRole,
            industry,
            target_audience: audience,
            location,
            website_url: website,
            onboarded: true,
        });
        setSaving(false);
        onComplete(selectedRole);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[120px]" />
            
            <div className="relative w-full max-w-xl">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                        <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-white/[0.06]">
                            <div className={`h-full rounded-full transition-all duration-500 ${
                                s <= step ? 'bg-red-500 w-full' : 'w-0'
                            }`} />
                        </div>
                    ))}
                </div>

                {/* Step 1: Role Selection */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-semibold text-white">Welcome to ContentAI</h1>
                            <p className="text-white/40 text-sm mt-2">Tell us who you are so we can personalize everything for you</p>
                        </div>

                        <div className="space-y-3">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        onClick={() => { setSelectedRole(role.id); setSelectedGoals([]); setSelectedPlatforms([]); }}
                                        className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 ${
                                            isSelected ? 'bg-red-500/10 border-red-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-600 shadow-lg shadow-red-500/20">
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{role.label}</p>
                                                <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{role.desc}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'border-red-500/50 bg-white' : 'border-white/10'
                                            }`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            disabled={!selectedRole}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium mt-4"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Role-specific details */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-6">
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                {roleData && <roleData.icon className="w-5 h-5 text-white" />}
                            </div>
                            <h2 className="text-xl font-semibold text-white">
                                {selectedRole === 'founder' ? 'Tell us about your startup' :
                                 selectedRole === 'creator' ? 'Tell us about your content' :
                                 'Tell us about your brand'}
                            </h2>
                            <p className="text-white/40 text-sm mt-1">
                                {selectedRole === 'founder' ? 'We\'ll tailor topics to your industry & funding stage' :
                                 selectedRole === 'creator' ? 'We\'ll match your style and find the right audience' :
                                 'We\'ll help you grow your presence and land deals'}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {selectedRole === 'founder' && (
                                <div>
                                    <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5" /> Company name
                                    </label>
                                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. Acme AI, HealthStack"
                                        className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11" />
                                </div>
                            )}

                            <div>
                                <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5" />
                                    {selectedRole === 'founder' ? 'Industry' : selectedRole === 'creator' ? 'Niche' : 'Space / Category'}
                                </label>
                                <Input value={industry} onChange={(e) => setIndustry(e.target.value)}
                                    placeholder={selectedRole === 'founder' ? 'e.g. SaaS, HealthTech, FinTech' :
                                                 selectedRole === 'creator' ? 'e.g. Design, Marketing, AI, Productivity' :
                                                 'e.g. Fashion, Fitness, Travel, Luxury'}
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11" />
                            </div>

                            <div>
                                <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Target audience
                                </label>
                                <Input value={audience} onChange={(e) => setAudience(e.target.value)}
                                    placeholder={selectedRole === 'founder' ? 'e.g. CTOs, VCs, Startup founders' :
                                                 selectedRole === 'creator' ? 'e.g. Designers, Marketers, Developers' :
                                                 'e.g. Gen Z, Fitness enthusiasts, Luxury buyers'}
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11" />
                            </div>

                            {selectedRole === 'founder' && (
                                <div>
                                    <label className="text-white/50 text-xs font-medium mb-2 block flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5" /> Funding stage
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Pre-Seed', 'Seed', 'Series A', 'Series B+', 'Bootstrapped', 'Revenue'].map(stage => (
                                            <button key={stage} onClick={() => setFundingStage(stage)}
                                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                                    fundingStage === stage
                                                        ? 'bg-red-500/10 border-red-500/40 text-white'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60'
                                                }`}>
                                                {stage}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedRole === 'creator' && (
                                <div>
                                    <label className="text-white/50 text-xs font-medium mb-2 block flex items-center gap-2">
                                        <PenTool className="w-3.5 h-3.5" /> Your content style
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Educational', 'Storytelling', 'Data-Driven', 'Opinionated', 'How-To Guides', 'Visual-First'].map(style => (
                                            <button key={style} onClick={() => setContentStyle(style)}
                                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                                                    contentStyle === style
                                                        ? 'bg-red-500/10 border-red-500/40 text-white'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60'
                                                }`}>
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedRole === 'influencer' && (
                                <div>
                                    <label className="text-white/50 text-xs font-medium mb-2 block flex items-center gap-2">
                                        <Heart className="w-3.5 h-3.5" /> Current follower range
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['< 10K (Nano)', '10K–50K (Micro)', '50K–500K (Mid)', '500K–1M (Macro)', '1M+ (Mega)', 'Just Starting'].map(range => (
                                            <button key={range} onClick={() => setFollowerRange(range)}
                                                className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                                                    followerRange === range
                                                        ? 'bg-red-500/10 border-red-500/40 text-white'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60'
                                                }`}>
                                                {range}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> Primary market
                                </label>
                                <Input value={location} onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. US, Europe, Global"
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11" />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-11 border-white/[0.06] text-white/40 hover:text-white rounded-xl">Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!industry.trim() || !audience.trim()}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Goals + Platforms */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-semibold text-white">
                                {selectedRole === 'founder' ? 'What are your priorities?' :
                                 selectedRole === 'creator' ? 'What do you want to achieve?' :
                                 'What are you focused on?'}
                            </h2>
                            <p className="text-white/40 text-sm mt-1">Select all that apply — we'll customize your dashboard</p>
                        </div>

                        <div>
                            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3 font-semibold">Your Goals</p>
                            <div className="grid grid-cols-2 gap-2">
                                {getGoals().map(goal => {
                                    const Icon = goal.icon;
                                    const isActive = selectedGoals.includes(goal.id);
                                    return (
                                        <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                isActive ? 'bg-red-500/10 border-red-500/40' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                                            }`}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-white/30'}`} />
                                                {isActive && <CheckCircle2 className="w-3 h-3 ml-auto text-red-400" />}
                                            </div>
                                            <p className="text-white text-sm font-medium">{goal.label}</p>
                                            <p className="text-white/30 text-[11px] mt-0.5">{goal.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3 font-semibold">Platforms You Focus On</p>
                            <div className="flex flex-wrap gap-2">
                                {(platformOptions[selectedRole] || []).map(platform => {
                                    const Icon = platform.icon;
                                    const isActive = selectedPlatforms.includes(platform.id);
                                    return (
                                        <button key={platform.id} onClick={() => togglePlatform(platform.id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                                                isActive ? 'bg-red-500/10 border-red-500/40 text-white' : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60'
                                            }`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            {platform.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-11 border-white/[0.06] text-white/40 hover:text-white rounded-xl">Back</Button>
                            <Button onClick={() => setStep(4)} disabled={selectedGoals.length === 0}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Website + Summary */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-white">
                                {selectedRole === 'founder' ? 'Add your startup website' :
                                 selectedRole === 'creator' ? 'Add your website or portfolio' :
                                 'Add your website or link tree'}
                                <span className="text-white/30 text-sm ml-2">(optional)</span>
                            </h2>
                            <p className="text-white/40 text-sm mt-1">We'll run a free SEO, AEO & GEO audit automatically</p>
                        </div>

                        <div>
                            <label className="text-white/50 text-xs font-medium mb-1.5 block flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" />
                                {selectedRole === 'founder' ? 'Your startup website' : 'Your website'}
                            </label>
                            <Input value={website} onChange={(e) => setWebsite(e.target.value)}
                                placeholder={selectedRole === 'founder' ? 'https://yourstartup.com' :
                                             selectedRole === 'creator' ? 'https://yourportfolio.com' :
                                             'https://linktr.ee/yourname'}
                                className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-11" />
                        </div>

                        <div className="border rounded-2xl p-5 bg-red-500/5 border-red-500/20">
                            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3 font-semibold">Your Profile Summary</p>
                            <div className="space-y-2.5 text-sm">
                                <SummaryRow label="Role" value={roleData?.label} />
                                {selectedRole === 'founder' && companyName && <SummaryRow label="Company" value={companyName} />}
                                <SummaryRow label={selectedRole === 'founder' ? 'Industry' : selectedRole === 'creator' ? 'Niche' : 'Space'} value={industry} />
                                <SummaryRow label="Audience" value={audience} />
                                {selectedRole === 'founder' && fundingStage && <SummaryRow label="Stage" value={fundingStage} />}
                                {selectedRole === 'creator' && contentStyle && <SummaryRow label="Style" value={contentStyle} />}
                                {selectedRole === 'influencer' && followerRange && <SummaryRow label="Followers" value={followerRange} />}
                                {location && <SummaryRow label="Market" value={location} />}
                                {selectedGoals.length > 0 && <SummaryRow label="Goals" value={`${selectedGoals.length} selected`} />}
                                {selectedPlatforms.length > 0 && <SummaryRow label="Platforms" value={selectedPlatforms.join(', ')} />}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setStep(3)} variant="outline" className="flex-1 h-11 border-white/[0.06] text-white/40 hover:text-white rounded-xl">Back</Button>
                            <Button onClick={handleFinish} disabled={saving}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Launch My Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between">
            <span className="text-white/40">{label}</span>
            <span className="text-white capitalize text-right">{value}</span>
        </div>
    );
}