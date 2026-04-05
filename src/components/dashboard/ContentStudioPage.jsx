import React, { useState, useEffect } from 'react';
import { 
    PenTool, Sparkles, FileText, Instagram, Linkedin, MessageCircle, Mail, 
    Loader2, Copy, Check, ChevronRight, Settings2, CornerDownLeft, Circle, Library, Twitter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import ReactMarkdown from 'react-markdown';
import { copyMarkdownToClipboard, copyPlainTextToClipboard, markdownToPlainClean, stripPasteMetaNoise } from '@/lib/copyRichMarkdown';

// Keep existing util functions
function normalizeArticle(article, topic) {
    if (!article) return null;
    
    // Helper to strip markdown json blocks
    const stripCodeBlock = (str) => {
        if (typeof str !== 'string') return str;
        let s = str.trim();
        if (s.startsWith('```json')) s = s.substring(7);
        else if (s.startsWith('```')) s = s.substring(3);
        if (s.endsWith('```')) s = s.substring(0, s.length - 3);
        return s.trim();
    };

    if (typeof article === 'string') {
        try {
            const cleanStr = stripCodeBlock(article);
            const parsed = JSON.parse(cleanStr);
            return normalizeArticle(parsed, topic);
        } catch {
            return { title: topic, content: article, sources: [], faq: [], keyTakeaways: [], suggestedKeywords: [] };
        }
    }
    
    if (article.content && typeof article.content === 'string') {
        const cleanContent = stripCodeBlock(article.content);
        if (cleanContent.startsWith('{')) {
            try {
                const parsed = JSON.parse(cleanContent);
                if (parsed.content || parsed.title) return normalizeArticle(parsed, topic);
            } catch {}
        }
    }
    
    return {
        title: article.title || topic,
        metaDescription: article.metaDescription,
        keyTakeaways: article.keyTakeaways || [],
        content: article.content || '',
        faq: article.faq || [],
        sources: article.sources || [],
        suggestedKeywords: article.suggestedKeywords || [],
        discoverabilityNotes: article.discoverabilityNotes || [],
        wordCount: article.wordCount,
        readingTime: article.readingTime,
    };
}

function getArticleFromItem(item) {
    return item?.article || (item?.content ? { title: item.title, content: item.content, sources: item.sources || [], faq: item.faq || [], keyTakeaways: item.keyTakeaways || [], suggestedKeywords: item.suggestedKeywords || [], discoverabilityNotes: item.discoverabilityNotes || [], metaDescription: item.metaDescription } : null);
}

function platformKindFromTabId(tabId) {
    return ['linkedin', 'twitter', 'instagram', 'reddit'].includes(tabId) ? 'social' : 'longform';
}

function platformKindFromName(name) {
    const social = ['LinkedIn Post', 'X / Twitter Thread', 'Instagram Caption', 'Reddit / Quora'];
    return social.includes(name) ? 'social' : 'longform';
}

/** Blog / newsletter: Markdown export for CMS + rich copy. */
function buildLongformMarkdownExport(article) {
    if (!article) return '';
    const lines = [];
    if (article.title) lines.push(`# ${article.title}`, '');
    if (article.metaDescription) lines.push(`*${article.metaDescription}*`, '');
    if (article.keyTakeaways?.length) {
        lines.push('## Key takeaways', '');
        article.keyTakeaways.forEach((t) => lines.push(`- ${t}`));
        lines.push('');
    }
    lines.push('---', '');
    const body = (article.content || '').trim();
    if (body) lines.push(body, '');
    const contentLower = body.toLowerCase();
    const faqInBody = /\n##\s*faq\b/.test(contentLower) || /^##\s*faq\b/m.test(contentLower);
    if (!faqInBody && article.faq?.length) {
        lines.push('## FAQ', '');
        article.faq.forEach(({ q, a }) => {
            lines.push(`**Q:** ${q}`, '', `${a}`, '');
        });
    }
    if (article.sources?.length) {
        lines.push('---', '', '## Sources', '');
        article.sources.forEach((s) => {
            lines.push(`- **${s.name}**${s.description ? ` — ${s.description}` : ''}`);
        });
        lines.push('');
    }
    if (article.suggestedKeywords?.length) {
        lines.push(`*Keywords:* ${article.suggestedKeywords.join(', ')}`);
    }
    return lines.join('\n').trim();
}

/** Social: plain paste-ready body only (AEO/GEO data lives in JSON, not shown here). */
function buildSocialPlainExport(article) {
    if (!article) return '';
    let c = (article.content || '').trim();
    if (/[*_`#]/.test(c)) c = markdownToPlainClean(c);
    return stripPasteMetaNoise(c);
}

function buildExportDraftForArticle(article, kind) {
    if (!article) return '';
    return kind === 'social' ? buildSocialPlainExport(article) : buildLongformMarkdownExport(article);
}

function ContentExportPanel({ value, onChange, variant }) {
    const [tab, setTab] = useState('preview');
    const isLongform = variant === 'longform';

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <p className="text-[#888] text-[12px] leading-relaxed">
                {isLongform ? (
                    <>Preview shows formatted article. Switch to Markdown to edit. Copy uses rich formatting for Word / CMS where supported.</>
                ) : (
                    <>This is the exact text to paste into your social app — no markdown symbols. Edit if needed, then Copy.</>
                )}
            </p>
            {isLongform && (
                <div className="flex gap-1 p-1 bg-[#111] border border-[#333] rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setTab('preview')}
                        className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${tab === 'preview' ? 'bg-[#E92A15] text-white' : 'text-[#888] hover:text-white'}`}
                    >
                        Preview
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('edit')}
                        className={`px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all ${tab === 'edit' ? 'bg-[#E92A15] text-white' : 'text-[#888] hover:text-white'}`}
                    >
                        Markdown
                    </button>
                </div>
            )}
            {isLongform && tab === 'preview' ? (
                <div
                    className="min-h-[min(60vh,480px)] max-h-[min(70vh,560px)] overflow-y-auto rounded-xl border border-[#333] bg-[#0B0B0B] px-6 py-5 prose prose-invert max-w-none text-[#ccc] leading-relaxed text-[15px]
                    [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4
                    [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3
                    [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2
                    [&_p]:my-3 [&_strong]:text-white [&_li]:my-1"
                >
                    <ReactMarkdown>{value || '*Nothing to preview*'}</ReactMarkdown>
                </div>
            ) : (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    spellCheck
                    className={`w-full min-h-[min(60vh,480px)] resize-y rounded-xl border border-[#333] bg-[#0B0B0B] px-4 py-3 text-[15px] leading-relaxed text-[#e5e5e5] placeholder:text-[#555] focus:border-[#555] focus:outline-none focus:ring-1 focus:ring-[#444] ${isLongform ? 'font-mono text-[13px]' : 'font-sans'}`}
                    aria-label={isLongform ? 'Markdown source' : 'Post text'}
                />
            )}
        </div>
    );
}

const contentSeoPlatforms = [
    { id: 'blog', name: 'Blog / Article', icon: FileText, tag: 'Long-form', count: '1,500-2,500w' },
    { id: 'newsletter', name: 'Email Newsletter', icon: Mail, tag: 'Mid-form', count: '600-1,000w' },
];

const socialMediaPlatforms = [
    { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin, tag: 'Mid-form', count: '800-1,200w' },
    { id: 'twitter', name: 'X / Twitter Thread', icon: Twitter, tag: 'Thread', count: '280-1,500w' },
    { id: 'instagram', name: 'Instagram Caption', icon: Instagram, tag: 'Short', count: '150-300w' },
    { id: 'reddit', name: 'Reddit / Quora', icon: MessageCircle, tag: 'Long-form', count: '400-700w' },
];

export default function ContentStudioPage({ user }) {
    const [step, setStep] = useState(1); // 1: Topic, 2: Platforms, 3: Generate, 4: Review
    const [topic, setTopic] = useState('');
    const [brandHubContext, setBrandHubContext] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['blog']);
    const [activeTab, setActiveTab] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState({});
    const [copied, setCopied] = useState(null);
    const [activeView, setActiveView] = useState('create'); // 'create' or 'library'
    const [contentLibrary, setContentLibrary] = useState([]);
    const [suggestedTopics, setSuggestedTopics] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState(null);
    const [loadingLibrary, setLoadingLibrary] = useState(true);
    const [exportDraft, setExportDraft] = useState('');
    const [libExportDraft, setLibExportDraft] = useState('');

    // Contextual Defaults
    const brandName = user?.brandName || 'Camana Homes';
    const location = user?.location || 'Dubai';
    const industry = user?.industry || 'real estate';
    
    useEffect(() => {
        const loadSuggestions = async () => {
            if (!user) return;
            setLoadingSuggestions(true);
            try {
                const response = await apiClient.content.suggestTopics({
                    brandName: user.brandName,
                    industry: user.industry,
                    location: user.location,
                    domain: user.domain
                });
                if (response.success && response.topics) {
                    setSuggestedTopics(response.topics);
                }
            } catch (error) {
                console.error("Failed to fetch topic suggestions:", error);
                setSuggestedTopics([
                    { type: 'VISIBILITY', text: `Top ${user.industry || 'real estate'} trends in ${user.location || 'Dubai'}` },
                    { type: 'BRAND', text: `Why ${user.brandName || 'Camana Homes'} stands out` },
                ]);
            }
            setLoadingSuggestions(false);
        };
        loadSuggestions();
    }, [user]);

    useEffect(() => {
        const load = async () => {
            try {
                const contents = await apiClient.content.list(user?.projectId);
                setContentLibrary((contents || []).map((c) => ({
                    id: c.id,
                    title: c.title,
                    platform: c.platform,
                    status: c.status,
                    date: c.date,
                    article: c.article,
                })));
            } catch {
                setContentLibrary([]);
            } finally {
                setLoadingLibrary(false);
            }
        };
        load();
    }, [user?.projectId]);

    useEffect(() => {
        if (step === 4 && activeTab && generatedContent[activeTab]) {
            const kind = platformKindFromTabId(activeTab);
            setExportDraft(buildExportDraftForArticle(generatedContent[activeTab], kind));
        }
    }, [step, activeTab, generatedContent]);

    useEffect(() => {
        if (!selectedLibraryItem?.id) return;
        const art = getArticleFromItem(selectedLibraryItem);
        if (!art) return;
        const kind = platformKindFromName(selectedLibraryItem.platform || '');
        setLibExportDraft(buildExportDraftForArticle(art, kind));
    }, [selectedLibraryItem]);

    useEffect(() => {
        const prefill = localStorage.getItem('searchlyst_content_prefill');
        if (!prefill) return;
        localStorage.removeItem('searchlyst_content_prefill');
        try {
            const parsed = JSON.parse(prefill);
            if (parsed && typeof parsed.topic === 'string' && parsed.topic.trim()) {
                setTopic(parsed.topic.trim());
                setStep(1);
                return;
            }
        } catch {
            /* plain string */
        }
        setTopic(prefill);
        setStep(1);
    }, []);

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!topic.trim() || selectedPlatforms.length === 0) return;
        setGenerating(true);
        setStep(3); // Generating State

        const results = {};
        const newLibraryItems = [];

        try {
            await Promise.all(selectedPlatforms.map(async (platformId) => {
                const platformDef = [...contentSeoPlatforms, ...socialMediaPlatforms].find(p => p.id === platformId);
                const platformName = platformDef?.name || 'Blog Article';
                
                const response = await apiClient.content.generate({
                    topic,
                    brandName: user?.brandName || '',
                    industry: user?.industry || '',
                    domain: user?.domain || '',
                    platform: platformName,
                    keywords: '',
                    projectId: user?.projectId,
                    ...(brandHubContext.trim() ? { brandHubContext: brandHubContext.trim() } : {}),
                });

                if (response.success && response.article) {
                    const article = normalizeArticle(response.article, topic);
                    results[platformId] = article;
                    newLibraryItems.push({ id: response.id || Date.now() + Math.random(), title: article.title || topic, platform: platformName, status: 'published', date: 'Just now', article });
                } else {
                    throw new Error(`Generation failed for ${platformName}`);
                }
            }));

            setGeneratedContent(results);
            setActiveTab(selectedPlatforms[0]);
            setContentLibrary(prev => [...newLibraryItems, ...prev]);

        } catch (error) {
            console.error('Content generation error:', error);
            const fallback = { title: topic, content: `Generation failed\n\nContent generation encountered an error.\n\n${error.message}` };
            setGeneratedContent({ [selectedPlatforms[0]]: fallback });
            setActiveTab(selectedPlatforms[0]);
        }
        
        setGenerating(false);
        setStep(4); // Review State
    };

    const handleCopy = async (text, id, mode) => {
        try {
            if (mode === 'social') await copyPlainTextToClipboard(text);
            else await copyMarkdownToClipboard(text);
        } catch {
            try {
                await navigator.clipboard.writeText(stripPasteMetaNoise((text || '').trim()));
            } catch {
                /* ignore */
            }
        }
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const renderStepper = () => (
        <div className="flex items-center justify-center max-w-3xl mx-auto my-12">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[15px] font-bold transition-all ${step >= 1 ? 'border-white text-white' : 'border-[#333] text-[#555]'}`}>
                    {step > 1 ? <Check className="w-5 h-5" /> : '01'}
                </div>
                <div>
                    <p className={`text-[15px] font-semibold ${step >= 1 ? 'text-white' : 'text-[#666]'}`}>Your Topic</p>
                    <p className="text-[12px] text-[#666]">What to write about</p>
                </div>
            </div>
            {/* Connector */}
            <div className={`flex-1 h-[2px] mx-6 rounded-full transition-all ${step >= 2 ? 'bg-[#333]' : 'bg-[#1A1A1A]'}`}></div>
            {/* Step 2 */}
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[15px] font-bold transition-all ${step >= 2 ? 'border-white text-white' : 'border-[#222] text-[#444] bg-[#0A0A0A]'}`}>
                    {step > 2 ? <Check className="w-5 h-5" /> : '02'}
                </div>
                <div>
                    <p className={`text-[15px] font-semibold ${step >= 2 ? 'text-white' : 'text-[#555]'}`}>Platforms</p>
                    <p className="text-[12px] text-[#555]">Where to publish</p>
                </div>
            </div>
            {/* Connector */}
            <div className={`flex-1 h-[2px] mx-6 rounded-full transition-all ${step >= 3 ? 'bg-[#333]' : 'bg-[#1A1A1A]'}`}></div>
            {/* Step 3 */}
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-[15px] font-bold transition-all ${step >= 3 ? 'border-white text-white' : 'border-[#222] text-[#444] bg-[#0A0A0A]'}`}>
                    03
                </div>
                <div>
                    <p className={`text-[15px] font-semibold ${step >= 3 ? 'text-white' : 'text-[#555]'}`}>Generate</p>
                    <p className="text-[12px] text-[#555]">Create Content</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full pb-20">
            {/* Header */}
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#120404] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Sparkles className="w-[20px] h-[20px] text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Content Studio</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Blog &amp; email: formatted preview + Markdown. Social: plain paste-ready copy. AEO/GEO structured in the model. Brand Hub when you attach context.</p>
                    </div>
                </div>
                <div className="flex items-center bg-[#111] border border-[#222] rounded-full p-1.5">
                    <button onClick={() => { setActiveView('create'); setStep(1); }} className={`flex items-center gap-2 px-6 py-2 text-[14px] font-medium rounded-full transition-all ${activeView === 'create' ? 'bg-[#E92A15] text-white shadow-[0_0_15px_rgba(233,42,21,0.25)]' : 'text-[#666] hover:text-white'}`}>
                        <Sparkles className="w-4 h-4" /> Create
                    </button>
                    <button onClick={() => setActiveView('library')} className={`flex items-center gap-2 px-6 py-2 text-[14px] font-medium rounded-full transition-all ${activeView === 'library' ? 'bg-[#E92A15] text-white shadow-[0_0_15px_rgba(233,42,21,0.25)]' : 'text-[#666] hover:text-white'}`}>
                        <Library className="w-4 h-4" /> Library ({contentLibrary.length})
                    </button>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto mt-8">
                {activeView === 'library' ? (
                    /* Library View (Unchanged structure, adapted colors) */
                    <div className="space-y-4">
                        {loadingLibrary ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#E92A15] animate-spin" /></div>
                        ) : selectedLibraryItem != null ? (
                            <div className="bg-[#0B0B0B] border border-[#222] rounded-3xl overflow-hidden shadow-2xl">
                                <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#111]">
                                    <h3 className="text-white font-semibold text-[16px] truncate pr-4">{selectedLibraryItem.title}</h3>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button onClick={() => handleCopy(libExportDraft, 'lib', platformKindFromName(selectedLibraryItem?.platform || '') === 'social' ? 'social' : 'longform')} className="px-4 py-2 text-[12px] font-medium text-white bg-[#1A1A1A] border border-[#333] hover:bg-[#222] rounded-xl transition-all">
                                            {copied === 'lib' ? 'Copied!' : 'Copy'}
                                        </button>
                                        <button onClick={() => setSelectedLibraryItem(null)} className="px-4 py-2 text-[12px] font-medium text-white bg-[#E92A15] hover:bg-[#D12512] rounded-xl transition-all">
                                            Close
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[70vh] overflow-y-auto">
                                    <ContentExportPanel
                                        key={selectedLibraryItem?.id}
                                        value={libExportDraft}
                                        onChange={setLibExportDraft}
                                        variant={platformKindFromName(selectedLibraryItem?.platform || '') === 'social' ? 'social' : 'longform'}
                                    />
                                </div>
                            </div>
                        ) : contentLibrary.length === 0 ? (
                            <div className="text-center py-20 border border-dashed border-[#333] rounded-3xl bg-[#0A0A0A]">
                                <FileText className="w-12 h-12 text-[#333] mx-auto mb-4" />
                                <p className="text-[#888] text-[14px]">No content generated yet in this project.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {contentLibrary.map((item, i) => (
                                    <button key={i} onClick={() => setSelectedLibraryItem(item)} className="w-full text-left bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 flex items-center justify-between hover:border-[#444] hover:bg-[#111] transition-all group">
                                        <div className="flex items-center gap-5 min-w-0">
                                            <div className="w-12 h-12 bg-[#1A1A1A] border border-[#333] rounded-xl flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-[#888]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-[15px] font-semibold truncate mb-1">{item.title}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[#888] text-[12px]">{item.platform}</span>
                                                    <span className="text-[#444]">•</span>
                                                    <span className="text-[#888] text-[12px]">{item.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#555] group-hover:text-white transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {renderStepper()}

                        {/* Step 1: Topic */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-[26px] font-bold text-white tracking-tight mb-2">What should we write about?</h2>
                                <p className="text-[#888] text-[15px] mb-8">Describe your topic — the more specific, the more authoritative the output.</p>
                                
                                {/* Advanced Text Area */}
                                <div className={`relative bg-[#0B0B0B] border ${topic.length > 0 ? 'border-[#E92A15]' : 'border-[#333]'} rounded-[24px] overflow-hidden shadow-2xl transition-colors duration-300`}>
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#0A0A0A]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#E92A15]"></div>
                                            <span className="text-[#E92A15] text-[10px] font-bold uppercase tracking-widest">Topic Defined</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#333]"></div>
                                        </div>
                                    </div>
                                    
                                    <textarea 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder={`e.g. Why ${brandName} is the best choice for ${industry.toLowerCase()} in ${location} for ${new Date().getFullYear()}...`}
                                        className="w-full h-[200px] bg-transparent text-white text-[18px] leading-relaxed p-6 placeholder:text-[#444] focus:outline-none resize-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && topic.trim().length > 0) {
                                                e.preventDefault();
                                                setStep(2);
                                            }
                                        }}
                                    />
                                    
                                    <div className="flex items-center justify-between px-6 py-4 bg-[#111] border-t border-[#222]">
                                        <div className="flex items-center gap-2 text-[#666] text-[13px]">
                                            <Settings2 className="w-4 h-4" />
                                            <span>Content settings · Professional · Medium · English</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#555] text-[12px] font-medium">
                                            <CornerDownLeft className="w-3.5 h-3.5" /> Enter to continue
                                        </div>
                                    </div>
                                </div>

                                <details className="mt-6 rounded-2xl border border-[#222] bg-[#0B0B0B] overflow-hidden open:border-[#333]">
                                    <summary className="cursor-pointer px-5 py-3 text-[13px] font-semibold text-[#ccc] hover:bg-[#111] list-none flex items-center gap-2 marker:content-['']">
                                        <span className="text-[#a78bfa]">▸</span>
                                        Brand Hub context (optional — Social · AI visibility · Custom inbox)
                                    </summary>
                                    <div className="px-5 pb-4 pt-0 border-t border-[#1a1a1a]">
                                        <p className="text-[12px] text-[#666] mt-3 mb-2 leading-relaxed">
                                            Paste notes the model must treat as Brand Hub sources. It will cite them inline as{' '}
                                            <code className="text-[11px] text-[#888]">[Source: Brand Hub — …]</code>.
                                            Leave empty to use only your topic and profile fields.
                                        </p>
                                        <textarea
                                            value={brandHubContext}
                                            onChange={(e) => setBrandHubContext(e.target.value)}
                                            placeholder={'e.g.\n[Social] Top themes from LinkedIn: …\n[AI Visibility] Models often cite competitor X for …\n[Custom Inbox] Never claim we offer …'}
                                            className="w-full min-h-[120px] bg-[#080808] border border-[#2a2a2a] rounded-xl text-[#ddd] text-[13px] leading-relaxed p-4 placeholder:text-[#444] focus:outline-none focus:border-[#E92A15]/40 resize-y"
                                        />
                                    </div>
                                </details>

                                {/* AI Suggestions Array */}
                                <div className="mt-12">
                                    <div className="flex items-center gap-2 mb-6">
                                        {loadingSuggestions ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Sparkles className="w-5 h-5 text-white" />}
                                        <h3 className="text-white font-bold text-[15px] tracking-wide uppercase">AI Suggestions</h3>
                                        <span className="text-[#666] text-[15px]">from your latest visibility scan</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {suggestedTopics.map((item, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => setTopic(item.text)}
                                                className="flex items-center gap-4 bg-[#0B0B0B] border border-[#222] hover:border-[#444] hover:bg-[#111] rounded-2xl p-4 text-left transition-all group"
                                            >
                                                <div className="px-3 py-1 bg-[#1A1A1A] border border-[#333] rounded-[8px] text-[#aaa] text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                    {item.type}
                                                </div>
                                                <span className="text-[#bbb] group-hover:text-white text-[14px] font-medium leading-snug line-clamp-2">
                                                    {item.text}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <button 
                                        onClick={() => setStep(2)} 
                                        disabled={!topic.trim()}
                                        className="px-8 py-4 bg-[#E92A15] hover:bg-[#D12512] disabled:opacity-50 disabled:hover:bg-[#E92A15] text-white rounded-full text-[15px] font-bold shadow-[0_0_30px_rgba(233,42,21,0.25)] transition-all flex items-center gap-2"
                                    >
                                        Continue — Choose Platforms <ChevronRight className="w-5 h-5 ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Platforms */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h2 className="text-[26px] font-bold text-white tracking-tight mb-2">Where will this be published?</h2>
                                        <p className="text-[#888] text-[15px]">Select one or more platforms — each gets its own tailored version.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 border border-[#E92A15] text-[#E92A15] rounded-full text-[13px] font-medium bg-[#E92A15]/10">
                                            {selectedPlatforms.length} selected
                                        </div>
                                        <button 
                                            onClick={() => setSelectedPlatforms([...contentSeoPlatforms.map(p=>p.id), ...socialMediaPlatforms.map(p=>p.id)])}
                                            className="px-4 py-2 border border-[#333] hover:border-[#555] text-[#bbb] hover:text-white rounded-full text-[13px] font-medium transition-all">
                                            Select all
                                        </button>
                                        <button 
                                            onClick={() => setSelectedPlatforms([])}
                                            className="px-4 py-2 border border-[#333] hover:border-[#555] text-[#bbb] hover:text-white rounded-full text-[13px] font-medium transition-all">
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-10">
                                    {/* Content & SEO Section */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-1 h-4 bg-white rounded-full"></div>
                                            <h3 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">Content & SEO</h3>
                                            <div className="flex gap-1 ml-2">
                                                <div className="w-1 h-1 rounded-full bg-[#E92A15]"></div>
                                                <div className="w-1 h-1 rounded-full bg-[#333]"></div>
                                                <div className="w-1 h-1 rounded-full bg-[#333]"></div>
                                            </div>
                                            <div className="flex-1"></div>
                                            <div className="text-[#888] text-[12px] font-medium">
                                                <span className="text-white">{selectedPlatforms.filter(id => contentSeoPlatforms.find(p => p.id === id)).length}</span>/{contentSeoPlatforms.length}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const allIds = contentSeoPlatforms.map(p => p.id);
                                                    setSelectedPlatforms(prev => [...new Set([...prev, ...allIds])]);
                                                }}
                                                className="px-3 py-1 border border-[#333] text-[#bbb] hover:text-white rounded-lg text-[11px] font-medium hover:bg-[#1A1A1A] transition-all"
                                            >
                                                Select all
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {contentSeoPlatforms.map(p => {
                                                const isSelected = selectedPlatforms.includes(p.id);
                                                return (
                                                    <button 
                                                        key={p.id} 
                                                        onClick={() => togglePlatform(p.id)}
                                                        className={`relative flex flex-col p-6 rounded-[20px] border text-left transition-all overflow-hidden ${isSelected ? 'bg-[#111] border-white' : 'bg-[#0B0B0B] border-[#222] hover:border-[#444]'}`}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-3 h-3 text-black font-bold" />
                                                            </div>
                                                        )}
                                                        <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center border ${isSelected ? 'bg-[#222] border-[#444]' : 'bg-[#1A1A1A] border-[#333]'}`}>
                                                            <p.icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#888]'}`} />
                                                        </div>
                                                        <h4 className={`text-[17px] font-bold mb-3 ${isSelected ? 'text-white' : 'text-[#eee]'}`}>{p.name}</h4>
                                                        <div className="flex items-center gap-2 mt-auto">
                                                            <span className="px-2.5 py-1 bg-[#1A1A1A] border border-[#333] rounded-[6px] text-[#ccc] text-[10px] font-semibold">{p.tag}</span>
                                                            <span className="text-[#666] text-[11px] font-medium">{p.count}</span>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Social Media Section */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-1 h-4 bg-white rounded-full"></div>
                                            <h3 className="text-white text-[13px] font-bold tracking-[0.15em] uppercase">Social Media</h3>
                                            <div className="flex gap-1 ml-2">
                                                <div className="w-1 h-1 rounded-full bg-[#E92A15]"></div>
                                                <div className="w-1 h-1 rounded-full bg-[#333]"></div>
                                                <div className="w-1 h-1 rounded-full bg-[#333]"></div>
                                            </div>
                                            <div className="flex-1"></div>
                                            <div className="text-[#888] text-[12px] font-medium">
                                                <span className="text-white">{selectedPlatforms.filter(id => socialMediaPlatforms.find(p => p.id === id)).length}</span>/{socialMediaPlatforms.length}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const allIds = socialMediaPlatforms.map(p => p.id);
                                                    setSelectedPlatforms(prev => [...new Set([...prev, ...allIds])]);
                                                }}
                                                className="px-3 py-1 border border-[#333] text-[#bbb] hover:text-white rounded-lg text-[11px] font-medium hover:bg-[#1A1A1A] transition-all"
                                            >
                                                Select all
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                            {socialMediaPlatforms.map(p => {
                                                const isSelected = selectedPlatforms.includes(p.id);
                                                return (
                                                    <button 
                                                        key={p.id} 
                                                        onClick={() => togglePlatform(p.id)}
                                                        className={`relative flex flex-col p-6 rounded-[20px] border text-left transition-all overflow-hidden ${isSelected ? 'bg-[#111] border-white' : 'bg-[#0B0B0B] border-[#222] hover:border-[#444]'}`}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-4 right-4 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                                <Check className="w-3 h-3 text-black font-bold" />
                                                            </div>
                                                        )}
                                                        <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center border ${isSelected ? 'bg-[#222] border-[#444]' : 'bg-[#1A1A1A] border-[#333]'}`}>
                                                            <p.icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#888]'}`} />
                                                        </div>
                                                        <h4 className={`text-[15px] font-semibold mb-3 ${isSelected ? 'text-white' : 'text-[#eee]'}`}>{p.name}</h4>
                                                        <div className="flex items-center gap-2 mt-auto">
                                                            <span className="px-2.5 py-1 bg-[#1A1A1A] border border-[#333] rounded-[6px] text-[#ccc] text-[10px] font-semibold">{p.tag}</span>
                                                            <span className="text-[#666] text-[11px] font-medium">{p.count}</span>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Bottom Action Bar */}
                                <div className="mt-12 flex items-center justify-between p-4 bg-[#0A0A0A] border border-[#222] rounded-2xl">
                                    <div className="flex items-center gap-3 overflow-x-auto pr-4">
                                        <div className="w-8 h-8 rounded-full bg-[#E92A15]/10 flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 text-[#E92A15]" />
                                        </div>
                                        {[...contentSeoPlatforms, ...socialMediaPlatforms].filter(p => selectedPlatforms.includes(p.id)).map(p => (
                                            <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] border border-[#333] rounded-lg shrink-0">
                                                <p.icon className="w-3.5 h-3.5 text-[#bbb]" />
                                                <span className="text-white text-[11px] font-medium whitespace-nowrap">{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-[14px] text-[#888] font-medium shrink-0 whitespace-nowrap pl-4 border-l border-[#222]">
                                        <span className="text-[#E92A15] font-bold">{selectedPlatforms.length}</span> versions to generate
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center gap-4">
                                    <button onClick={() => setStep(1)} className="flex items-center gap-2 px-8 py-4 bg-[#0B0B0B] hover:bg-[#111] border border-[#333] hover:border-[#555] text-white rounded-full text-[15px] font-bold transition-all">
                                        <ChevronRight className="w-5 h-5 rotate-180 text-[#888]" /> Back
                                    </button>
                                    <button 
                                        onClick={handleGenerate} 
                                        disabled={selectedPlatforms.length === 0}
                                        className="flex-1 px-8 py-4 bg-[#E92A15] hover:bg-[#D12512] disabled:opacity-50 text-white rounded-full text-[15px] font-bold shadow-[0_0_30px_rgba(233,42,21,0.25)] transition-all flex items-center justify-center gap-2 group"
                                    >
                                        Generate {selectedPlatforms.length} Platform Versions <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Generating/Loading */}
                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#E92A15] blur-[40px] opacity-30 rounded-full animate-pulse"></div>
                                    <div className="w-20 h-20 bg-[#111] border border-[#E92A15]/50 rounded-[24px] flex items-center justify-center relative z-10 shadow-2xl">
                                        <Loader2 className="w-8 h-8 text-[#E92A15] animate-spin" />
                                    </div>
                                </div>
                                <h2 className="text-white font-bold text-[24px] mt-8 mb-2">Synthesizing Content...</h2>
                                <p className="text-[#888] text-[15px] max-w-sm text-center leading-relaxed">Cross-referencing global AI engines and compiling inline citations optimized specifically for {selectedPlatforms[0]}.</p>
                            </div>
                        )}

                        {/* Step 4: Final Review (Generate Display) */}
                        {step === 4 && Object.keys(generatedContent).length > 0 && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
                                {/* Context Breadcrumb */}
                                <div className="flex items-center justify-between px-6 py-4 bg-[#0B0B0B] border border-[#222] rounded-full mb-8">
                                    <div className="flex items-center gap-4 overflow-x-auto pr-4">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <PenTool className="w-4 h-4 text-[#888]" />
                                            <span className="text-white text-[13px] font-medium">{topic}</span>
                                        </div>
                                        <div className="w-[1px] h-4 bg-[#333] shrink-0"></div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {selectedPlatforms.map(id => {
                                                const p = [...contentSeoPlatforms, ...socialMediaPlatforms].find(x => x.id === id);
                                                return p ? <p.icon key={id} className="w-4 h-4 text-[#888]" /> : null;
                                            })}
                                        </div>
                                        <div className="w-[1px] h-4 bg-[#333] shrink-0"></div>
                                        <span className="text-[#888] text-[13px] shrink-0">Professional · Medium · English</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 border-l border-[#222] pl-4">
                                        <button onClick={() => setStep(1)} className="px-3 py-1.5 rounded-full border border-[#333] hover:border-[#555] text-white text-[11px] font-medium transition-all whitespace-nowrap">Edit topic</button>
                                        <button onClick={() => setStep(2)} className="px-3 py-1.5 rounded-full border border-[#333] hover:border-[#555] text-white text-[11px] font-medium transition-all whitespace-nowrap">Edit platforms</button>
                                    </div>
                                </div>
                                
                                {/* Tabs Group */}
                                <div className="flex items-center justify-between border-b border-[#222] mb-8">
                                    <div className="flex overflow-x-auto gap-1">
                                        {selectedPlatforms.map(id => {
                                            const p = [...contentSeoPlatforms, ...socialMediaPlatforms].find(x => x.id === id);
                                            const isActive = activeTab === id;
                                            return (
                                                <button 
                                                    key={id}
                                                    onClick={() => setActiveTab(id)}
                                                    className={`hover:bg-[#111] flex items-center gap-3 px-6 py-4 border-b-2 transition-all ${isActive ? 'border-white text-white bg-[#111]' : 'border-transparent text-[#666] hover:text-[#bbb]'}`}
                                                >
                                                    <p.icon className="w-[18px] h-[18px]" />
                                                    <span className="text-[14px] font-bold">{p?.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="text-[#666] text-[13px] font-medium px-4">
                                        {selectedPlatforms.length} versions
                                    </div>
                                </div>

                                {/* Active Tab Content */}
                                {activeTab && generatedContent[activeTab] && (() => {
                                    const activeP = [...contentSeoPlatforms, ...socialMediaPlatforms].find(x => x.id === activeTab);
                                    const article = generatedContent[activeTab];
                                    return (
                                        <div className="bg-[#0A0A0A] border border-[#222] rounded-[16px] overflow-hidden shadow-2xl">
                                            {/* Article Action Header */}
                                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#0F0F0F]">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <activeP.icon className="w-4 h-4 text-white" />
                                                        <span className="text-white text-[14px] font-bold tracking-wide">{activeP?.name}</span>
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-[#444]"></div>
                                                    <span className="text-[#888] text-[12px] font-medium">
                                                        {platformKindFromTabId(activeTab) === 'social' ? 'Plain-text · paste-ready' : 'Markdown · CMS-ready'}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-[#444]"></div>
                                                    <span className="text-[#888] text-[12px] font-medium">AEO / GEO</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#333] hover:border-[#555] text-white rounded-lg text-[12px] font-semibold transition-all">
                                                        <Settings2 className="w-3.5 h-3.5" /> Regenerate
                                                    </button>
                                                    <button onClick={() => handleCopy(exportDraft, activeTab, platformKindFromTabId(activeTab) === 'social' ? 'social' : 'longform')} className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#333] hover:border-[#555] text-white rounded-lg text-[12px] font-semibold transition-all">
                                                        {copied === activeTab ? <Check className="w-3.5 h-3.5 text-[#00D26A]" /> : <Copy className="w-3.5 h-3.5" />} Copy
                                                    </button>
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-[#E92A15] hover:bg-[#D12512] text-white rounded-lg text-[12px] font-semibold transition-all shadow-lg">
                                                        <Library className="w-3.5 h-3.5" /> Save to Library
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Article Inner */}
                                            <ContentExportPanel
                                                key={activeTab}
                                                value={exportDraft}
                                                onChange={setExportDraft}
                                                variant={platformKindFromTabId(activeTab) === 'social' ? 'social' : 'longform'}
                                            />
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                        
                        {/* Fixed Disclaimer Header (Only show during creation flow steps 1/2) */}
                        {step < 3 && (
                            <div className="mt-16 text-center border-t border-[#222] pt-8">
                                <p className="text-[#444] text-[10px] font-bold uppercase tracking-[0.15em] max-w-2xl mx-auto leading-relaxed">
                                    ARTICLES ARE GENERATED WITH INLINE CITATIONS, FAQ SECTIONS AND SOURCE ATTRIBUTIONS — ALL OPTIMIZED FOR AI SEARCH ENGINES TO CITE YOUR CONTENT.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}