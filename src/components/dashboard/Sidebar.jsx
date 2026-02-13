import React, { useState } from 'react';
import { 
    LayoutDashboard, Bot, Eye, BarChart3, Compass, PenTool,
    Activity, UserCircle, TrendingUp, User, LogOut, Sparkles,
    FileSearch, Globe, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProjectSwitcher from './ProjectSwitcher';

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
            { id: 'sentiment-geo', label: 'Sentiment & Geo', icon: Globe },
            { id: 'audit-health', label: 'Audits & Health', icon: FileSearch },
        ]
    },
    {
        label: 'Assist',
        items: [
            { id: 'agent', label: 'AI Assistant', icon: Bot },
        ]
    },
];

export default function Sidebar({ activeTab, onTabChange, user, userRole, projects, activeProject, onProjectSwitch, onAddProject }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`${collapsed ? 'w-16' : 'w-60'} bg-[#030303] border-r border-white/[0.06] h-screen flex flex-col transition-all duration-300`}>
            {/* Logo */}
            <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <span className="text-white font-semibold text-sm tracking-tight">ContentAI</span>
                            <span className="text-red-400 text-[10px] block -mt-0.5 font-medium">PRO</span>
                        </div>
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
                                <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-semibold">{section.label}</span>
                            </div>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-xl mb-0.5 transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-red-500/15 to-red-600/10 text-white shadow-sm' 
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                                    }`}
                                    title={collapsed ? item.label : ''}
                                >
                                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-red-400' : ''}`} />
                                    {!collapsed && <span className="font-medium">{item.roleLabels?.[userRole] || item.label}</span>}
                                    {isActive && !collapsed && (
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
                <div className="mx-3 mb-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-white text-xs font-medium">Pro Plan</span>
                    </div>
                    <p className="text-white/40 text-[10px] leading-relaxed">Unlimited content generation & advanced analytics</p>
                </div>
            )}

            {/* User */}
            <div className="p-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{user?.full_name || 'User'}</p>
                                <p className="text-white/30 text-[10px] truncate">{user?.email || ''}</p>
                            </div>
                            <button 
                                onClick={() => base44.auth.logout()}
                                className="text-white/20 hover:text-white/60 transition-colors"
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