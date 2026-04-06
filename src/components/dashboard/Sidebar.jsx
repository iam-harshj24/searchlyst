import React, { useState, useCallback } from 'react';
import {
    LayoutDashboard, Bot, Eye, BarChart3, Compass, PenTool,
    Activity, UserCircle, TrendingUp, User, LogOut,
    FileSearch, Globe, Swords, Terminal, Bell, Users,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import ProjectSwitcher from './ProjectSwitcher';

const SIDEBAR_COLLAPSED_KEY = 'searchlyst_sidebar_collapsed';

const menuSections = [
    {
        items: [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'brand-hub', label: 'Brand Hub', icon: UserCircle },
            { id: 'actions', label: 'Actions', icon: Bell },
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
            { id: 'competitive-intel', label: 'Competitive Intent', icon: Swords },
            { id: 'competitors', label: 'Competitors', icon: Users },
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

export default function Sidebar({ activeTab, onTabChange, user, authUser, userRole, projects, activeProject, onProjectSwitch, onAddProject, onLogout, scanActive, auditActive }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
        } catch {
            return false;
        }
    });

    const toggleCollapsed = useCallback(() => {
        setCollapsed((c) => {
            const next = !c;
            try {
                localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
            } catch { /* ignore */ }
            return next;
        });
    }, []);

    return (
        <div className={`${collapsed ? 'w-[4.25rem]' : 'w-60'} shrink-0 bg-[#0B0B0B] border-r border-[#222] h-screen flex flex-col transition-all duration-300`}>
            {/* Logo + collapse */}
            <div className={`h-[93px] border-b border-[#222] flex items-center gap-2 shrink-0 ${collapsed ? 'px-2 justify-center flex-col' : 'px-4'}`}>
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-[#1A1A1A] transition-colors shrink-0 border border-transparent hover:border-[#2a2a2a]"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" strokeWidth={2} /> : <ChevronLeft className="w-5 h-5" strokeWidth={2} />}
                </button>
                {!collapsed && (
                    <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                        <img src="/searchlyst_logo.png" alt="Searchlyst" className="w-[120px] h-auto object-contain" />
                        <span className="bg-[#1e0a0a] text-[#E92A15] text-[10px] uppercase font-bold tracking-[0.1em] px-2 py-0.5 rounded border border-[#bb2525]/20">BETA</span>
                    </div>
                )}
            </div>

            {/* Project Switcher */}
            {!collapsed && (
                <div className="px-4 pt-5">
                    <ProjectSwitcher
                        projects={projects || []}
                        activeProject={activeProject}
                        onSwitch={onProjectSwitch}
                        onAddNew={onAddProject}
                    />
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-5 px-3">
                {menuSections.map((section, si) => (
                    <div key={si} className={si > 0 ? 'mt-6' : ''}>
                        {section.label && !collapsed && (
                            <div className="px-3 mb-3">
                                <span className="text-[10px] text-[#555] uppercase tracking-[0.1em] font-bold">{section.label}</span>
                            </div>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            const showScanDot = (item.id === 'ai-visibility' && scanActive) || (item.id === 'audit-health' && auditActive);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[14px] rounded-xl mb-0.5 transition-all duration-200 ${isActive
                                        ? 'text-white font-medium bg-[#111]'
                                        : 'text-[#888] hover:text-white hover:bg-[#1A1A1A]'
                                        }`}
                                    title={collapsed ? item.label : ''}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-[#E92A15]' : ''}`} />
                                        {showScanDot && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <span className="flex-1 text-left">{item.roleLabels?.[userRole] || item.label}</span>
                                    )}
                                    {isActive && !collapsed && !item.badge && (
                                        <div className="ml-auto w-[3px] h-4 rounded-full bg-[#E92A15]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User */}
            <div className="p-3 border-t border-[#222]">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#1A1A1A] transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full border border-[#444] bg-[#222] flex items-center justify-center">
                        <User className="w-4 h-4 text-[#aaa]" />
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-[13px] font-medium truncate">{user?.name || user?.full_name || authUser?.name || 'User'}</p>
                            </div>
                            <button
                                onClick={() => onLogout?.()}
                                className="text-[#666] hover:text-white transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}