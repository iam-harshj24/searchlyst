import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, FileText, Sparkles, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';

export default function AgentPage({ user }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [webSearch, setWebSearch] = useState(true);
    const [agentKnowledge, setAgentKnowledge] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 1500));

        // PROMPT 12 — Agent Page Demo Response (Enhanced)
        const preview = userMessage.slice(0, 80) + (userMessage.length > 80 ? '...' : '');
        const competitorCount = user?.competitors?.length || 0;
        const demoContent = `Great question about "${preview}"\n\nI can definitely help with that. Here's a preview of what I know about your brand:\n\n🏢 **${user?.brandName || 'Your Brand'}** | ${user?.domain || 'your-domain.com'}\n📍 ${user?.location || 'Global market'} | ${user?.industry || 'your industry'}\n🎯 ${competitorCount} competitor${competitorCount !== 1 ? 's' : ''} being tracked\n\nWhen fully connected, I can help you with:\n• Content strategies tailored to ${user?.industry || 'your industry'} trends\n• AI search visibility improvements for ${user?.brandName || 'your brand'}\n• Real-time competitor monitoring and alerts\n• Website audits and citation-gap analysis\n\n👉 To unlock live AI responses, connect an API key in **Settings → AI Configuration**. It takes under 2 minutes.`;

        setMessages(prev => [...prev, {
            role: 'assistant',
            content: demoContent
        }]);
        setIsLoading(false);
    };

    const brandName = user?.brandName || 'my brand';
    const industry = user?.industry || 'my industry';
    // PROMPT 11 — Agent Page Quick Actions (Enhanced)
    const quickActions = [
        {
            icon: Sparkles,
            label: "Optimize for AI search",
            prompt: `You are an AI search visibility expert. Analyze what content strategy "${brandName}" should execute to appear more often in AI assistant responses in the "${industry}" space. Give me 5 specific, actionable recommendations.`
        },
        {
            icon: FileText,
            label: "Draft LinkedIn post",
            prompt: `Write a compelling LinkedIn post for "${brandName}" about a current trend in the "${industry}" industry. The post should be 150–200 words, start with a bold hook, and end with a question to drive engagement. Avoid corporate jargon.`
        },
        {
            icon: Search,
            label: "Find trending topics",
            prompt: `What are the top 5 trending topics in the "${industry}" industry right now that "${brandName}" should be creating content about? For each topic, explain why it's trending and suggest one content angle.`
        },
        {
            icon: Search,
            label: "Audit my website",
            prompt: `Perform a quick AI search visibility audit for "${user?.domain || (brandName + '.com')}". Identify: (1) whether the site is likely indexed by AI crawlers, (2) what topics it appears authoritative on, and (3) three specific improvements to increase AI citation likelihood.`
        },
    ];

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                            <Bot className="w-8 h-8 text-[var(--text-primary)]" />
                        </div>
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                            {getGreeting()}!
                        </h1>
                        <p className="text-[var(--text-secondary)] text-center mb-8">
                            {user?.brandName
                                ? `I'm your AI assistant for ${user.brandName}. Ask about content, analytics, or audits.`
                                : 'Ask about your content, analytics, audits, or get writing help.'}
                        </p>

                        {/* Input Area - Centered */}
                        <div className="w-full max-w-xl mb-8">
                            <div className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about content, audits, visibility, or writing help..."
                                    className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] pr-12 h-12 rounded-xl"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 h-8 w-8 rounded-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Toggles */}
                            <div className="flex items-center gap-6 mt-4 justify-center">
                                <button
                                    onClick={() => setWebSearch(!webSearch)}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-red-500' : 'bg-[var(--surface-active)]'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-[var(--text-secondary)]">Web search</span>
                                </button>
                                <button
                                    onClick={() => setAgentKnowledge(!agentKnowledge)}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${agentKnowledge ? 'bg-red-500' : 'bg-[var(--surface-active)]'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${agentKnowledge ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-[var(--text-secondary)]">Agent knowledge</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="w-full max-w-2xl">
                            <p className="text-[var(--text-secondary)] text-sm mb-3">Get started:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {quickActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(action.prompt)}
                                        className="p-4 bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-left hover:border-red-500/20 transition-all group"
                                    >
                                        <action.icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-red-400 mb-2" />
                                        <p className="text-sm text-[var(--text-primary)]">{action.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto py-6 space-y-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-red-600' : 'bg-[var(--surface-hover)] border border-[var(--border)]'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-[var(--text-primary)]" /> : <Bot className="w-5 h-5 text-red-400" />}
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user'
                                        ? 'bg-red-500/10 border border-red-500/20 text-[var(--text-primary)]'
                                        : 'bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)]'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-sm">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="bg-[var(--surface-hover)] border border-[var(--border)] p-4 rounded-xl">
                                    <Loader2 className="w-5 h-5 animate-spin text-red-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Bottom Input - Only show when there are messages */}
            {messages.length > 0 && (
                <div className="border-t border-[var(--border)] p-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Send a message..."
                                    className="bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] pr-12 h-12 rounded-xl"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 h-8 w-8 rounded-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                            <button
                                onClick={() => setWebSearch(!webSearch)}
                                className="flex items-center gap-2 text-sm"
                            >
                                <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-red-500' : 'bg-[var(--surface-active)]'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-3' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-[var(--text-secondary)]">Web search</span>
                            </button>
                            <button
                                onClick={() => setAgentKnowledge(!agentKnowledge)}
                                className="flex items-center gap-2 text-sm"
                            >
                                <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${agentKnowledge ? 'bg-red-500' : 'bg-[var(--surface-active)]'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${agentKnowledge ? 'translate-x-3' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-[var(--text-secondary)]">Agent knowledge</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}