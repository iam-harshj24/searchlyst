import React, { useState, useEffect, useMemo } from 'react';
import { PenTool, Sparkles, FileText, Instagram, Linkedin, MessageCircle, Mail, Loader2, Copy, Check, Eye, Target, ArrowRight, BookOpen, ExternalLink, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from '@/api/apiClient';

const platformOptions = [
    { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin, color: 'text-blue-400' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-400' },
    { id: 'blog', name: 'Blog Article', icon: FileText, color: 'text-green-400' },
    { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'text-yellow-400' },
    { id: 'reddit', name: 'Reddit / Quora', icon: MessageCircle, color: 'text-red-400' },
];

function getVisibilityData(domain) {
    try {
        const key = `searchlyst_visibility_${domain || 'default'}`;
        return JSON.parse(localStorage.getItem(key));
    } catch { return null; }
}

export default function ContentStudioPage({ user }) {
    const [step, setStep] = useState('select');
    const [topic, setTopic] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['blog']);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [copied, setCopied] = useState(null);
    const [activeView, setActiveView] = useState('create');
    const [contentLibrary, setContentLibrary] = useState([]);

    // Scan data for topic suggestions
    const scanData = useMemo(() => getVisibilityData(user?.domain), [user?.domain]);
    const suggestedTopics = useMemo(() => {
        const topics = [];
        // From competitor gaps
        const gaps = scanData?.competitorGaps || [];
        gaps.forEach(g => {
            const t = g.query || g.topic || (typeof g === 'string' ? g : null);
            if (t) topics.push({ text: t, source: 'Competitor Gap', priority: 'high' });
        });
        // From query tracking — prompts where brand was NOT mentioned
        const prompts = scanData?.prompts || [];
        prompts.filter(p => !Object.values(p.engines || {}).some(e => e.mentioned)).forEach(p => {
            if (p.query) topics.push({ text: p.query, source: 'Visibility Gap', priority: 'medium' });
        });
        return topics.slice(0, 8);
    }, [scanData]);

    // Check for pre-filled topic from Topic Discovery or Competitive Intel
    useEffect(() => {
        const prefill = localStorage.getItem('searchlyst_content_prefill');
        if (prefill) {
            setTopic(prefill);
            localStorage.removeItem('searchlyst_content_prefill');
        }
    }, []);

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!topic.trim() || selectedPlatforms.length === 0) return;
        setGenerating(true);
        setStep('generate');

        const platformName = platformOptions.find(p => p.id === selectedPlatforms[0])?.name || 'Blog';

        try {
            const response = await apiClient.content.generate({
                topic,
                brandName: user?.brandName || '',
                industry: user?.industry || '',
                domain: user?.domain || '',
                platform: platformName,
                keywords: '',
            });

            if (response.success && response.article) {
                const article = response.article;
                setGeneratedContent(article);

                // Save to library
                const newItem = {
                    title: article.title || topic,
                    platform: platformName,
                    status: 'draft',
                    date: 'Just now',
                    score: 0,
                    content: article.content,
                    sources: article.sources,
                    faq: article.faq,
                };
                setContentLibrary(prev => [newItem, ...prev]);
            } else {
                throw new Error('Generation failed');
            }
        } catch (error) {
            console.error('Content generation error:', error);
            // Fallback to mock
            setGeneratedContent({
                title: topic,
                content: `# ${topic}\n\nContent generation encountered an error. Please check your Gemini API key configuration and try again.\n\nError: ${error.message}`,
                sources: [],
                faq: [],
                keyTakeaways: [],
            });
        }

        setGenerating(false);
        setStep('review');
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const resetForm = () => {
        setStep('select');
        setTopic('');
        setGeneratedContent(null);
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-red-400" /> Content Studio
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Create AI-optimized content with sources & citations that AI search engines love to reference.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveView('create')}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${activeView === 'create'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
                        Create New
                    </button>
                    <button onClick={() => setActiveView('library')}
                        className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${activeView === 'library'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
                        Library ({contentLibrary.length})
                    </button>
                </div>
            </div>

            {activeView === 'library' ? (
                <div className="space-y-3">
                    {contentLibrary.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                            <p className="text-[var(--text-muted)] text-sm">No content generated yet. Create your first piece!</p>
                        </div>
                    ) : contentLibrary.map((item, i) => (
                        <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:border-red-500/20 transition-all">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 bg-[var(--surface-hover)] rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">{item.title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[var(--text-muted)] text-[11px]">{item.platform}</span>
                                        <span className="text-[var(--text-muted)]">•</span>
                                        <span className="text-[var(--text-muted)] text-[11px]">{item.date}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleCopy(item.content, `lib-${i}`)}
                                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)]">
                                {copied === `lib-${i}` ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    ))}
                </div>
            ) : step === 'select' ? (
                <div className="space-y-6">
                    {/* Suggested Topics */}
                    {suggestedTopics.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-semibold text-[var(--text-primary)]">AI-Suggested Topics</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">From your scan</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {suggestedTopics.map((t, i) => (
                                    <button key={i} onClick={() => setTopic(t.text)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all ${topic === t.text ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-purple-500/30'}`}>
                                        <Target className="w-3 h-3" />
                                        <span className="truncate max-w-[200px]">{t.text}</span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {t.source}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Topic Input */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                        <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">What do you want to write about?</h3>
                        <p className="text-[var(--text-muted)] text-xs mb-4">Enter a topic or select one from the suggestions above</p>
                        <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                            placeholder={`e.g. Why ${user?.industry || 'AI search optimization'} is evolving in ${new Date().getFullYear()}`}
                            className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl h-12 text-sm" />
                    </div>

                    {/* Platform Selection */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                        <h3 className="text-[var(--text-primary)] font-medium text-sm mb-1">Select target platform</h3>
                        <p className="text-[var(--text-muted)] text-xs mb-4">Content will be optimized for the selected platform</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {platformOptions.map((platform) => (
                                <button key={platform.id} onClick={() => togglePlatform(platform.id)}
                                    className={`p-4 rounded-xl border text-center transition-all ${selectedPlatforms.includes(platform.id)
                                        ? 'bg-red-500/10 border-red-500/30 text-[var(--text-primary)]' : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]'}`}>
                                    <platform.icon className={`w-6 h-6 mx-auto mb-2 ${selectedPlatforms.includes(platform.id) ? platform.color : 'text-[var(--text-muted)]'}`} />
                                    <p className="text-xs font-medium">{platform.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Smart hint */}
                    <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <Zap className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-blue-300">Articles are generated with inline citations, FAQ sections, and source attributions — all optimized for AI search engines to cite your content.</p>
                    </div>

                    <Button onClick={handleGenerate} disabled={!topic.trim() || selectedPlatforms.length === 0}
                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-500/20">
                        <Sparkles className="w-4 h-4 mr-2" /> Generate AI-Optimized Content
                    </Button>
                </div>
            ) : step === 'generate' ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-[var(--text-primary)] font-medium text-lg mb-2">Generating your content...</h2>
                    <p className="text-[var(--text-secondary)] text-sm">Crafting an article with sources, citations & FAQ sections</p>
                    <Loader2 className="w-6 h-6 text-red-400 animate-spin mt-6" />
                </div>
            ) : (
                /* Review Generated Content */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[var(--text-secondary)] text-sm">Content generated successfully</p>
                        <Button onClick={resetForm} variant="outline" size="sm" className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs">
                            Create More
                        </Button>
                    </div>

                    {generatedContent && (
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
                            {/* Title & Meta */}
                            <div className="p-6 border-b border-[var(--border)]">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">{generatedContent.title || topic}</h2>
                                {generatedContent.metaDescription && (
                                    <p className="text-[var(--text-muted)] text-xs italic">{generatedContent.metaDescription}</p>
                                )}
                                <div className="flex items-center gap-3 mt-3">
                                    {generatedContent.wordCount && <span className="text-[10px] px-2 py-1 bg-[var(--surface-active)] text-[var(--text-secondary)] rounded">{generatedContent.wordCount} words</span>}
                                    {generatedContent.readingTime && <span className="text-[10px] px-2 py-1 bg-[var(--surface-active)] text-[var(--text-secondary)] rounded">{generatedContent.readingTime} read</span>}
                                    <button onClick={() => handleCopy(generatedContent.content, 'main')}
                                        className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                                        {copied === 'main' ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Article</>}
                                    </button>
                                </div>
                            </div>

                            {/* Key Takeaways */}
                            {generatedContent.keyTakeaways?.length > 0 && (
                                <div className="p-5 border-b border-[var(--border)] bg-green-500/5">
                                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Key Takeaways</h4>
                                    <ul className="space-y-1.5">
                                        {generatedContent.keyTakeaways.map((t, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                <span className="text-green-400 mt-0.5">•</span> {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Article Content */}
                            <div className="p-6">
                                <div className="prose prose-sm prose-invert max-w-none text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed text-sm">
                                    {generatedContent.content}
                                </div>
                            </div>

                            {/* FAQ Section */}
                            {generatedContent.faq?.length > 0 && (
                                <div className="p-5 border-t border-[var(--border)] bg-purple-500/5">
                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">FAQ Section</h4>
                                    <div className="space-y-3">
                                        {generatedContent.faq.map((item, i) => (
                                            <div key={i} className="bg-[var(--bg-primary)]/50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Q: {item.q}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">A: {item.a}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sources */}
                            {generatedContent.sources?.length > 0 && (
                                <div className="p-5 border-t border-[var(--border)]">
                                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5" /> Sources & References
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {generatedContent.sources.map((src, i) => (
                                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface-hover)] text-xs">
                                                <ExternalLink className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[var(--text-primary)] font-medium">{src.name}</p>
                                                    {src.description && <p className="text-[var(--text-muted)] text-[10px]">{src.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Keywords */}
                            {generatedContent.suggestedKeywords?.length > 0 && (
                                <div className="p-5 border-t border-[var(--border)]">
                                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Suggested Keywords</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {generatedContent.suggestedKeywords.map((kw, i) => (
                                            <span key={i} className="px-2 py-1 bg-[var(--surface-active)] text-[var(--text-secondary)] text-[10px] rounded-lg">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}