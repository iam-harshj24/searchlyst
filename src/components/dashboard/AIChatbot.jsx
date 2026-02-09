import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, FileText, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !conversationId) {
            initConversation();
        }
    }, [isOpen]);

    const initConversation = async () => {
        try {
            const conversation = await base44.agents.createConversation({
                agent_name: "dashboard_assistant",
                metadata: { name: "Dashboard Help" }
            });
            setConversationId(conversation.id);
            setMessages([{
                role: 'assistant',
                content: "Hi! I'm your AI Visibility Assistant. I can help you:\n\n• **Understand your metrics** - explain scores and trends\n• **Fix issues** - troubleshoot visibility problems\n• **Create content** - write AI-optimized articles\n\nHow can I help you today?"
            }]);
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

            // Subscribe to updates
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

            // Cleanup after timeout
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
        { label: "Explain my score", prompt: "Explain my current visibility score and what affects it" },
        { label: "Fix low citations", prompt: "How can I improve my citation rate on AI platforms?" },
        { label: "Create article", prompt: "Help me create an SEO-optimized article about " },
    ];

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full shadow-lg flex items-center justify-center transition-all z-50"
            >
                <MessageSquare className="w-6 h-6 text-white" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-[var(--text-primary)] font-medium">AI Assistant</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Always here to help</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' ? 'bg-red-500' : 'bg-[var(--bg-secondary)]'
                        }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-xl ${
                            msg.role === 'user' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
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
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                            <Bot className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="bg-[var(--bg-secondary)] p-3 rounded-xl">
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(action.prompt)}
                            className="text-xs px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/30 transition-colors"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)]">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]"
                    />
                    <Button 
                        onClick={handleSend} 
                        disabled={isLoading || !input.trim()}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}