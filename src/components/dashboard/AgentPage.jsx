import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, FileText, Sparkles, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function AgentPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [webSearch, setWebSearch] = useState(true);
    const [agentKnowledge, setAgentKnowledge] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        initConversation();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const initConversation = async () => {
        try {
            const conversation = await base44.agents.createConversation({
                agent_name: "dashboard_assistant",
                metadata: { name: "AI Assistant Chat" }
            });
            setConversationId(conversation.id);
        } catch (error) {
            console.error('Failed to init conversation:', error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const conversation = await base44.agents.getConversation(conversationId);
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: userMessage
            });

            const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
                if (data.messages && data.messages.length > 0) {
                    const lastMessage = data.messages[data.messages.length - 1];
                    if (lastMessage.role === 'assistant') {
                        setMessages(prev => {
                            const filtered = prev.filter(m => !(m.role === 'assistant' && m.isStreaming));
                            return [...filtered, { ...lastMessage, isStreaming: !lastMessage.content }];
                        });
                        if (lastMessage.content) {
                            setIsLoading(false);
                        }
                    }
                }
            });

            setTimeout(() => {
                unsubscribe();
                setIsLoading(false);
            }, 60000);

        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Sorry, I encountered an error. Please try again." 
            }]);
            setIsLoading(false);
        }
    };

    const quickActions = [
        { icon: Sparkles, label: "Optimize for AI search", prompt: "Help me optimize my content for better AI search visibility" },
        { icon: FileText, label: "Draft content in my style", prompt: "Help me draft a LinkedIn post in my writing style about " },
        { icon: Search, label: "Find trending topics", prompt: "What are the top trending topics in my industry right now?" },
        { icon: Search, label: "Audit my website", prompt: "Run a quick analysis on my website and suggest improvements" },
    ];

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-white mb-2">
                            {getGreeting()}!
                        </h1>
                        <p className="text-white/40 text-center mb-8">
                            Ask about your content, analytics, audits, or get writing help.
                        </p>

                        {/* Input Area - Centered */}
                        <div className="w-full max-w-xl mb-8">
                            <div className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about content, audits, visibility, or writing help..."
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 pr-12 h-12 rounded-xl"
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
                                    <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-red-500' : 'bg-white/[0.06]'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-white/40">Web search</span>
                                </button>
                                <button 
                                    onClick={() => setAgentKnowledge(!agentKnowledge)}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${agentKnowledge ? 'bg-red-500' : 'bg-white/[0.06]'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${agentKnowledge ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-white/40">Agent knowledge</span>
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
                                        className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-left hover:border-red-500/20 transition-all group"
                                    >
                                        <action.icon className="w-5 h-5 text-white/20 group-hover:text-red-400 mb-2" />
                                        <p className="text-sm text-white/70">{action.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto py-6 space-y-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    msg.role === 'user' ? 'bg-red-600' : 'bg-white/[0.03] border border-white/[0.06]'
                                }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-red-400" />}
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-xl ${
                                    msg.role === 'user' 
                                        ? 'bg-red-500/10 border border-red-500/20 text-white' 
                                        : 'bg-white/[0.03] border border-white/[0.06] text-white/80'
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
                                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl">
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
                <div className="border-t border-white/[0.06] p-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Send a message..."
                                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 pr-12 h-12 rounded-xl"
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
                                <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-purple-500' : 'bg-white/[0.06]'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-3' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-white/40">Web search</span>
                            </button>
                            <button 
                                onClick={() => setAgentKnowledge(!agentKnowledge)}
                                className="flex items-center gap-2 text-sm"
                            >
                                <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${agentKnowledge ? 'bg-purple-500' : 'bg-white/[0.06]'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${agentKnowledge ? 'translate-x-3' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-white/40">Agent knowledge</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}