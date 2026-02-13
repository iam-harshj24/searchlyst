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
import { base44 } from '@/api/base44Client';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [domains, setDomains] = useState([]);
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [userRole, setUserRole] = useState('founder');

    useEffect(() => {
        loadUser();
        loadDomains();
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

    const loadDomains = async () => {
        const data = await base44.entities.Domain.list();
        setDomains(data);
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
        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={domains} onAddDomain={() => setShowAddDomain(true)} onTabChange={setActiveTab} userRole={userRole} user={user} />;
            case 'brand-hub':
                return <BrandHubPage />;
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
            case 'agent':
                return <AgentPage />;
            default:
                return <OverviewPage domains={domains} onAddDomain={() => setShowAddDomain(true)} onTabChange={setActiveTab} userRole={userRole} user={user} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                user={user}
                userRole={userRole}
            />
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
            <AddDomainModal 
                open={showAddDomain} 
                onClose={() => setShowAddDomain(false)}
                onSuccess={loadDomains}
            />
        </div>
    );
}