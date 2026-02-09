import React, { useState, useEffect } from 'react';
import { FileText, Clock, Globe, CheckCircle, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";

export default function OverviewPage({ domains, onAddDomain }) {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const totalArticles = 2;
    const hoursSaved = 6.0;
    const activeProjects = domains.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">✦</span>
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{getGreeting()}!</h1>
                    <p className="text-[var(--text-secondary)]">Here's a quick overview of what's happened in the last 30 days.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
                        <FileText className="w-4 h-4" />
                        ARTICLES PUBLISHED
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{totalArticles}</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">1,523 words written across {activeProjects} active projects.</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
                        <Clock className="w-4 h-4" />
                        HOURS SAVED
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{hoursSaved}h</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Estimated time saved on research, drafting, and optimization tasks.</p>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mb-2">
                        <Globe className="w-4 h-4" />
                        ACTIVE PROJECTS
                    </div>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{activeProjects}</p>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Total domains currently being tracked and optimized for AI search.</p>
                </div>
            </div>

            {/* Projects Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Projects</h2>
                    <span className="text-sm text-[var(--text-secondary)]">{domains.length} domains tracked</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {domains.map((domain) => (
                        <div key={domain.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-5 hover:border-red-500/30 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--text-primary)] font-medium truncate">{domain.name}</p>
                                    <p className="text-[var(--text-secondary)] text-xs truncate">{domain.url}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Visibility</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[var(--text-primary)] font-medium">{domain.visibility_score || 0}%</span>
                                        {domain.visibility_score > 50 ? (
                                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 text-red-400" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Articles created</span>
                                    <span className="text-[var(--text-primary)]">0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Hours saved</span>
                                    <span className="text-[var(--text-primary)]">0.0h</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-secondary)]">Open issues</span>
                                    {domain.issues_count === 0 ? (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> All clear
                                        </span>
                                    ) : (
                                        <span className="text-amber-400">{domain.issues_count} issues</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Project Card */}
                    <button 
                        onClick={onAddDomain}
                        className="bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] rounded-xl p-5 hover:border-red-500/50 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
                    >
                        <div className="w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl flex items-center justify-center mb-3 group-hover:border-red-500/30">
                            <Plus className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-red-500" />
                        </div>
                        <p className="text-[var(--text-secondary)] group-hover:text-red-500">Add new project</p>
                    </button>
                </div>
            </div>
        </div>
    );
}