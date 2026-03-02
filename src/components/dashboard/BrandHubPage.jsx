import React, { useState, useEffect } from 'react';
import { 
    UserCircle, Globe, Linkedin, Instagram, BookOpen, MessageCircle,
    Plus, CheckCircle, AlertCircle, Sparkles, PenTool, ChevronRight,
    Save, Loader2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDashboardUser, setDashboardUser } from '@/pages/Dashboard';

const socialPlatforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/yourprofile', color: 'text-[var(--text-secondary)]' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@yourhandle', color: 'text-[var(--text-secondary)]' },
    { id: 'substack', name: 'Substack', icon: BookOpen, placeholder: 'yourname.substack.com', color: 'text-[var(--text-secondary)]' },
    { id: 'reddit', name: 'Reddit', icon: MessageCircle, placeholder: 'u/yourprofile', color: 'text-red-400' },
];

const styleTraits = [
    { label: 'Tone', value: 'Professional & Authoritative', confidence: 92 },
    { label: 'Vocabulary', value: 'Industry-Specific, Moderate Complexity', confidence: 87 },
    { label: 'Sentence Style', value: 'Mix of Short & Medium, Active Voice', confidence: 85 },
    { label: 'Personality', value: 'Thought Leader, Data-Driven', confidence: 78 },
];

export default function BrandHubPage({ user: userProp }) {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState({
        role_type: 'founder',
        industry: '',
        target_audience: '',
        location: '',
        website_url: '',
        companySize: '',
        language: '',
        reach: '',
        social_linkedin: '',
        social_instagram: '',
        social_substack: '',
        social_reddit: '',
    });
    const [saving, setSaving] = useState(false);
    const [styleAnalyzed, setStyleAnalyzed] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = () => {
        const userData = getDashboardUser();
        setUser(userData);
        if (userData) {
            setProfileData(prev => ({
                ...prev,
                industry: userData.industry || '',
                target_audience: userData.target_audience || '',
                location: userData.location || '',
                website_url: userData.website_url || (userData.domain ? `https://${userData.domain}` : ''),
                companySize: userData.companySize || '',
                language: userData.language || '',
                reach: userData.reach || '',
                social_linkedin: userData.social_linkedin || '',
                social_instagram: userData.social_instagram || '',
                social_substack: userData.social_substack || '',
                social_reddit: userData.social_reddit || '',
                role_type: userData.role_type || 'founder',
            }));
            if (userData.social_linkedin || userData.social_instagram) {
                setStyleAnalyzed(true);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const existing = getDashboardUser() || {};
        setDashboardUser({ ...existing, ...profileData });
        setUser({ ...existing, ...profileData });
        setSaving(false);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Brand Hub</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Define your brand identity so we can create content that sounds exactly like you.</p>
            </div>

            {/* Profile Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <span className="text-[var(--text-primary)] text-2xl font-bold">{(user?.brandName || user?.full_name || 'S').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h2 className="text-[var(--text-primary)] font-medium">{user?.brandName || user?.full_name || 'Your Brand'}</h2>
                        <p className="text-[var(--text-muted)] text-sm">{user?.domain ? `https://${user.domain}` : ''}</p>
                    </div>
                </div>

                {/* Role Selection */}
                <div className="mb-6">
                    <label className="text-[var(--text-secondary)] text-xs font-medium mb-2 block">I am a...</label>
                    <div className="flex gap-2">
                        {['founder', 'creator', 'influencer', 'brand'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setProfileData(prev => ({ ...prev, role_type: role }))}
                                className={`px-4 py-2 rounded-xl text-sm capitalize transition-all ${
                                    profileData.role_type === role
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border)]'
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
                        <label className="text-[var(--text-secondary)] text-xs font-medium mb-1.5 block">Industry</label>
                        <Input 
                            value={profileData.industry}
                            onChange={(e) => setProfileData(prev => ({ ...prev, industry: e.target.value }))}
                            placeholder="e.g. SaaS, HealthTech, FinTech"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-[var(--text-secondary)] text-xs font-medium mb-1.5 block">Target Audience</label>
                        <Input 
                            value={profileData.target_audience}
                            onChange={(e) => setProfileData(prev => ({ ...prev, target_audience: e.target.value }))}
                            placeholder="e.g. Startup founders, CTOs, Marketers"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-[var(--text-secondary)] text-xs font-medium mb-1.5 block">Location</label>
                        <Input 
                            value={profileData.location}
                            onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. San Francisco, London, Mumbai"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-[var(--text-secondary)] text-xs font-medium mb-1.5 block">Website URL</label>
                        <Input 
                            value={profileData.website_url}
                            onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                            placeholder="https://yourwebsite.com"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-[var(--text-secondary)] text-xs font-medium mb-1.5 block">Company Size</label>
                        <Input 
                            value={profileData.companySize}
                            onChange={(e) => setProfileData(prev => ({ ...prev, companySize: e.target.value }))}
                            placeholder="e.g. 11-100 employees"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="text-[var(--text-secondary)] text-xs font-medium mb-1.5 block">Market Reach</label>
                        <Input 
                            value={profileData.reach}
                            onChange={(e) => setProfileData(prev => ({ ...prev, reach: e.target.value }))}
                            placeholder="e.g. Worldwide, Nationwide, Regional"
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl"
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="mt-5 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-xl"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                </Button>
            </div>

            {/* Social Accounts */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-[var(--text-primary)] font-medium text-sm">Connected Accounts</h3>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">We analyze your content to learn your writing style</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {socialPlatforms.map((platform) => (
                        <div key={platform.id} className="flex items-center gap-3 p-3 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl">
                            <div className="w-10 h-10 bg-[var(--surface-hover)] rounded-lg flex items-center justify-center">
                                <platform.icon className={`w-5 h-5 ${platform.color}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[var(--text-primary)] text-xs font-medium">{platform.name}</p>
                                <Input
                                    value={profileData[`social_${platform.id}`] || ''}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, [`social_${platform.id}`]: e.target.value }))}
                                    placeholder={platform.placeholder}
                                    className="bg-transparent border-0 text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] text-xs h-7 p-0 focus-visible:ring-0 shadow-none"
                                />
                            </div>
                            {profileData[`social_${platform.id}`] ? (
                                <CheckCircle className="w-4 h-4 text-[var(--text-primary)]" />
                            ) : (
                                <Plus className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Writing Style Analysis */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-[var(--text-primary)] font-medium text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-red-400" />
                            Your Writing Style Signature
                        </h3>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">AI-analyzed from your connected accounts and content</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs">
                        Re-analyze
                    </Button>
                </div>

                {styleAnalyzed ? (
                    <div className="space-y-3">
                        {styleTraits.map((trait, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl">
                                <div>
                                    <p className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider">{trait.label}</p>
                                    <p className="text-[var(--text-primary)] text-sm mt-0.5">{trait.value}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-400 text-xs font-medium">{trait.confidence}%</p>
                                    <p className="text-[var(--text-muted)] text-[10px]">confidence</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <PenTool className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                        <p className="text-[var(--text-secondary)] text-sm">Connect your social accounts and save your profile</p>
                        <p className="text-[var(--text-muted)] text-xs mt-1">We'll analyze your writing style automatically</p>
                    </div>
                )}
            </div>
        </div>
    );
}