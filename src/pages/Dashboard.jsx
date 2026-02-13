import React, { useState, useEffect } from 'react';
import OverviewPage from '@/components/dashboard/OverviewPage';
import BrandHubPage from '@/components/dashboard/BrandHubPage';
import TopicDiscoveryPage from '@/components/dashboard/TopicDiscoveryPage';
import ContentStudioPage from '@/components/dashboard/ContentStudioPage';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import AuditHealthPage from '@/components/dashboard/AuditHealthPage';
import SentimentGeoPage from '@/components/dashboard/SentimentGeoPage';
import AgentPage from '@/components/dashboard/AgentPage';
import Sidebar from '@/components/dashboard/Sidebar';
import OnboardingFlow from '@/components/dashboard/OnboardingFlow';
import AddDomainModal from '@/components/dashboard/AddDomainModal';
import EmptyProjectState from '@/components/dashboard/EmptyProjectState';
import { base44 } from '@/api/base44Client';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [userRole, setUserRole] = useState('founder');

    useEffect(() => {
        loadUser();
        loadProjects();
    }, []);

    const loadUser = async () => {
        const userData = await base44.auth.me();
        setUser(userData);
        if (!userData?.onboarded) {
            setShowOnboarding(true);
        } else {
            setUserRole(userData.role_type || 'founder');
        }
        setLoading(false);
    };

    const loadProjects = async () => {
        const data = await base44.entities.Domain.list();
        setProjects(data);
        // Auto-select first project or restore last selected
        if (data.length > 0 && !activeProject) {
            setActiveProject(data[0]);
        }
    };

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setActiveTab('overview');
    };

    const handleProjectAdded = async () => {
        const data = await base44.entities.Domain.list();
        setProjects(data);
        // Select the newest project
        if (data.length > 0) {
            setActiveProject(data[data.length - 1]);
        }
    };

    const handleOnboardingComplete = async (role) => {
        setUserRole(role);
        setShowOnboarding(false);
        const userData = await base44.auth.me();
        setUser(userData);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-white text-lg">✦</span>
                </div>
            </div>
        );
    }

    if (showOnboarding) {
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    const renderContent = () => {
        // Global tabs that don't need a project
        if (activeTab === 'brand-hub') return <BrandHubPage />;
        if (activeTab === 'agent') return <AgentPage />;

        // Tabs that need an active project
        if (!activeProject) {
            return <EmptyProjectState onAddProject={() => setShowAddDomain(true)} />;
        }

        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={projects} activeProject={activeProject} onAddDomain={() => setShowAddDomain(true)} onTabChange={setActiveTab} userRole={userRole} user={user} />;
            case 'topic-discovery':
                return <TopicDiscoveryPage onTabChange={setActiveTab} />;
            case 'content-studio':
                return <ContentStudioPage />;
            case 'ai-visibility':
                return <AIVisibilityPage />;
            case 'sentiment-geo':
                return <SentimentGeoPage />;
            case 'audit-health':
                return <AuditHealthPage />;
            default:
                return <OverviewPage domains={projects} activeProject={activeProject} onAddDomain={() => setShowAddDomain(true)} onTabChange={setActiveTab} userRole={userRole} user={user} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                user={user}
                userRole={userRole}
                projects={projects}
                activeProject={activeProject}
                onProjectSwitch={handleProjectSwitch}
                onAddProject={() => setShowAddDomain(true)}
            />
            <div className="flex-1 overflow-auto">
                {/* Project context bar */}
                {activeProject && activeTab !== 'brand-hub' && activeTab !== 'agent' && (
                    <div className="border-b border-white/[0.06] px-6 py-3 flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-600/20 rounded-md flex items-center justify-center">
                            <span className="text-red-400 text-[10px] font-bold">{activeProject.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="text-white text-sm font-medium">{activeProject.name}</span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/30 text-xs">{activeProject.url}</span>
                    </div>
                )}
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
            <AddDomainModal 
                open={showAddDomain} 
                onClose={() => setShowAddDomain(false)}
                onSuccess={handleProjectAdded}
            />
        </div>
    );
}