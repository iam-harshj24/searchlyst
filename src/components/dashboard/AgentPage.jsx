import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, FileText, Sparkles, Search, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from '@/api/apiClient';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const quickActions = [
  { icon: Sparkles, label: "Optimize for AI search", prompt: "Help me optimize my content for better AI search visibility" },
  { icon: FileText, label: "Draft in my style", prompt: "Help me draft a LinkedIn post in my writing style about " },
  { icon: Search, label: "Trending topics", prompt: "What are the top trending topics in my industry right now?" },
  { icon: Zap, label: "Audit my website", prompt: "Run a quick analysis on my website and suggest improvements" },
];

export default function AgentPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const content = await apiClient.chat.send(userMessage, history);
      setMessages(prev => [...prev, { role: 'assistant', content }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to get response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that. Please check your connection and try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-red-400" />
          AI Assistant
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Ask about content, AI search optimization, audits, or get writing help.
        </p>
      </div>

      {/* Messages area - only this scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {getGreeting()}!
              </h2>
              <p className="text-white/50 text-center mb-10 max-w-sm">
                Ask about your content, analytics, audits, or get writing help. I have access to real-time web search.
              </p>

              {/* Quick actions */}
              <div className="w-full max-w-2xl">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Get started</p>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(action.prompt)}
                      className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-left hover:border-red-500/20 hover:bg-red-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                        <action.icon className="w-5 h-5 text-white/30 group-hover:text-red-400" />
                      </div>
                      <p className="text-sm text-white/70 group-hover:text-white font-medium">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-red-600' 
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-red-500/10 border border-red-500/20 text-white'
                      : 'bg-white/[0.03] border border-white/[0.06] text-white/90'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">{children}</a>,
                            code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
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

      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-6 py-4 bg-black">
        <div className="max-w-3xl flex gap-3">
          <div className="flex-1 relative">
            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about content, audits, visibility, or writing help..."
              className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/30 pr-12 h-12 rounded-xl focus-visible:ring-red-500/30"
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
        <p className="text-white/25 text-[10px] mt-2 max-w-3xl">
          Real-time web search enabled
        </p>
      </div>
    </div>
  );
}
