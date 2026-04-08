import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    UserCircle, Globe, Linkedin, Instagram, BookOpen, MessageCircle,
    Plus, CheckCircle, AlertCircle, Sparkles, PenTool, ChevronRight,
    Save, Loader2, Box, Building2, MapPin, Users, Target, RefreshCw, BarChart3, Link2,
    Twitter, Youtube, MessageSquareQuote, Music2, X,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient.js';
import { getDashboardUser, setDashboardUser, getBrandHubData, setBrandHubData } from '@/pages/Dashboard';

const socialPlatforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/yourprofile', color: 'text-[#888]' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, placeholder: '@yourbrand or x.com/yourbrand', color: 'text-[#888]' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@yourchannel', color: 'text-[#888]' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, placeholder: '@yourhandle', color: 'text-[#888]' },
    { id: 'quora', name: 'Quora', icon: MessageSquareQuote, placeholder: 'quora.com/profile/yourprofile', color: 'text-[#888]' },
    { id: 'substack', name: 'Substack', icon: BookOpen, placeholder: 'yourname.substack.com', color: 'text-[#888]' },
    { id: 'reddit', name: 'Reddit', icon: MessageCircle, placeholder: 'u/yourprofile', color: 'text-[#888]' },
    { id: 'tiktok', name: 'TikTok', icon: Music2, placeholder: '@yourhandle', color: 'text-[#888]' },
];

const styleTraits = [
    { label: 'Tone', value: 'Professional & Authoritative', confidence: 92 },
    { label: 'Vocabulary', value: 'Industry-Specific, Moderate Complexity', confidence: 87 },
    { label: 'Sentence Style', value: 'Mix of Short & Medium, Active Voice', confidence: 85 },
    { label: 'Personality', value: 'Thought Leader, Data-Driven', confidence: 78 },
];

function parseCommaTags(str) {
    if (str == null || typeof str !== 'string') return [];
    return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function serializeCommaTags(items) {
    return items.join(', ');
}

/**
 * One row of comma-separated values shown as removable capsules; still saves as a single comma-separated string.
 */
function CommaCapsuleField({ value, onChange, placeholder, icon: Icon, id }) {
    const inputRef = useRef(null);
    const [draft, setDraft] = useState('');
    const tags = useMemo(() => parseCommaTags(value), [value]);

    const commit = (next) => {
        onChange(serializeCommaTags(next));
    };

    const pushUnique = (list, raw) => {
        const t = raw.trim();
        if (!t) return list;
        if (list.some((x) => x.toLowerCase() === t.toLowerCase())) return list;
        return [...list, t];
    };

    const addFromDraft = () => {
        if (!draft.trim()) return;
        commit(pushUnique(tags, draft));
        setDraft('');
    };

    const onInputChange = (e) => {
        const v = e.target.value;
        if (v.includes(',')) {
            const parts = v.split(',');
            const completed = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean);
            const rest = parts[parts.length - 1] ?? '';
            let next = [...tags];
            for (const p of completed) {
                next = pushUnique(next, p);
            }
            commit(next);
            setDraft(rest);
            return;
        }
        setDraft(v);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addFromDraft();
        } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
            e.preventDefault();
            commit(tags.slice(0, -1));
        }
    };

    const onBlur = () => {
        if (draft.trim()) addFromDraft();
    };

    const removeAt = (index) => {
        commit(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="relative">
            <Icon className="w-[18px] h-[18px] text-[#666] shrink-0 absolute left-4 top-3.5 pointer-events-none z-[1]" aria-hidden />
            <div
                role="group"
                className="min-h-[48px] w-full bg-[#111] border border-[#222] focus-within:border-[#E92A15]/50 focus-within:bg-[#1A1A1A] rounded-xl py-2 pl-12 pr-3 flex flex-wrap gap-2 items-center transition-all outline-none cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, i) => (
                    <span
                        key={`${tag}-${i}`}
                        className="inline-flex items-center gap-1 max-w-full pl-2.5 pr-1 py-1 rounded-lg text-[13px] font-medium text-[#e5e5e5] bg-[#1a1a1a] border border-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        title={tag}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="truncate max-w-[200px]">{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeAt(i);
                            }}
                            className="p-0.5 rounded-md text-[#737373] hover:text-white hover:bg-[#2a2a2a] shrink-0"
                            aria-label={`Remove ${tag}`}
                        >
                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={draft}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    onBlur={onBlur}
                    placeholder={tags.length === 0 ? placeholder : 'Add another…'}
                    className="flex-1 min-w-[140px] bg-transparent border-none outline-none text-white text-[14px] placeholder:text-[#555] py-1.5"
                    autoComplete="off"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

