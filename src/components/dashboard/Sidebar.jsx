import React, { useState } from 'react';
import {
    LayoutDashboard, Bot, Eye, BarChart3, Compass, PenTool,
    Activity, UserCircle, TrendingUp, User, LogOut,
    FileSearch, Globe, Zap, Sun, Moon, Swords, Terminal
} from 'lucide-react';
import ProjectSwitcher from './ProjectSwitcher';
import { useTheme } from '@/lib/ThemeContext';

const menuSections = [
    {
        items: [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'brand-hub', label: 'Brand Hub', icon: UserCircle },
        ]
    },
    {
        label: 'Create',
        items: [
            { id: 'topic-discovery', label: 'Topic Discovery', icon: Compass },
            { id: 'content-studio', label: 'Content Studio', icon: PenTool },
        ]
    },
    {
        label: 'Analyze',
        items: [
            { id: 'ai-visibility', label: 'AI Visibility', icon: Eye },
            { id: 'competitive-intel', label: 'Competitive Intel', icon: Swords, badge: 'Soon' },
            { id: 'sentiment-geo', label: 'Sentiment & Geo', icon: Globe },
            { id: 'audit-health', label: 'Audits & Health', icon: FileSearch },
            { id: 'prompt-intel', label: 'Prompt Intelligence', icon: Terminal },
        ]
    },
    {
        label: 'Assist',
        items: [
            { id: 'agent', label: 'AI Assistant', icon: Bot },
        ]
    },
];

export default function Sidebar({ activeTab, onTabChange, user, userRole, projects, activeProject, onProjectSwitch, onAddProject, onLogout, scanActive }) {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <div className={`${collapsed ? 'w-16' : 'w-60'} bg-[var(--bg-primary)] border-r border-[var(--border)] h-screen flex flex-col transition-all duration-300`}>
            {/* Logo */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <img src="/searchlyst_logo.png" alt="Searchlyst" className="w-9 h-9 object-contain" />
                    {!collapsed && (
                        <div className="flex-1">
                            <span className="text-[var(--text-primary)] font-semibold text-sm tracking-tight">Searchlyst</span>
                            <span className="text-red-400 text-[10px] block -mt-0.5 font-medium">PRO</span>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-secondary)] hover-scale"
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Project Switcher */}
            {!collapsed && (
                <div className="px-3 pt-3">
                    <ProjectSwitcher
                        projects={projects || []}
                        activeProject={activeProject}
                        onSwitch={onProjectSwitch}
                        onAddNew={onAddProject}
                    />
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {menuSections.map((section, si) => (
                    <div key={si} className={si > 0 ? 'mt-5' : ''}>
                        {section.label && !collapsed && (
                            <div className="px-3 mb-2">
                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.15em] font-semibold">{section.label}</span>
                            </div>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            const showScanDot = item.id === 'ai-visibility' && scanActive;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-xl mb-0.5 transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-red-500/15 to-red-600/10 text-[var(--text-primary)] shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                                        }`}
                                    title={collapsed ? item.label : ''}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-red-400' : ''}`} />
                                        {showScanDot && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 scan-pulse" />
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <span className="font-medium flex-1 text-left">{item.roleLabels?.[userRole] || item.label}</span>
                                    )}
                                    {item.badge && !collapsed && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                            {item.badge}
                                        </span>
                                    )}
                                    {isActive && !collapsed && !item.badge && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Upgrade Banner */}
            {!collapsed && (
                <div className="mx-3 mb-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl hover-lift cursor-pointer">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[var(--text-primary)] text-xs font-medium">Pro Plan</span>
                    </div>
                    <p className="text-[var(--text-muted)] text-[10px] leading-relaxed">Unlimited content generation & advanced analytics</p>
                </div>
            )}

            {/* User */}
            <div className="p-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--text-primary)]" />
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-[var(--text-primary)] text-xs font-medium truncate">{user?.full_name || 'User'}</p>
                                <p className="text-[var(--text-muted)] text-[10px] truncate">{user?.email || ''}</p>
                            </div>
                            <button
                                onClick={() => onLogout?.()}
                                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}