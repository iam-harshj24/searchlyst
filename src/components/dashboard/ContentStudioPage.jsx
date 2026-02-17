import React, { useState, useEffect } from 'react';
import { PenTool, Sparkles, FileText, Instagram, Linkedin, Mail, Loader2, Copy, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from '@/api/apiClient';

const platformOptions = [
    { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin, color: 'text-white' },
    { id: 'instagram', name: 'Instagram Carousel', icon: Instagram, color: 'text-white' },
    { id: 'blog', name: 'Blog Article', icon: FileText, color: 'text-white' },
    { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'text-white' },
    { id: 'twitter', name: 'Twitter / X', icon: X, color: 'text-white' },
];

const LIBRARY_STORAGE_KEY = 'searchlyst_content_library';

function formatRelativeTime(isoDate) {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

function loadLibrary() {
    try {
        const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToLibrary(items) {
    const existing = loadLibrary();
    const merged = [...items, ...existing].slice(0, 100); // keep last 100
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(merged));
}

function groupByTopic(items) {
    const groups = {};
    for (const item of items) {
        const key = `${item.topic}::${item.createdAt}`;
        if (!groups[key]) {
            groups[key] = { topic: item.topic, createdAt: item.createdAt, items: [] };
        }
        groups[key].items.push(item);
    }
    return Object.values(groups).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function ContentStudioPage({ activeProject, initialTopic, suggestedPlatformIds, onConsumeInitialData }) {
    const [step, setStep] = useState('select'); // select, generate, review
    const [topic, setTopic] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedLibId, setCopiedLibId] = useState(null);
    const [libraryItems, setLibraryItems] = useState([]);
    const [expandedTopicKey, setExpandedTopicKey] = useState(null);
    const [activeView, setActiveView] = useState('create'); // create, library

    useEffect(() => {
        if (initialTopic) setTopic(initialTopic);
        if (suggestedPlatformIds?.length > 0) {
            setSelectedPlatforms(prev => [...new Set([...prev, ...suggestedPlatformIds])]);
        }
        if (initialTopic || suggestedPlatformIds?.length) {
            onConsumeInitialData?.();
        }
    }, []);

    useEffect(() => {
        setLibraryItems(loadLibrary());
    }, [activeView]); // refresh when switching to library

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!topic.trim() || selectedPlatforms.length === 0) return;
        if (!activeProject?.id) {
            console.error('No project selected. Please select or create a project first.');
            return;
        }
        setGenerating(true);
        setStep('generate');

        const result = await apiClient.generateContent(topic.trim(), {
            projectId: activeProject.id,
            platformIds: selectedPlatforms,
        });
        const contents = Array.isArray(result) ? result : result?.contents || [];
        setGeneratedContent(contents);

        // Save to library
        const now = new Date().toISOString();
        const toSave = contents.map((c) => ({
            id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            topic: topic.trim(),
            platform: c.platform,
            title: c.title,
            content: c.content,
            ai_optimization_tips: c.ai_optimization_tips || [],
            createdAt: now,
        }));
        saveToLibrary(toSave);

        setGenerating(false);
        setStep('review');
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleLibraryCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedLibId(id);
        setTimeout(() => setCopiedLibId(null), 2000);
    };

    const resetForm = () => {
        setStep('select');
        setTopic('');
        setSelectedPlatforms([]);
        setGeneratedContent(null);
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-red-400" />
                        Content Studio
                    </h1>
                    <p className="text-white/40 text-sm mt-1">Create AI-optimized content in your writing style.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveView('create')}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                            activeView === 'create' 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                        }`}
                    >
                        Create New
                    </button>
                    <button
                        onClick={() => setActiveView('library')}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                            activeView === 'library' 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'
                        }`}
                    >
                        Content Library
                    </button>
                </div>
            </div>

            {activeView === 'library' ? (
                /* Content Library - topic list, expand to see platform content */
                <div className="space-y-3">
                    <p className="text-white/40 text-sm">
                        {libraryItems.length === 0
                            ? 'No content yet. Generate content in Create New to see it here.'
                            : `${groupByTopic(libraryItems).length} topic${groupByTopic(libraryItems).length !== 1 ? 's' : ''} saved`}
                    </p>
                    {groupByTopic(libraryItems).map((group) => {
                        const key = `${group.topic}::${group.createdAt}`;
                        const isExpanded = expandedTopicKey === key;
                        return (
                            <div key={key} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedTopicKey(isExpanded ? null : key)}
                                    className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate">{group.topic}</p>
                                            <p className="text-white/40 text-xs mt-0.5">
                                                {formatRelativeTime(group.createdAt)} · {group.items.length} platform{group.items.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="border-t border-white/[0.06] p-4 space-y-4">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02]">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-300 text-[11px] rounded-lg">{item.platform}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleLibraryCopy(item.content, item.id); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30 transition-colors shrink-0"
                                                    >
                                                        {copiedLibId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        {copiedLibId === item.id ? 'Copied!' : 'Copy'}
                                                    </button>
                                                </div>
                                                <div className="bg-black/20 rounded-lg p-3 mb-3">
                                                    <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                                                </div>
                                                {item.ai_optimization_tips?.length > 0 && (
                                                    <div>
                                                        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">AI Optimization Tips</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.ai_optimization_tips.map((tip, ti) => (
                                                                <span key={ti} className="px-2.5 py-1 bg-white/10 text-white text-[10px] rounded-lg">
                                                                    {tip}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : step === 'select' ? (
                /* Step 1: Topic & Platform Selection */
                <div className="space-y-6">
                    {/* Topic Input */}
                    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                        <h3 className="text-white font-medium text-sm mb-1">What do you want to write about?</h3>
                        <p className="text-white/30 text-xs mb-4">Enter a topic, or paste a trending topic from Topic Discovery</p>
                        <Input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Why AI search optimization is the new SEO"
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl h-12 text-sm"
                        />
                    </div>

                    {/* Platform Selection */}
                    <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                        <h3 className="text-white font-medium text-sm mb-1">Select target platforms</h3>
                        <p className="text-white/30 text-xs mb-4">Content will be optimized for each platform</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {platformOptions.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`p-4 rounded-xl border text-center transition-all ${
                                        selectedPlatforms.includes(platform.id)
                                            ? 'bg-red-500/10 border-red-500/30 text-white'
                                            : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/10'
                                    }`}
                                >
                                    <platform.icon className={`w-6 h-6 mx-auto mb-2 ${
                                        selectedPlatforms.includes(platform.id) ? platform.color : 'text-white/20'
                                    }`} />
                                    <p className="text-xs font-medium">{platform.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!activeProject?.id || !topic.trim() || selectedPlatforms.length === 0}
                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-500/20"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Content in My Style
                    </Button>
                </div>
            ) : step === 'generate' ? (
                /* Generating State */
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-white font-medium text-lg mb-2">Generating your content...</h2>
                    <p className="text-white/40 text-sm">Crafting platform-specific content in your writing style</p>
                    <Loader2 className="w-6 h-6 text-red-400 animate-spin mt-6" />
                </div>
            ) : (
                /* Step 3: Review Generated Content */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-white/40 text-sm">{generatedContent?.length || 0} pieces generated</p>
                        <button
                            onClick={resetForm}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20 bg-white/10 text-white hover:bg-white/15"
                        >
                            Create More
                        </button>
                    </div>
                    {generatedContent?.map((item, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-300 text-[11px] rounded-lg">{item.platform}</span>
                                    <h3 className="text-white font-medium mt-2">{item.title}</h3>
                                </div>
                                <button
                                    onClick={() => handleCopy(item.content, i)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30 transition-colors"
                                >
                                    {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copiedIndex === i ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mb-4">
                                <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                            </div>
                            {item.ai_optimization_tips?.length > 0 && (
                                <div>
                                    <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">AI Optimization Tips</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.ai_optimization_tips.map((tip, ti) => (
                                            <span key={ti} className="px-2.5 py-1 bg-white/10 text-white text-[10px] rounded-lg">
                                                {tip}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}