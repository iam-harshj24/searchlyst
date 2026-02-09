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
        { icon: Sparkles, label: "Optimize meta tags", prompt: "Help me optimize meta tags for better AI visibility" },
        { icon: FileText, label: "Generate an FAQ section", prompt: "Generate an FAQ section for my product page" },
        { icon: FileText, label: "Draft a blog post", prompt: "Help me draft a blog post about " },
        { icon: Search, label: "Find content gaps", prompt: "Analyze my content and find gaps that could improve AI citations" },
    ];

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mb-6">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                            {getGreeting()}!
                        </h1>
                        <p className="text-[var(--text-secondary)] text-center mb-8">
                            Want an update or have a question? Just chat below.
                        </p>

                        {/* Input Area - Centered */}
                        <div className="w-full max-w-xl mb-8">
                            <div className="relative">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about analytics or content for improving your data..."
                                    className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] pr-12 h-12 rounded-xl"
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
                                    <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-red-500' : 'bg-[var(--border)]'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-[var(--text-secondary)]">Web search</span>
                                </button>
                                <button 
                                    onClick={() => setAgentKnowledge(!agentKnowledge)}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${agentKnowledge ? 'bg-red-500' : 'bg-[var(--border)]'}`}>
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
                                        className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-left hover:border-red-500/30 transition-colors group"
                                    >
                                        <action.icon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-red-500 mb-2" />
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
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    msg.role === 'user' ? 'bg-red-500' : 'bg-[var(--bg-secondary)] border border-[var(--border)]'
                                }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-red-500" />}
                                </div>
                                <div className={`max-w-[80%] p-4 rounded-xl ${
                                    msg.role === 'user' 
                                        ? 'bg-red-600 text-white' 
                                        : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]'
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
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-4 rounded-xl">
                                    <Loader2 className="w-5 h-5 animate-spin text-red-500" />
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
                                    className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] pr-12 h-12 rounded-xl"
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
                                <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${webSearch ? 'bg-red-500' : 'bg-[var(--border)]'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-3' : 'translate-x-0'}`} />
                                </div>
                                <span className="text-[var(--text-secondary)]">Web search</span>
                            </button>
                            <button 
                                onClick={() => setAgentKnowledge(!agentKnowledge)}
                                className="flex items-center gap-2 text-sm"
                            >
                                <div className={`w-8 h-5 rounded-full flex items-center px-0.5 transition-colors ${agentKnowledge ? 'bg-red-500' : 'bg-[var(--border)]'}`}>
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