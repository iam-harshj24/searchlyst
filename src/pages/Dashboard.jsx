import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OverviewPage from '@/components/dashboard/OverviewPage';
import BrandHubPage from '@/components/dashboard/BrandHubPage';
import TopicDiscoveryPage from '@/components/dashboard/TopicDiscoveryPage';
import ContentStudioPage from '@/components/dashboard/ContentStudioPage';
import AIVisibilityPage from '@/components/dashboard/AIVisibilityPage';
import AuditHealthPage from '@/components/dashboard/AuditHealthPage';
import SentimentGeoPage from '@/components/dashboard/SentimentGeoPage';
import CompetitiveIntelPage from '@/components/dashboard/CompetitiveIntelPage';
import PromptIntelPage from '@/components/dashboard/PromptIntelPage';
import AgentPage from '@/components/dashboard/AgentPage';
import Sidebar from '@/components/dashboard/Sidebar';
import OnboardingFlow from '@/components/dashboard/OnboardingFlow';
import EmptyProjectState from '@/components/dashboard/EmptyProjectState';
import { ThemeProvider } from '@/lib/ThemeContext';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';

const STORAGE_KEYS = {
    USER: 'searchlyst_user',
};

export function getDashboardUser() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
    } catch { return null; }
}

export function setDashboardUser(data) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/*  useScanManager — persistent background scan polling               */
/* ------------------------------------------------------------------ */
function useScanManager(user) {
    const [scanId, setScanId] = useState(null);
    const [scanStatus, setScanStatus] = useState('idle');         // idle | scanning | completed | failed
    const [scanResult, setScanResult] = useState(null);
    const [scanPhase, setScanPhase] = useState('');
    const [scanPhaseDetail, setScanPhaseDetail] = useState('');
    const [scanProgress, setScanProgress] = useState({ completed: 0, total: 0 });
    const [completedPrompts, setCompletedPrompts] = useState(0);
    const [totalPrompts, setTotalPrompts] = useState(0);
    const [scanError, setScanError] = useState(null);
    const pollRef = useRef(null);

    const domain = user?.domain || '';
    const storageKey = `searchlyst_visibility_${domain || 'default'}`;
    const activeScanKey = `searchlyst_active_scan_${domain}`;

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    // Poll for scan status
    const startPolling = useCallback((id) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const res = await apiClient.visibility.getScanStatus(id);
                if (res.phase) setScanPhase(res.phase);
                if (res.phaseDetail) setScanPhaseDetail(res.phaseDetail);
                if (res.progress) setScanProgress(res.progress);
                if (res.completedPrompts != null) setCompletedPrompts(res.completedPrompts);
                if (res.totalPrompts) setTotalPrompts(res.totalPrompts);
                if (res.result) setScanResult(res.result);
                if (res.status === 'completed') {
                    setScanStatus('completed');
                    if (res.result) {
                        localStorage.setItem(`searchlyst_visibility_${domain || 'default'}`, JSON.stringify(res.result));
                    }
                    localStorage.removeItem(`searchlyst_active_scan_${domain}`);
                    stopPolling();
                } else if (res.status === 'failed') {
                    setScanStatus('failed');
                    setScanError(res.error);
                    localStorage.removeItem(`searchlyst_active_scan_${domain}`);
                    stopPolling();
                }
            } catch { }
        }, 3000);
    }, [stopPolling, domain]);

    // Cleanup on unmount
    useEffect(() => () => stopPolling(), [stopPolling]);

    // On mount: load cached result or resume active scan
    useEffect(() => {
        if (!domain) return;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed) { setScanResult(parsed); setScanStatus('completed'); }
            } catch { }
        }
        try {
            const active = JSON.parse(localStorage.getItem(activeScanKey));
            if (active?.scanId) {
                setScanId(active.scanId);
                setScanStatus('scanning');
                setScanPhase('initializing');
                setScanPhaseDetail('Resuming scan...');
                startPolling(active.scanId);
            }
        } catch { }
    }, [domain, storageKey, activeScanKey, startPolling]);

    // Start a new scan
    const startScan = useCallback(async () => {
        if (!user?.domain) return;
        setScanStatus('scanning'); setScanResult(null); setScanError(null);
        setScanPhase('initializing'); setScanPhaseDetail('Starting...');
        setScanProgress({ completed: 0, total: 0 }); setCompletedPrompts(0); setTotalPrompts(0);
        localStorage.removeItem(storageKey);
        try {
            const comps = (user?.competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
            const res = await apiClient.visibility.startScan({
                brandName: user?.brandName || '', domain: user?.domain || '', industry: user?.industry || '',
                competitors: comps, location: user?.location || '', language: user?.language || 'English',
                country: user?.location?.toLowerCase().includes('india') ? 'IN' : '',
            });
            setScanId(res.scanId);
            localStorage.setItem(activeScanKey, JSON.stringify({ scanId: res.scanId, startedAt: new Date().toISOString() }));
            startPolling(res.scanId);
        } catch (err) { setScanStatus('failed'); setScanError(err.message); }
    }, [user, storageKey, activeScanKey, startPolling]);

    return {
        scanId, scanStatus, scanResult, scanPhase, scanPhaseDetail,
        scanProgress, completedPrompts, totalPrompts, scanError,
        startScan, stopPolling,
    };
}

