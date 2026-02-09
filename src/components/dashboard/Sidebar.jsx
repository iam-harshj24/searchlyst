import React from 'react';
import { 
    LayoutDashboard, 
    Bot, 
    Eye, 
    AtSign, 
    Link2, 
    BarChart3,
    MessageSquare,
    Search,
    FileText,
    Activity,
    AlertTriangle,
    BookOpen,
    ChevronDown,
    User
} from 'lucide-react';

const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'agent', label: 'Agent', icon: Bot },
    { type: 'divider', label: 'Analytics' },
    { id: 'ai-visibility', label: 'Visibility', icon: Eye },
    { id: 'mentions', label: 'Mentions', icon: AtSign },
    { id: 'sources', label: 'Sources', icon: Link2 },
    { id: 'traffic', label: 'Traffic', icon: BarChart3 },
    { type: 'divider', label: 'Prompts' },
    { id: 'prompts', label: 'Your Prompts', icon: MessageSquare },
    { id: 'research', label: 'Prompt Research', icon: Search },
    { type: 'divider', label: 'Content' },
    { id: 'content', label: 'Articles', icon: FileText },
    { type: 'divider', label: 'On-Page' },
    { id: 'technical', label: 'Site Health', icon: Activity },
    { id: 'faq', label: 'Issues', icon: AlertTriangle },
];

export default function Sidebar({ activeTab, onTabChange, user }) {
    return (
        <div className="w-56 bg-[var(--bg-secondary)] border-r border-[var(--border)] h-screen flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <span className="text-[var(--text-primary)] font-semibold">AI Visibility</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                {menuItems.map((item, i) => {
                    if (item.type === 'divider') {
                        return (
                            <div key={i} className="px-4 py-2 mt-4 first:mt-0">
                                <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{item.label}</span>
                            </div>
                        );
                    }

                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                isActive 
                                    ? 'bg-red-500/10 text-red-500 border-r-2 border-red-500' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Knowledge Base */}
            <div className="p-4 border-t border-[var(--border)]">
                <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <BookOpen className="w-4 h-4" />
                    Knowledge Base
                </button>
            </div>

            {/* User */}
            <div className="p-4 border-t border-[var(--border)]">
                <button className="w-full flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-[var(--text-primary)] flex-1 text-left truncate">
                        {user?.full_name || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
            </div>
        </div>
    );
}