/** Up to 3 distinct market / region labels for AI visibility scans (stacked-style prompts). */
function TrackingMarketsField({ value, onChange, id }) {
    const inputRef = useRef(null);
    const [draft, setDraft] = useState('');
    const tags = Array.isArray(value) ? value.slice(0, 3) : [];

    const commit = (next) => onChange(next.slice(0, 3));

    const pushUnique = (list, raw) => {
        const t = raw.trim();
        if (!t || list.length >= 3) return list;
        if (list.some((x) => x.toLowerCase() === t.toLowerCase())) return list;
        return [...list, t];
    };

    const addFromDraft = () => {
        if (!draft.trim() || tags.length >= 3) return;
        commit(pushUnique(tags, draft));
        setDraft('');
    };

    const onInputChange = (e) => {
        const v = e.target.value;
        if (v.includes(',')) {
            const parts = v.split(',');
            const completed = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean);
            const rest = parts[parts.length - 1] ?? '';
            let next = [...tags];
            for (const p of completed) {
                if (next.length >= 3) break;
                next = pushUnique(next, p);
            }
            commit(next);
            setDraft(rest);
            return;
        }
        setDraft(v);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addFromDraft();
        } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
            e.preventDefault();
            commit(tags.slice(0, -1));
        }
    };

    const onBlur = () => {
        if (draft.trim() && tags.length < 3) addFromDraft();
    };

    const removeAt = (index) => {
        commit(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="relative">
            <MapPin className="w-[18px] h-[18px] text-[#666] shrink-0 absolute left-4 top-3.5 pointer-events-none z-[1]" aria-hidden />
            <div
                role="group"
                className="min-h-[48px] w-full bg-[#111] border border-[#222] focus-within:border-[#E92A15]/50 focus-within:bg-[#1A1A1A] rounded-xl py-2 pl-12 pr-3 flex flex-wrap gap-2 items-center transition-all outline-none cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {tags.map((tag, i) => (
                    <span
                        key={`${tag}-${i}`}
                        className="inline-flex items-center gap-1 max-w-full pl-2.5 pr-1 py-1 rounded-lg text-[13px] font-medium text-[#e5e5e5] bg-[#1a1a1a] border border-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        title={tag}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="truncate max-w-[220px]">{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeAt(i);
                            }}
                            className="p-0.5 rounded-md text-[#737373] hover:text-white hover:bg-[#2a2a2a] shrink-0"
                            aria-label={`Remove ${tag}`}
                        >
                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={draft}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    onBlur={onBlur}
                    placeholder={tags.length >= 3 ? 'Max 3 markets' : tags.length === 0 ? 'e.g. Texas, US · India · United Kingdom' : 'Add another…'}
                    disabled={tags.length >= 3}
                    className="flex-1 min-w-[160px] bg-transparent border-none outline-none text-white text-[14px] placeholder:text-[#555] py-1.5 disabled:opacity-40"
                    autoComplete="off"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