function DashboardInner() {
    const navigate = useNavigate();
    const { isAuthenticated, signInAnonymously } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showAddProjectOnboarding, setShowAddProjectOnboarding] = useState(false);
    const [userRole, setUserRole] = useState('founder');

    // Scan manager — lives at Dashboard level so polling persists across tab switches
    const scanManager = useScanManager(user);

    const fetchProjects = async () => {
        try {
            const response = await apiClient.projects.list();
            if (response.success) {
                const mapped = response.projects.map(p => ({
                    ...p,
                    name: p.brandName,
                    url: p.domain,
                    visibility_score: 0,
                    total_citations: 0,
                    sentiment: 0,
                    issues_count: 0
                }));
                setProjects(mapped);
                return mapped;
            }
        } catch (error) {
            console.error('Fetch projects failed:', error);
        }
        return [];
    };

    useEffect(() => {
        const loadInitialData = async () => {
            if (!isAuthenticated && !localStorage.getItem('authToken')) {
                const res = await signInAnonymously();
                if (!res.success) {
                    setLoading(false);
                    return;
                }
            }

            const userData = getDashboardUser();
            if (!userData?.onboarded) {
                setShowOnboarding(true);
            } else {
                setUser(userData);
                setUserRole(userData.role_type || 'founder');
            }

            const loadedProjects = await fetchProjects();
            if (loadedProjects.length > 0) {
                setActiveProject(loadedProjects[0]);
            }

            setLoading(false);
        };

        loadInitialData();
    }, [isAuthenticated, signInAnonymously]);

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setActiveTab('overview');
    };

    const handleAddProjectComplete = async (role) => {
        setShowAddProjectOnboarding(false);
        const loadedProjects = await fetchProjects();
        if (loadedProjects.length > 0) {
            setActiveProject(loadedProjects[loadedProjects.length - 1]);
        }
        setActiveTab('overview');
    };

    const handleOnboardingComplete = (role) => {
        setUserRole(role);
        setShowOnboarding(false);
        const userData = getDashboardUser();
        setUser(userData);
        fetchProjects().then(loaded => {
            if (loaded.length > 0) setActiveProject(loaded[0]);
        });
    };

    const handleLogout = () => {
        localStorage.removeItem(STORAGE_KEYS.USER);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-white text-lg">&#10022;</span>
                </div>
            </div>
        );
    }

    if (showOnboarding) {
        return <OnboardingFlow onComplete={handleOnboardingComplete} mode="firstTime" />;
    }

    if (showAddProjectOnboarding) {
        return <OnboardingFlow onComplete={handleAddProjectComplete} mode="addProject" />;
    }

    const renderContent = () => {
        if (activeTab === 'brand-hub') return <BrandHubPage user={user} />;
        if (activeTab === 'agent') return <AgentPage user={user} />;

        if (!activeProject) {
            return <EmptyProjectState onAddProject={() => setShowAddProjectOnboarding(true)} />;
        }

        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={projects} activeProject={activeProject} onAddDomain={() => setShowAddProjectOnboarding(true)} onTabChange={setActiveTab} userRole={userRole} user={user} scanManager={scanManager} />;
            case 'topic-discovery':
                return <TopicDiscoveryPage onTabChange={setActiveTab} user={user} />;
            case 'content-studio':
                return <ContentStudioPage user={user} />;
            case 'ai-visibility':
                return <AIVisibilityPage user={user} scanManager={scanManager} />;
            case 'competitive-intel':
                return <CompetitiveIntelPage user={user} onTabChange={setActiveTab} />;
            case 'sentiment-geo':
                return <SentimentGeoPage user={user} />;
            case 'audit-health':
                return <AuditHealthPage user={user} />;
            case 'prompt-intel':
                return <PromptIntelPage user={user} />;
            default:
                return <OverviewPage domains={projects} activeProject={activeProject} onAddDomain={() => setShowAddProjectOnboarding(true)} onTabChange={setActiveTab} userRole={userRole} user={user} scanManager={scanManager} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={user}
                userRole={userRole}
                projects={projects}
                activeProject={activeProject}
                onProjectSwitch={handleProjectSwitch}
                onAddProject={() => setShowAddProjectOnboarding(true)}
                onLogout={handleLogout}
                scanActive={scanManager.scanStatus === 'scanning'}
            />
            <div className="flex-1 overflow-auto">
                {activeProject && activeTab !== 'brand-hub' && activeTab !== 'agent' && (
                    <div className="border-b border-[var(--border)] px-6 py-3 flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-600/20 rounded-md flex items-center justify-center">
                            <span className="text-red-400 text-[10px] font-bold">{activeProject.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="text-[var(--text-primary)] text-sm font-medium">{activeProject.name}</span>
                        <span className="text-[var(--text-muted)] text-xs">&middot;</span>
                        <span className="text-[var(--text-muted)] text-xs">{activeProject.url}</span>
                        {scanManager.scanStatus === 'scanning' && (
                            <div className="ml-auto flex items-center gap-2 text-xs text-purple-400 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-purple-500 scan-pulse" />
                                Scanning...
                            </div>
                        )}
                    </div>
                )}
                <div className="p-6 page-transition">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <ThemeProvider>
            <DashboardInner />
        </ThemeProvider>
    );
}
