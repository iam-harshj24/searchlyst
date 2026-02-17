import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { apiClient } from '@/api/apiClient';

const VALID_TABS = ['overview', 'brand-hub', 'topic-discovery', 'content-studio', 'ai-visibility', 'sentiment-geo', 'audit-health', 'agent'];
const ACTIVE_PROJECT_KEY = 'searchlyst_active_project_id';

export default function Dashboard() {
    const { tab: tabParam } = useParams();
    const navigate = useNavigate();
    const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'overview';
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [userRole, setUserRole] = useState('founder');
    const [contentStudioInitialData, setContentStudioInitialData] = useState(null);

    useEffect(() => {
        loadUser();
        loadProjects();
    }, []);

    // Redirect invalid tab to overview
    useEffect(() => {
        if (tabParam && !VALID_TABS.includes(tabParam)) {
            navigate('/Dashboard', { replace: true });
        }
    }, [tabParam, navigate]);

    const handleTabChange = (tab) => {
        const target = VALID_TABS.includes(tab) ? tab : 'overview';
        if (target === 'overview') {
            navigate('/Dashboard');
        } else {
            navigate(`/Dashboard/${target}`);
        }
    };

    const loadUser = async () => {
        const userData = await apiClient.auth.me();
        setUser(userData);
        if (!userData?.onboarded) {
            setShowOnboarding(true);
        } else {
            setUserRole(userData.role_type || 'founder');
        }
        setLoading(false);
    };

    const loadProjects = async () => {
        const data = await apiClient.domains.list();
        setProjects(data);
        if (data.length > 0) {
            const savedId = localStorage.getItem(ACTIVE_PROJECT_KEY);
            const restored = savedId ? data.find((p) => String(p.id) === savedId) : null;
            setActiveProject(restored || data[0]);
        }
    };

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        localStorage.setItem(ACTIVE_PROJECT_KEY, String(project.id));
        handleTabChange('overview');
    };

    const handleProjectAdded = async () => {
        const data = await apiClient.domains.list();
        setProjects(data);
        if (data.length > 0) {
            const newest = data[data.length - 1];
            setActiveProject(newest);
            localStorage.setItem(ACTIVE_PROJECT_KEY, String(newest.id));
        }
    };

    const handleOnboardingComplete = async (role) => {
        setUserRole(role);
        setShowOnboarding(false);
        const userData = await apiClient.auth.me();
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
        if (activeTab === 'brand-hub') return <BrandHubPage activeProject={activeProject} onAddProject={() => setShowAddDomain(true)} />;
        if (activeTab === 'agent') return <AgentPage />;

        // Tabs that need an active project
        if (!activeProject) {
            return <EmptyProjectState onAddProject={() => setShowAddDomain(true)} />;
        }

        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={projects} activeProject={activeProject} onAddDomain={() => setShowAddDomain(true)} onTabChange={handleTabChange} userRole={userRole} user={user} />;
            case 'topic-discovery':
                return (
                    <TopicDiscoveryPage
                        onTabChange={handleTabChange}
                        onCreateFromTopic={(topicData) => {
                            setContentStudioInitialData(topicData);
                            handleTabChange('content-studio');
                        }}
                    />
                );
            case 'content-studio':
                return (
                    <ContentStudioPage
                        activeProject={activeProject}
                        initialTopic={contentStudioInitialData?.topic}
                        suggestedPlatformIds={contentStudioInitialData?.suggestedPlatformIds}
                        onConsumeInitialData={() => setContentStudioInitialData(null)}
                    />
                );
            case 'ai-visibility':
                return <AIVisibilityPage activeProject={activeProject} onAddProject={() => setShowAddDomain(true)} />;
            case 'sentiment-geo':
                return <SentimentGeoPage activeProject={activeProject} onAddProject={() => setShowAddDomain(true)} />;
            case 'audit-health':
                return <AuditHealthPage activeProject={activeProject} onAddProject={() => setShowAddDomain(true)} />;
            default:
                return <OverviewPage domains={projects} activeProject={activeProject} onAddDomain={() => setShowAddDomain(true)} onTabChange={handleTabChange} userRole={userRole} user={user} />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-black">
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={handleTabChange}
                user={user}
                userRole={userRole}
                projects={projects}
                activeProject={activeProject}
                onProjectSwitch={handleProjectSwitch}
                onAddProject={() => setShowAddDomain(true)}
            />
            <div className={`flex-1 min-h-0 flex flex-col ${activeTab === 'agent' ? 'overflow-hidden' : 'overflow-auto'}`}>
                {/* Project context bar */}
                {activeProject && activeTab !== 'brand-hub' && activeTab !== 'agent' && (
                    <div className="border-b border-white/[0.06] px-6 py-3 flex items-center gap-3 flex-shrink-0">
                        <div className="w-6 h-6 bg-red-600/20 rounded-md flex items-center justify-center">
                            <span className="text-red-400 text-[10px] font-bold">{activeProject.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="text-white text-sm font-medium">{activeProject.name}</span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/30 text-xs">{activeProject.url}</span>
                    </div>
                )}
                <div className={activeTab === 'agent' ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : 'p-6'}>
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