export default function BrandHubPage({ user: userProp, authUserId }) {
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
        trackingLocations: [],
        social_linkedin: '',
        social_instagram: '',
        social_substack: '',
        social_reddit: '',
        social_twitter: '',
        social_youtube: '',
        social_quora: '',
        social_tiktok: '',
    });
    const [saving, setSaving] = useState(false);
    const [styleAnalyzed, setStyleAnalyzed] = useState(false);
    const [socialSnapshot, setSocialSnapshot] = useState(null);
    const [ingestLoading, setIngestLoading] = useState(false);
    const [ingestError, setIngestError] = useState(null);

    useEffect(() => {
        loadUser();
    }, [authUserId, userProp?.projectId, userProp?.domain, userProp?.brandName, userProp?.socialIngestSnapshot]);

    const loadUser = () => {
        const projectId = userProp?.projectId;
        const stored = projectId != null
            ? getBrandHubData(authUserId, projectId)
            : getDashboardUser(authUserId);
        const merged = { ...userProp, ...stored };
        setUser(merged);
        setProfileData(prev => ({
            ...prev,
            industry: merged?.industry || prev.industry || '',
            target_audience: merged?.target_audience || prev.target_audience || '',
            location: merged?.location || prev.location || '',
            website_url: merged?.website_url || merged?.domain || prev.website_url || '',
            companySize: merged?.companySize || prev.companySize || '',
            language: merged?.language || prev.language || '',
            reach: merged?.reach || prev.reach || '',
            trackingLocations: Array.isArray(merged?.trackingLocations)
                ? merged.trackingLocations.slice(0, 3)
                : prev.trackingLocations || [],
            social_linkedin: merged?.social_linkedin || prev.social_linkedin || '',
            social_instagram: merged?.social_instagram || prev.social_instagram || '',
            social_substack: merged?.social_substack || prev.social_substack || '',
            social_reddit: merged?.social_reddit || prev.social_reddit || '',
            social_twitter: merged?.social_twitter || prev.social_twitter || '',
            social_youtube: merged?.social_youtube || prev.social_youtube || '',
            social_quora: merged?.social_quora || prev.social_quora || '',
            social_tiktok: merged?.social_tiktok || prev.social_tiktok || '',
            role_type: merged?.role_type || prev.role_type || 'founder',
        }));
        const anySocial =
            merged?.social_linkedin ||
            merged?.social_instagram ||
            merged?.social_substack ||
            merged?.social_reddit ||
            merged?.social_twitter ||
            merged?.social_youtube ||
            merged?.social_quora ||
            merged?.social_tiktok;
        if (anySocial) setStyleAnalyzed(true);
        if (merged?.socialIngestSnapshot) {
            setSocialSnapshot(merged.socialIngestSnapshot);
        } else {
            setSocialSnapshot(null);
        }
    };

    const handleSyncSocial = useCallback(async () => {
        const projectId = userProp?.projectId;
        if (projectId == null) return;
        setIngestError(null);
        setIngestLoading(true);
        try {
            const res = await apiClient.projects.ingestSocial(projectId);
            if (res?.snapshot) setSocialSnapshot(res.snapshot);
        } catch (e) {
            setIngestError(e?.message || 'Social sync failed');
        } finally {
            setIngestLoading(false);
        }
    }, [userProp?.projectId]);

    const handleSave = async () => {
        setSaving(true);
        const projectId = userProp?.projectId;
        const existing = projectId != null
            ? getBrandHubData(authUserId, projectId) || {}
            : getDashboardUser(authUserId) || {};
        const toSave = { ...existing, ...profileData };
        
        try {
            if (projectId != null) {
                // Update via true remote backend now available
                await apiClient.projects.update(projectId, toSave);
                setBrandHubData(authUserId, projectId, toSave); // mirror local map
            } else {
                setDashboardUser(authUserId, toSave);
            }
            setUser({ ...userProp, ...toSave });
        } catch (error) {
            console.error('Failed to sync Brand Hub profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const getDomainColor = (domain) => {
        const colors = [
            'text-blue-400 bg-blue-400/10 border-blue-400/20',
            'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            'text-purple-400 bg-purple-400/10 border-purple-400/20',
            'text-amber-400 bg-amber-400/10 border-amber-400/20',
            'text-pink-400 bg-pink-400/10 border-pink-400/20',
            'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
            'text-[#E92A15] bg-[#E92A15]/10 border-[#E92A15]/20'
        ];
        let hash = 0;
        const safeDomain = domain || '';
        for (let i = 0; i < safeDomain.length; i++) hash = safeDomain.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const BrandLogo = ({ domain }) => {
        const [error, setError] = useState(false);
        if (error || !domain) {
            return (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border shrink-0 ${getDomainColor(domain)}`}>
                    <span className="text-[24px] font-extrabold top-[0.5px] relative">
                        {(domain || 'S').replace(/^(https?:\/\/)?(www\.)?/, '').charAt(0).toUpperCase()}
                    </span>
                </div>
            );
        }
        return (
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border border-[#333] shrink-0 overflow-hidden shadow-[0_4px_20px_rgba(255,255,255,0.08)]">
                <img 
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                    alt="" 
                    className="w-[28px] h-[28px] object-contain border-none outline-none"
                    onError={() => setError(true)} 
                />
            </div>
        );
    };

    const displayBrandName = user?.brandName || user?.name || user?.full_name || 'Camana Homes';

    return (
        <div className="w-full pb-10">
            {/* Full-width Header */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Box className="w-[20px] h-[20px] text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Brand Hub</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Define your brand identity so we can create content that sounds exactly like you.</p>
                    </div>
                </div>
                <button
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E92A15] hover:bg-[#D12512] text-white text-[13px] font-medium rounded-full transition-all shadow-[0_0_20px_rgba(233,42,21,0.35)]"
                >
                    <RefreshCw className="w-4 h-4" /> Re-scan
                </button>
            </div>

            <div className="space-y-6 max-w-5xl mt-8">
                {/* Profile Card */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-7">
                    
                    {/* Top Identity Row */}
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#222]">
                        <div className="flex items-center gap-4">
                            <BrandLogo domain={user?.domain || 'camanahomes.com'} />
                            <div>
                                <h2 className="text-white text-[18px] font-semibold tracking-tight">{displayBrandName}</h2>
                                <a href={`https://${user?.domain || 'camanahomes.com'}`} target="_blank" rel="noopener noreferrer" className="text-[#666] hover:text-[#aaa] text-[13px] flex items-center gap-1.5 transition-colors mt-0.5">
                                    <Link2 className="w-3.5 h-3.5" /> https://{user?.domain || 'camanahomes.com'}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="mb-8">
                        <label className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] mb-4 block">I am a...</label>
                        <div className="flex flex-wrap gap-2.5">
                            {['founder', 'creator', 'influencer', 'brand'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setProfileData(prev => ({ ...prev, role_type: role }))}
                                    className={`px-6 py-2 rounded-full text-[13px] font-medium capitalize transition-all ${
                                        profileData.role_type === role
                                            ? 'bg-[#E92A15] text-white border border-[#E92A15] shadow-[0_0_15px_rgba(233,42,21,0.3)]'
                                            : 'bg-transparent text-[#aaa] border border-[#333] hover:bg-[#1A1A1A] hover:text-white'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Profile Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="brandhub-industry" className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">Industry</label>
                            <CommaCapsuleField
                                id="brandhub-industry"
                                icon={Building2}
                                placeholder="e.g. SaaS, Real Estate"
                                value={profileData.industry}
                                onChange={(next) => setProfileData((prev) => ({ ...prev, industry: next }))}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="brandhub-audience" className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">Target Audience</label>
                            <CommaCapsuleField
                                id="brandhub-audience"
                                icon={Target}
                                placeholder="e.g. Startup founders, CTOs, SMB owners"
                                value={profileData.target_audience}
                                onChange={(next) => setProfileData((prev) => ({ ...prev, target_audience: next }))}
                            />
                        </div>

                        <p className="md:col-span-2 text-[10px] text-[#555] -mt-1 mb-0 ml-1 leading-relaxed">
                            Type and use commas or Enter — each value becomes its own capsule. Case-insensitive duplicates are skipped.
                        </p>

                        <div className="flex flex-col gap-2">
                            <label className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">Primary location</label>
                            <div className="relative">
                                <MapPin className="w-[18px] h-[18px] text-[#666] flex-shrink-0 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={profileData.location}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Dubai"
                                    className="w-full bg-[#111] border border-[#222] focus:border-[#E92A15]/50 focus:bg-[#1A1A1A] outline-none text-white text-[14px] placeholder:text-[#555] rounded-xl py-3 pl-12 pr-4 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">Website URL</label>
                            <div className="relative">
                                <Globe className="w-[18px] h-[18px] text-[#666] flex-shrink-0 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={profileData.website_url}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                                    placeholder="https://camanahomes.com"
                                    className="w-full bg-[#111] border border-[#222] focus:border-[#E92A15]/50 focus:bg-[#1A1A1A] outline-none text-white text-[14px] placeholder:text-[#555] rounded-xl py-3 pl-12 pr-4 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label htmlFor="brandhub-tracking-markets" className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">
                                Visibility markets (max 3)
                            </label>
                            <TrackingMarketsField
                                id="brandhub-tracking-markets"
                                value={profileData.trackingLocations}
                                onChange={(next) =>
                                    setProfileData((prev) => ({ ...prev, trackingLocations: next }))
                                }
                            />
                            <p className="text-[10px] text-[#555] ml-1 leading-relaxed">
                                Each scan weaves these regions into prompts so models compare your brand vs competitors by market (share of voice, rank, sentiment). Leave empty to use primary location only.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">Company Size</label>
                            <div className="relative">
                                <Users className="w-[18px] h-[18px] text-[#666] flex-shrink-0 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={profileData.companySize}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, companySize: e.target.value }))}
                                    placeholder="11-100"
                                    className="w-full bg-[#111] border border-[#222] focus:border-[#E92A15]/50 focus:bg-[#1A1A1A] outline-none text-white text-[14px] placeholder:text-[#555] rounded-xl py-3 pl-12 pr-4 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[#666] text-[10px] font-bold uppercase tracking-[0.15em] ml-1">Market Reach</label>
                            <div className="relative">
                                <BarChart3 className="w-[18px] h-[18px] text-[#666] flex-shrink-0 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input 
                                    value={profileData.reach}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, reach: e.target.value }))}
                                    placeholder="worldwide"
                                    className="w-full bg-[#111] border border-[#222] focus:border-[#E92A15]/50 focus:bg-[#1A1A1A] outline-none text-white text-[14px] placeholder:text-[#555] rounded-xl py-3 pl-12 pr-4 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-8 border-t border-[#222]">
                        <p className="text-[#666] text-[13px]">Your brand identity powers all AI-generated content</p>
                        <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-[#E92A15] hover:bg-[#D12512] text-white px-6 py-2.5 rounded-full text-[13px] font-medium flex items-center transition-all shadow-[0_0_20px_rgba(233,42,21,0.25)]"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Profile
                        </button>
                    </div>
                </div>

                {/* Social Accounts */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-7">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <h3 className="text-white font-semibold text-[18px]">Connected Accounts</h3>
                            <p className="text-[#666] text-[13px] mt-1">Save your links, then sync — we pull public posts where APIs allow (YouTube, Substack, Reddit).</p>
                        </div>
                        {userProp?.projectId != null && (
                            <button
                                type="button"
                                onClick={handleSyncSocial}
                                disabled={ingestLoading}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium bg-[#1A1A1A] border border-[#333] text-white hover:border-[#E92A15]/50 hover:bg-[#222] disabled:opacity-50 transition-all"
                            >
                                {ingestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Sync social data
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {socialPlatforms.map((platform) => (
                            <div key={platform.id} className="flex items-center gap-4 p-4 bg-[#111] border border-[#222] rounded-2xl group transition-all hover:bg-[#1A1A1A] hover:border-[#333]">
                                <div className="w-12 h-12 bg-[#1A1A1A] border border-[#333] rounded-[14px] flex items-center justify-center shrink-0 transition-colors group-hover:border-[#555]">
                                    <platform.icon className={`w-[22px] h-[22px] ${platform.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-[14px] font-medium">{platform.name}</p>
                                    <input
                                        value={profileData[`social_${platform.id}`] || ''}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, [`social_${platform.id}`]: e.target.value }))}
                                        placeholder={platform.placeholder}
                                        className="bg-transparent border-0 text-[#888] placeholder:text-[#444] text-[12px] h-6 p-0 w-full focus:outline-none focus:ring-0 mt-0.5"
                                    />
                                </div>
                                <button className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center shrink-0 hover:border-[#E92A15] hover:text-[#E92A15] text-[#888] transition-all">
                                    {profileData[`social_${platform.id}`] ? (
                                        <CheckCircle className="w-4 h-4 text-[#00D26A]" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {ingestError && (
                        <p className="text-red-400 text-[12px] mt-3">{ingestError}</p>
                    )}

                    {socialSnapshot?.fetchedAt && (
                        <div className="mt-6 border border-[#2a2a2a] rounded-2xl bg-[#111] p-4 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-white text-[13px] font-semibold">Live pull results</p>
                                <span className="text-[#666] text-[10px]">
                                    Last sync: {new Date(socialSnapshot.fetchedAt).toLocaleString()}
                                </span>
                            </div>
                            {Object.entries(socialSnapshot.platforms || {}).map(([key, block]) => (
                                <div key={key} className="border-t border-[#222] pt-3 first:border-t-0 first:pt-0">
                                    <p className="text-[#E92A15] text-[11px] font-bold uppercase tracking-wider mb-2">{key}</p>
                                    {block?.channelTitle && (
                                        <p className="text-[#aaa] text-[12px] mb-1">Channel: {block.channelTitle}</p>
                                    )}
                                    {block?.feedUrl && (
                                        <p className="text-[#666] text-[11px] mb-1 truncate" title={block.feedUrl}>{block.feedUrl}</p>
                                    )}
                                    {block?.needsOAuth && (
                                        <p className="text-[#eab308] text-[12px] leading-snug">{block.message}</p>
                                    )}
                                    {block?.needsConfig && (
                                        <p className="text-amber-400/90 text-[12px] leading-snug">{block.message}</p>
                                    )}
                                    {block?.message && !block?.needsOAuth && !block?.needsConfig && block?.ok === false && (
                                        <p className="text-[#888] text-[12px]">{block.message}</p>
                                    )}
                                    {Array.isArray(block?.items) && block.items.length > 0 && (
                                        <ul className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                            {block.items.map((it, idx) => (
                                                <li key={idx} className="text-[12px] text-[#ccc] leading-snug">
                                                    {it.url ? (
                                                        <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                            {it.title || it.url}
                                                        </a>
                                                    ) : (
                                                        <span>{it.title}</span>
                                                    )}
                                                    {it.pubDate && <span className="text-[#555] text-[10px] ml-1">({it.pubDate})</span>}
                                                    {it.subreddit && <span className="text-[#555] text-[10px] ml-1">r/{it.subreddit}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-4 mt-6 border border-[#E92A15]/20 bg-[#E92A15]/5 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-[#E92A15] shrink-0 mt-0.5" />
                        <span className="text-[#aaa] text-[13px] leading-relaxed">
                            Save your profile after editing links, then use <strong className="text-[#ccc] font-semibold">Sync social data</strong>. YouTube needs <code className="text-[#888] text-[11px]">YOUTUBE_API_KEY</code> on the server. LinkedIn, X, Instagram, TikTok, and Quora need OAuth or partner APIs for real post data — we show clear status for those.
                        </span>
                    </div>
                </div>

                {/* Writing Style Analysis */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-7 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-white font-semibold text-[18px]">Your Writing Style Signature</h3>
                            <p className="text-[#666] text-[13px] mt-1">Placeholders until we run LLM on synced posts; use Sync above for real titles and links.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSyncSocial}
                            disabled={ingestLoading || userProp?.projectId == null}
                            className="px-6 py-2 border border-[#333] text-[#ccc] hover:border-[#E92A15]/40 flex items-center gap-2 rounded-full text-[13px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {ingestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Sync for style context
                        </button>
                    </div>

                    {styleAnalyzed &&
                    socialPlatforms.some((p) => String(profileData[`social_${p.id}`] || '').trim()) ? (
                        <div className="grid grid-cols-2 gap-4">
                            {styleTraits.map((trait, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-[#111] border border-[#222] rounded-2xl">
                                    <div>
                                        <p className="text-[#666] text-[10px] font-bold uppercase tracking-wider">{trait.label}</p>
                                        <p className="text-white text-[14px] font-medium mt-1">{trait.value}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[#00D26A] text-[16px] font-bold">{trait.confidence}%</span>
                                        <span className="text-[#666] text-[10px] uppercase">confidence</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-[#222] bg-[#111]/50 rounded-2xl">
                            <div className="w-14 h-14 rounded-[14px] border border-[#333] bg-[#1A1A1A] flex items-center justify-center">
                                <PenTool className="w-6 h-6 text-[#555]" />
                            </div>
                            <div className="text-center">
                                <p className="text-[#aaa] text-[14px] font-medium">Connect your social accounts and save your profile</p>
                                <p className="text-[#666] text-[12px] mt-1">We'll analyze your writing style automatically</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}