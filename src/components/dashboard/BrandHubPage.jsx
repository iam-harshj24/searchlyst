import React, { useState, useEffect, useRef } from 'react';
import { 
    UserCircle, Linkedin, Instagram, BookOpen, X,
    Plus, CheckCircle, Sparkles, PenTool, Save, Loader2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import EmptyProjectState from '@/components/dashboard/EmptyProjectState';

const socialPlatforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/yourprofile', color: 'text-white/60' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@yourhandle', color: 'text-white/60' },
    { id: 'substack', name: 'Substack', icon: BookOpen, placeholder: 'yourname.substack.com', color: 'text-white/60' },
    { id: 'twitter', name: 'Twitter / X', icon: X, placeholder: '@yourhandle or x.com/yourhandle', color: 'text-white/60' },
];

const PLATFORM_DISPLAY_NAMES = { linkedin: 'LinkedIn', instagram: 'Instagram', substack: 'Substack', twitter: 'Twitter' };

export default function BrandHubPage({ activeProject, onAddProject }) {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState({
        role_type: 'founder',
        industry: '',
        target_audience: '',
        location: '',
        website_url: '',
        social_linkedin: '',
        social_instagram: '',
        social_substack: '',
        social_twitter: '',
    });
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisSteps, setAnalysisSteps] = useState([]);
    const [writingStyle, setWritingStyle] = useState(null);
    const [loading, setLoading] = useState(true);
    const stepIntervalRef = useRef(null);

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (activeProject?.id) {
            loadBrandProfile(activeProject.id);
        } else {
            setLoading(false);
            setWritingStyle(null);
        }
    }, [activeProject?.id]);

    const loadUser = async () => {
        const userData = await apiClient.auth.me();
        setUser(userData);
    };

    const loadBrandProfile = async (projectId) => {
        setLoading(true);
        try {
            const profile = await apiClient.brandProfile.get(projectId);
            if (profile) {
                setProfileData(prev => ({
                    ...prev,
                    role_type: profile.role_type || 'founder',
                    industry: profile.industry || '',
                    target_audience: profile.target_audience || '',
                    location: profile.location || '',
                    website_url: profile.website_url || '',
                    social_linkedin: profile.social_linkedin || '',
                    social_instagram: profile.social_instagram || '',
                    social_substack: profile.social_substack || '',
                    social_twitter: profile.social_twitter || '',
                }));
                setWritingStyle(profile.writing_style_signature || null);
            }
            // Load social connections for display
            const connections = await apiClient.social.listConnections();
            const connMap = {};
            connections.forEach(c => { connMap[c.platform] = c.handle_or_url; });
            setProfileData(prev => ({
                ...prev,
                social_linkedin: prev.social_linkedin || connMap.linkedin || '',
                social_instagram: prev.social_instagram || connMap.instagram || '',
                social_substack: prev.social_substack || connMap.substack || '',
                social_twitter: prev.social_twitter || connMap.twitter || '',
            }));
        } catch (err) {
            console.error('Load brand profile:', err);
            toast.error('Failed to load brand profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!activeProject?.id) {
            toast.error('Please select or create a project first');
            return;
        }
        setSaving(true);
        try {
            await apiClient.brandProfile.update(activeProject.id, {
                ...profileData,
                social_linkedin: profileData.social_linkedin,
                social_instagram: profileData.social_instagram,
                social_substack: profileData.social_substack,
                social_twitter: profileData.social_twitter,
            });
            toast.success('Profile saved');
        } catch (err) {
            toast.error(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const buildAnalysisSteps = () => {
        const steps = [];
        const connected = socialPlatforms.filter(p => profileData[`social_${p.id}`]?.trim());
        connected.forEach(({ id }) => {
            const name = PLATFORM_DISPLAY_NAMES[id] || id;
            steps.push({ text: `Fetching ${name} posts...`, done: false });
            steps.push({ text: `10 fetched from ${name}`, done: false });
        });
        steps.push({ text: 'Analysing writing patterns...', done: false });
        steps.push({ text: 'Summarising style', done: false });
        return steps;
    };

    const handleAnalyze = async () => {
        if (!activeProject?.id) {
            toast.error('Please select a project first');
            return;
        }
        const hasSocial = profileData.social_linkedin || profileData.social_instagram || 
            profileData.social_substack || profileData.social_twitter;
        if (!hasSocial) {
            toast.error('Add at least one social account URL and save first');
            return;
        }
        setAnalyzing(true);
        const steps = buildAnalysisSteps();
        setAnalysisSteps(steps.map(s => ({ ...s })));

        const advanceStep = () => {
            setAnalysisSteps(prev => {
                const idx = prev.findIndex(s => !s.done);
                if (idx === -1) return prev;
                if (prev[idx].text === 'Analysing writing patterns...') {
                    if (stepIntervalRef.current) {
                        clearInterval(stepIntervalRef.current);
                        stepIntervalRef.current = null;
                    }
                    return prev;
                }
                const next = [...prev];
                next[idx] = { ...next[idx], done: true };
                return next;
            });
        };

        stepIntervalRef.current = setInterval(advanceStep, 2200);

        try {
            await handleSave();
            const result = await apiClient.social.analyzeWritingStyle(activeProject.id);
            clearInterval(stepIntervalRef.current);
            stepIntervalRef.current = null;
            setAnalysisSteps(prev => prev.map(s => ({ ...s, done: true })));
            setWritingStyle(result.writing_style_signature);
            toast.success('Writing style analysis complete');
        } catch (err) {
            clearInterval(stepIntervalRef.current);
            toast.error(err.message || 'Failed to analyze writing style');
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
        };
    }, []);

    const styleTraits = writingStyle?.traits || [
        writingStyle?.tone && { label: 'Tone', value: writingStyle.tone, confidence: 85 },
        writingStyle?.vocabulary && { label: 'Vocabulary', value: writingStyle.vocabulary, confidence: 80 },
        writingStyle?.sentence_style && { label: 'Sentence Style', value: writingStyle.sentence_style, confidence: 78 },
        writingStyle?.personality && { label: 'Personality', value: writingStyle.personality, confidence: 75 },
    ].filter(Boolean);

    if (!activeProject) {
        return <EmptyProjectState onAddProject={onAddProject} />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white">Brand Hub</h1>
                <p className="text-white/40 text-sm mt-1">Define your brand identity so we can create content that sounds exactly like you.</p>
            </div>

            {/* Profile Card */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-medium">{user?.full_name || 'Your Name'}</h2>
                        <p className="text-white/30 text-sm">{user?.email || ''}</p>
                    </div>
                </div>

                {/* Role Selection */}
                <div className="mb-6">
                    <label className="text-white/50 text-xs font-medium mb-2 block">I am a...</label>
                    <div className="flex gap-2">
                        {['founder', 'creator', 'influencer', 'brand'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setProfileData(prev => ({ ...prev, role_type: role }))}
                                className={`px-4 py-2 rounded-xl text-sm capitalize transition-all ${
                                    profileData.role_type === role
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:border-white/10'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-white/50 text-xs font-medium mb-1.5 block">Industry</label>
                        <Input 
                            value={profileData.industry}
                            onChange={(e) => setProfileData(prev => ({ ...prev, industry: e.target.value }))}
                            placeholder="e.g. SaaS, HealthTech, FinTech"
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-white/50 text-xs font-medium mb-1.5 block">Target Audience</label>
                        <Input 
                            value={profileData.target_audience}
                            onChange={(e) => setProfileData(prev => ({ ...prev, target_audience: e.target.value }))}
                            placeholder="e.g. Startup founders, CTOs, Marketers"
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-white/50 text-xs font-medium mb-1.5 block">Location</label>
                        <Input 
                            value={profileData.location}
                            onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. San Francisco, London, Mumbai"
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-white/50 text-xs font-medium mb-1.5 block">Website URL</label>
                        <Input 
                            value={profileData.website_url}
                            onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                            placeholder="https://yourwebsite.com"
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl"
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="mt-5 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                </Button>
            </div>

            {/* Social Accounts */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-white font-medium text-sm">Connected Accounts</h3>
                        <p className="text-white/30 text-xs mt-0.5">Add public URLs — we scrape top 10 posts and analyze your writing style</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {socialPlatforms.map((platform) => (
                        <div key={platform.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                            <div className="w-10 h-10 bg-white/[0.03] rounded-lg flex items-center justify-center">
                                <platform.icon className={`w-5 h-5 ${platform.color}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-xs font-medium">{platform.name}</p>
                                <Input
                                    value={profileData[`social_${platform.id}`] || ''}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, [`social_${platform.id}`]: e.target.value }))}
                                    placeholder={platform.placeholder}
                                    className="bg-transparent border-0 text-white/60 placeholder:text-white/15 text-xs h-7 p-0 focus-visible:ring-0 shadow-none"
                                />
                            </div>
                            {profileData[`social_${platform.id}`] ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                                <Plus className="w-4 h-4 text-white/20" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Writing Style Analysis */}
            <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-white font-medium text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-red-400" />
                            Your Writing Style Signature
                        </h3>
                        <p className="text-white/30 text-xs mt-0.5">
                            AI-analyzed from your connected accounts
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs"
                    >
                        {analyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        {analyzing ? 'Analyzing...' : 'Analyze'}
                    </Button>
                </div>

                {analyzing && analysisSteps.length > 0 ? (
                    <div className="space-y-3 py-4">
                        {analysisSteps.map((step, i) => {
                            const isCurrent = !step.done && analysisSteps.slice(0, i).every(s => s.done);
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                    {step.done ? (
                                        <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-4 h-4 text-red-400 animate-spin flex-shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                                    )}
                                    <span className={step.done ? 'text-white/70 text-sm' : 'text-white text-sm'}>{step.text}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : styleTraits?.length > 0 ? (
                    <div className="space-y-3">
                        {styleTraits.map((trait, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                <div>
                                    <p className="text-white/40 text-[10px] uppercase tracking-wider">{trait.label}</p>
                                    <p className="text-white text-sm mt-0.5">{trait.value}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-400 text-xs font-medium">{trait.confidence ?? 0}%</p>
                                    <p className="text-white/20 text-[10px]">confidence</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !analyzing ? (
                    <div className="text-center py-8">
                        <PenTool className="w-8 h-8 text-white/10 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">Add social account URLs above, save, then click Analyze</p>
                        <p className="text-white/20 text-xs mt-1">We scrape your top 10 posts and use AI to identify your writing style</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
