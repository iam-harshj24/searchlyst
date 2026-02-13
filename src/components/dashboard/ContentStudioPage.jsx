import React, { useState } from 'react';
import { 
    PenTool, Sparkles, FileText, Instagram, Linkedin, BookOpen,
    MessageCircle, Mail, ArrowRight, Loader2, Copy, Check,
    ChevronDown, Globe, Target, Zap, Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';

const platformOptions = [
    { id: 'linkedin', name: 'LinkedIn Post', icon: Linkedin, color: 'text-white' },
    { id: 'instagram', name: 'Instagram Carousel', icon: Instagram, color: 'text-white' },
    { id: 'blog', name: 'Blog Article', icon: FileText, color: 'text-white' },
    { id: 'newsletter', name: 'Newsletter', icon: Mail, color: 'text-white' },
    { id: 'reddit', name: 'Reddit / Quora', icon: MessageCircle, color: 'text-red-400' },
];

const contentLibrary = [
    { title: 'AI Agents: The Next Frontier for Enterprise', platform: 'LinkedIn', status: 'published', date: '2d ago', score: 92 },
    { title: '5 Signs Your Startup Needs an AI Strategy', platform: 'Blog', status: 'published', date: '5d ago', score: 88 },
    { title: 'Why HNWI Need Personal Branding Now', platform: 'Newsletter', status: 'draft', date: '1d ago', score: 0 },
    { title: 'Sustainable Tech ROI Breakdown', platform: 'Blog', status: 'draft', date: '3h ago', score: 0 },
];

export default function ContentStudioPage() {
    const [step, setStep] = useState('select'); // select, generate, review
    const [topic, setTopic] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [copied, setCopied] = useState(false);
    const [activeView, setActiveView] = useState('create'); // create, library

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!topic.trim() || selectedPlatforms.length === 0) return;
        setGenerating(true);
        setStep('generate');

        const platformNames = selectedPlatforms.map(id => platformOptions.find(p => p.id === id)?.name).join(', ');
        
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert content creator. Create content for the following topic: "${topic}"
            
Target platforms: ${platformNames}

Guidelines:
- Write in a natural, human-like style. Avoid generic AI phrasing.
- Use specific examples, data points, and anecdotes where possible.
- Include personal opinions and perspectives as if written by a thought leader.
- Vary sentence length and structure for natural rhythm.
- For LinkedIn: Professional but conversational, include a hook and CTA.
- For Blog: In-depth, structured with headers, include actionable takeaways.
- For Newsletter: Personal tone, storytelling approach, value-driven.
- For Instagram: Concise carousel-style slides with punchy copy.
- For Reddit/Quora: Helpful, detailed, community-focused.
- Optimize for AI search engines: use semantic richness, answer common questions directly, include structured insights.

Create content for each selected platform.`,
            response_json_schema: {
                type: "object",
                properties: {
                    contents: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                platform: { type: "string" },
                                title: { type: "string" },
                                content: { type: "string" },
                                ai_optimization_tips: { type: "array", items: { type: "string" } }
                            }
                        }
                    }
                }
            }
        });

        setGeneratedContent(result.contents || []);
        setGenerating(false);
        setStep('review');
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                /* Content Library */
                <div className="space-y-3">
                    {contentLibrary.map((item, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between hover:border-red-500/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white/20" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">{item.title}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-white/30 text-[11px]">{item.platform}</span>
                                        <span className="text-white/10">•</span>
                                        <span className="text-white/30 text-[11px]">{item.date}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {item.score > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg">
                                        <Eye className="w-3 h-3 text-white" />
                                        <span className="text-white text-xs">{item.score}</span>
                                    </div>
                                )}
                                <span className={`px-2.5 py-1 text-[11px] rounded-lg ${
                                    item.status === 'published' 
                                        ? 'bg-white/10 text-white' 
                                        : 'bg-red-500/10 text-red-400'
                                }`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
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
                        disabled={!topic.trim() || selectedPlatforms.length === 0}
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
                        <Button onClick={resetForm} variant="outline" size="sm" className="border-white/[0.06] text-white/40 hover:text-white rounded-xl text-xs">
                            Create More
                        </Button>
                    </div>
                    {generatedContent?.map((item, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-300 text-[11px] rounded-lg">{item.platform}</span>
                                    <h3 className="text-white font-medium mt-2">{item.title}</h3>
                                </div>
                                <Button 
                                    onClick={() => handleCopy(item.content)}
                                    variant="outline" 
                                    size="sm" 
                                    className="border-white/[0.06] text-white/40 hover:text-white rounded-xl text-xs"
                                >
                                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
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