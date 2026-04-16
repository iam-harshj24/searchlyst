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
import CompetitorsPage from '@/components/dashboard/CompetitorsPage';
import ActionsPage from '@/components/dashboard/ActionsPage';
import AgentPage from '@/components/dashboard/AgentPage';
import Sidebar from '@/components/dashboard/Sidebar';
import OnboardingFlow from '@/components/dashboard/OnboardingFlow';
import EmptyProjectState from '@/components/dashboard/EmptyProjectState';
import { ThemeProvider } from '@/lib/ThemeContext';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import {
    visibilityResultStorageKey,
    activeScanStorageKey,
    auditResultStorageKey,
    activeAuditStorageKey,
    storageUserIdSegment,
    projectsFallbackStorageKey,
    removeLocalStorageForProject,
    removeProjectFromFallbackList,
    readLastVisibilityScanId,
    writeLastVisibilityScanId,
} from '@/lib/visibilityStorageKeys';

const STORAGE_KEYS = {
    USER: 'searchlyst_user',
};

export function getDashboardUser(userId) {
    try {
        const key = userId ? `${STORAGE_KEYS.USER}_${userId}` : STORAGE_KEYS.USER;
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data);
        if (userId) {
            const legacy = localStorage.getItem(STORAGE_KEYS.USER);
            if (legacy) return JSON.parse(legacy);
        }
        return null;
    } catch { return null; }
}

export function setDashboardUser(userId, data) {
    const key = (userId != null && userId !== '') ? `${STORAGE_KEYS.USER}_${userId}` : STORAGE_KEYS.USER;
    localStorage.setItem(key, JSON.stringify(data));
}

const BRANDHUB_PREFIX = 'searchlyst_brandhub';

export function getBrandHubData(userId, projectId) {
    try {
        if (!userId) return null;
        const key = projectId != null ? `${BRANDHUB_PREFIX}_${userId}_${projectId}` : `${BRANDHUB_PREFIX}_${userId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
}

export function setBrandHubData(userId, projectId, data) {
    if (!userId) return;
    const key = projectId != null ? `${BRANDHUB_PREFIX}_${userId}_${projectId}` : `${BRANDHUB_PREFIX}_${userId}`;
    localStorage.setItem(key, JSON.stringify(data));
}

/* ------------------------------------------------------------------ */
/*  useScanManager — persistent background scan polling               */
/* ------------------------------------------------------------------ */
function useScanManager(user) {
    const [scanId, setScanId] = useState(null);
    const [scanStatus, setScanStatus] = useState('idle');         // idle | scanning | completed | failed | loading
    const [scanResult, setScanResult] = useState(null);
    const [scanPhase, setScanPhase] = useState('');
    const [scanPhaseDetail, setScanPhaseDetail] = useState('');
    const [scanProgress, setScanProgress] = useState({ completed: 0, total: 0 });
    const [completedPrompts, setCompletedPrompts] = useState(0);
    const [totalPrompts, setTotalPrompts] = useState(0);
    const [scanError, setScanError] = useState(null);
    const [loadingFromBackend, setLoadingFromBackend] = useState(true);
    const pollRef = useRef(null);
    const pollGenerationRef = useRef(0);
    const identityRef = useRef('');

    const authUserId = user?.authUserId ?? null;
    const domain = user?.domain || '';
    const projectId = user?.projectId;
    const storageKey = visibilityResultStorageKey(authUserId, domain, projectId);
    const activeScanKey = activeScanStorageKey(authUserId, domain, projectId);

    const pollDepsRef = useRef({ projectId, domain, storageKey, activeScanKey, authUserId });
    useEffect(() => {
        pollDepsRef.current = { projectId, domain, storageKey, activeScanKey, authUserId };
    }, [projectId, domain, storageKey, activeScanKey, authUserId]);

    const scanIdRef = useRef(null);
    const scanStatusRef = useRef('idle');
    useEffect(() => {
        scanIdRef.current = scanId;
    }, [scanId]);
    useEffect(() => {
        scanStatusRef.current = scanStatus;
    }, [scanStatus]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    /** Single status fetch — used by interval, immediate tick, and tab-focus catch-up (background tabs throttle timers). */
    const pollScanOnce = useCallback(
        async (id) => {
            const gen = pollGenerationRef.current;
            const { projectId: pid, domain: dom, storageKey: sk, activeScanKey: ask, authUserId: uid } = pollDepsRef.current;
            try {
                const res = await apiClient.visibility.getScanStatus(id);
                if (gen !== pollGenerationRef.current) return;
                if (res.phase) setScanPhase(res.phase);
                if (res.phaseDetail) setScanPhaseDetail(res.phaseDetail);
                if (res.progress) setScanProgress(res.progress);
                if (res.completedPrompts != null) setCompletedPrompts(res.completedPrompts);
                if (res.totalPrompts) setTotalPrompts(res.totalPrompts);
                if (res.result) setScanResult(res.result);
                if (res.status === 'completed') {
                    setScanStatus('completed');
                    if (res.result) {
                        localStorage.setItem(sk, JSON.stringify(res.result));
                        writeLastVisibilityScanId(uid, dom, pid, id);
                    }
                    localStorage.removeItem(ask);
                    stopPolling();
                } else if (res.status === 'failed') {
                    setScanError(res.error);
                    localStorage.removeItem(ask);
                    stopPolling();
                    try {
                        const fallback = await apiClient.visibility.getLatestScan(pid, dom);
                        if (gen !== pollGenerationRef.current) return;
                        if (fallback?.scan?.result) {
                            setScanResult(fallback.scan.result);
                            if (fallback.scan?.id) {
                                setScanId(fallback.scan.id);
                                writeLastVisibilityScanId(uid, dom, pid, fallback.scan.id);
                            }
                            localStorage.setItem(sk, JSON.stringify(fallback.scan.result));
                            setScanStatus('completed');
                            return;
                        }
                    } catch { /* no fallback available */ }
                    setScanStatus('failed');
                }
            } catch { /* network hiccup — next poll or focus retry */ }
        },
        [stopPolling],
    );

    // Poll for scan status (runs on server; tab switches do not stop it — only throttles JS timers in background)
    const startPolling = useCallback(
        (id) => {
            stopPolling();
            void pollScanOnce(id);
            pollRef.current = setInterval(() => {
                void pollScanOnce(id);
            }, 3000);
        },
        [stopPolling, pollScanOnce],
    );

    // When the user returns to this tab, poll once immediately so we catch completed scans if the interval was throttled
    useEffect(() => {
        const onVisibleOrFocus = () => {
            if (document.visibilityState !== 'visible') return;
            const id = scanIdRef.current;
            if (!id || scanStatusRef.current !== 'scanning') return;
            void pollScanOnce(id);
        };
        document.addEventListener('visibilitychange', onVisibleOrFocus);
        window.addEventListener('focus', onVisibleOrFocus);
        return () => {
            document.removeEventListener('visibilitychange', onVisibleOrFocus);
            window.removeEventListener('focus', onVisibleOrFocus);
        };
    }, [pollScanOnce]);

    // Cleanup on unmount
    useEffect(() => () => stopPolling(), [stopPolling]);

    // Switching account or project: stop any in-flight poll and clear UI state so another user's scan never bleeds in
    useEffect(() => {
        pollGenerationRef.current += 1;
        identityRef.current = `${authUserId}|${domain}|${projectId}`;
        stopPolling();
        setScanId(null);
        setScanResult(null);
        setScanStatus('idle');
        setScanError(null);
        setScanPhase('');
        setScanPhaseDetail('');
        setScanProgress({ completed: 0, total: 0 });
        setCompletedPrompts(0);
        setTotalPrompts(0);
        setLoadingFromBackend(!!domain);
    }, [authUserId, domain, projectId, stopPolling]);

    // Load cache / resume scan for this account + project only
    useEffect(() => {
        const gen = pollGenerationRef.current;
        const identity = `${authUserId}|${domain}|${projectId}`;
        const stale = () => gen !== pollGenerationRef.current || identity !== identityRef.current;

        if (!domain) {
            setLoadingFromBackend(false);
            return;
        }
        setLoadingFromBackend(true);

        const loadFromStorage = () => {
            let saved = localStorage.getItem(storageKey);
            if (!saved && storageUserIdSegment(authUserId) === 'anon') {
                const legacyA = `searchlyst_visibility_${domain || 'default'}_${projectId ?? 'default'}`;
                saved = localStorage.getItem(legacyA);
                if (!saved && (projectId == null || projectId === 'default')) {
                    saved = localStorage.getItem(`searchlyst_visibility_${domain || 'default'}`);
                }
                if (saved) localStorage.setItem(storageKey, saved);
            }
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && !stale()) {
                        setScanResult(parsed);
                        setScanStatus('completed');
                        const sid = readLastVisibilityScanId(authUserId, domain, projectId);
                        if (sid) setScanId(sid);
                        setLoadingFromBackend(false);
                        return true;
                    }
                } catch { }
            }
            return false;
        };

        const loadFromActiveScan = () => {
            try {
                const active = JSON.parse(localStorage.getItem(activeScanKey));
                if (active?.scanId && !stale()) {
                    setScanId(active.scanId);
                    setScanStatus('scanning');
                    setScanPhase('initializing');
                    setScanPhaseDetail('Resuming scan...');
                    startPolling(active.scanId);
                    setLoadingFromBackend(false);
                    return true;
                }
            } catch { }
            return false;
        };

        if (loadFromActiveScan()) return;

        loadFromStorage();

        (async () => {
            try {
                const res = await apiClient.visibility.getLatestScan(projectId, domain);
                if (stale()) return;
                if (res?.scan?.result) {
                    setScanResult(res.scan.result);
                    if (res.scan?.id) {
                        setScanId(res.scan.id);
                        writeLastVisibilityScanId(authUserId, domain, projectId, res.scan.id);
                    }
                    setScanStatus('completed');
                    localStorage.setItem(storageKey, JSON.stringify(res.scan.result));
                }
            } catch { }
            finally {
                if (!stale()) setLoadingFromBackend(false);
            }
        })();
    }, [authUserId, domain, projectId, storageKey, activeScanKey, startPolling]);

    // Start a new scan — clears ALL cached data first to ensure fresh start
    const startScan = useCallback(async () => {
        if (!user?.domain) return;
        
        // Clear ALL cached visibility data before starting new scan
        // This ensures trends/calculations only use database data
        removeLocalStorageForProject(authUserId, user.domain, user.projectId);
        setScanResult(null);
        setScanStatus('scanning'); setScanError(null);
        setScanPhase('initializing'); setScanPhaseDetail('Starting...');
        setScanProgress({ completed: 0, total: 0 }); setCompletedPrompts(0); setTotalPrompts(0);
        
        try {
            const comps = (user?.competitors || []).map(c => typeof c === 'string' ? { name: c, domain: c } : c);
            const tl = Array.isArray(user?.trackingLocations)
                ? user.trackingLocations.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 3)
                : [];
            const locBlob = `${(user?.location || '').toLowerCase()} ${tl.join(' ')}`.toLowerCase();
            const inferredCountry =
                /\bindia\b|\bbangalore\b|\bmumbai\b|\bdelhi\b/.test(locBlob) ? 'IN'
                : /\buk\b|\blondon\b|\bunited kingdom\b/.test(locBlob) ? 'GB'
                : /\busa\b|\bus\b|\bunited states\b|\bnyc\b/.test(locBlob) ? 'US'
                : '';
            const res = await apiClient.visibility.startScan({
                brandName: user?.brandName || '', domain: user?.domain || '', industry: user?.industry || '',
                competitors: comps, location: user?.location || '', language: user?.language || 'English',
                country: inferredCountry,
                trackingLocations: tl,
                projectId: user?.projectId || undefined,
                companySize: user?.companySize,
                reach: user?.reach,
                isAgency: user?.isAgency,
            });
            setScanId(res.scanId);
            localStorage.setItem(activeScanKey, JSON.stringify({ scanId: res.scanId, startedAt: new Date().toISOString() }));
            startPolling(res.scanId);
        } catch (err) { setScanStatus('failed'); setScanError(err.message); }
    }, [user, authUserId, activeScanKey, startPolling]);

    const applyScanResult = useCallback(
        (result, scanIdOverride) => {
            if (!result || typeof result !== 'object') return;
            setScanResult(result);
            setScanStatus('completed');
            if (scanIdOverride && typeof scanIdOverride === 'string') {
                setScanId(scanIdOverride);
                writeLastVisibilityScanId(authUserId, domain, projectId, scanIdOverride);
            }
            try {
                localStorage.setItem(storageKey, JSON.stringify(result));
            } catch {
                /* ignore quota */
            }
        },
        [storageKey, authUserId, domain, projectId],
    );

    return {
        scanId, scanStatus, scanResult, scanPhase, scanPhaseDetail,
        scanProgress, completedPrompts, totalPrompts, scanError,
        loadingFromBackend,
        startScan, stopPolling,
        applyScanResult,
    };
}

/* ------------------------------------------------------------------ */
/*  useAuditManager — persistent background audit polling              */
/* ------------------------------------------------------------------ */
function useAuditManager(user, activeProject) {
    const [auditId, setAuditId] = useState(null);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const pollRef = useRef(null);
    const pollGenerationRef = useRef(0);
    const identityRef = useRef('');

    const authUserId = user?.authUserId ?? null;
    const domain = user?.domain || '';
    const projectId = user?.projectId ?? activeProject?.id;
    const storageKey = auditResultStorageKey(authUserId, domain, projectId);
    const activeAuditKey = activeAuditStorageKey(authUserId, domain, projectId);

    const stopPolling = useCallback(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }, []);

    const loadHistory = useCallback(async () => {
        const snap = identityRef.current;
        try {
            const url = domain ? `https://${domain}` : '';
            const h = await apiClient.audit.getHistory({ url, projectId });
            if (snap !== identityRef.current) return;
            setHistory(h || []);
        } catch { /* silent */ }
    }, [domain, projectId]);

    const pollStatus = useCallback((id) => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            const gen = pollGenerationRef.current;
            try {
                const res = await apiClient.audit.getStatus(id);
                if (gen !== pollGenerationRef.current) return;
                if (res.progress) setProgress(res.progress);
                if (res.status === 'completed') {
                    setStatus('completed');
                    setResult(res.result);
                    localStorage.setItem(storageKey, JSON.stringify(res.result));
                    localStorage.removeItem(activeAuditKey);
                    stopPolling();
                    loadHistory();
                } else if (res.status === 'failed') {
                    setStatus('failed');
                    setError(res.error || 'Audit failed');
                    localStorage.removeItem(activeAuditKey);
                    stopPolling();
                } else {
                    setStatus(res.status);
                }
            } catch (err) { console.error('Audit poll error:', err); }
        }, 4000);
    }, [stopPolling, storageKey, activeAuditKey, loadHistory]);

    const startAudit = useCallback(async (urlOverride) => {
        const urlToUse = (urlOverride || (domain ? `https://${domain}` : '')).trim();
        if (!urlToUse) return;
        setStatus('crawling');
        setResult(null);
        setError(null);
        setProgress({ completed: 0, total: 0 });
        localStorage.removeItem(storageKey);
        try {
            const res = await apiClient.audit.start({ url: urlToUse, projectId });
            setAuditId(res.auditId);
            localStorage.setItem(activeAuditKey, JSON.stringify({ auditId: res.auditId, startedAt: new Date().toISOString() }));
            pollStatus(res.auditId);
        } catch (err) {
            setStatus('failed');
            setError(err.message || 'Failed to start audit');
        }
    }, [domain, projectId, storageKey, activeAuditKey, pollStatus]);

    const resetAudit = useCallback(() => {
        stopPolling();
        setStatus('idle');
        setResult(null);
        setError(null);
        setAuditId(null);
        setProgress({ completed: 0, total: 0 });
        localStorage.removeItem(storageKey);
        localStorage.removeItem(activeAuditKey);
    }, [stopPolling, storageKey, activeAuditKey]);

    useEffect(() => () => stopPolling(), [stopPolling]);

    useEffect(() => {
        pollGenerationRef.current += 1;
        identityRef.current = `${authUserId}|${domain}|${projectId}`;
        stopPolling();
        setAuditId(null);
        setStatus('idle');
        setResult(null);
        setError(null);
        setProgress({ completed: 0, total: 0 });
        setHistory([]);
    }, [authUserId, domain, projectId, stopPolling]);

    useEffect(() => {
        const gen = pollGenerationRef.current;
        const identity = `${authUserId}|${domain}|${projectId}`;
        const stale = () => gen !== pollGenerationRef.current || identity !== identityRef.current;

        if (!domain) return;

        // Resume active audit if one is in progress
        try {
            const active = JSON.parse(localStorage.getItem(activeAuditKey));
            if (active?.auditId && !stale()) {
                setAuditId(active.auditId);
                setStatus('crawling');
                pollStatus(active.auditId);
                loadHistory();
                return;
            }
        } catch { /* silent */ }

        // Load from localStorage cache
        let saved = localStorage.getItem(storageKey);
        if (!saved && storageUserIdSegment(authUserId) === 'anon') {
            const legacy = `searchlyst_audit_${domain || 'default'}`;
            saved = localStorage.getItem(legacy);
            if (saved) localStorage.setItem(storageKey, saved);
        }
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && !stale()) { setResult(parsed); setStatus('completed'); }
            } catch { /* ignore */ }
        } else {
            const url = domain ? `https://${domain}` : '';
            if (url) {
                apiClient.audit.getLatest({ url, projectId })
                    .then(r => {
                        if (stale()) return;
                        if (r) { setResult(r); setStatus('completed'); localStorage.setItem(storageKey, JSON.stringify(r)); }
                    })
                    .catch(() => {});
            }
        }
        if (!stale()) loadHistory();
    }, [authUserId, domain, projectId, storageKey, activeAuditKey, pollStatus, loadHistory]);

    return {
        auditId, status, progress, result, error, history,
        startAudit, resetAudit, stopPolling, loadHistory,
    };
}

function DashboardInner() {
    const navigate = useNavigate();
    const { user: authUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showAddProjectOnboarding, setShowAddProjectOnboarding] = useState(false);
    const [userRole, setUserRole] = useState('founder');

    // Scan manager — use activeProject when selected; authUserId scopes all localStorage + polling to this login
    const scanUserBase = activeProject
        ? { ...user, ...activeProject, domain: activeProject.url || activeProject.domain, brandName: activeProject.name || activeProject.brandName, projectId: activeProject.id }
        : user;
    const scanUser = { ...scanUserBase, authUserId: authUser?.id ?? null };
    const contextUser = scanUser;
    const scanManager = useScanManager(scanUser);
    const auditManager = useAuditManager(scanUser, activeProject);

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

    const prevAuthIdRef = useRef(authUser?.id);
    useEffect(() => {
        // Clear stale state IMMEDIATELY so child components don't see old project data during async load
        if (prevAuthIdRef.current !== authUser?.id) {
            setUser(null);
            setActiveProject(null);
            setProjects([]);
            prevAuthIdRef.current = authUser?.id;
        }
        const loadInitialData = async () => {
            const userData = getDashboardUser(authUser?.id);
            const loadedProjects = await fetchProjects();
            
            const localOnboarded = userData?.onboarded === true;
            const projectsKey = projectsFallbackStorageKey(authUser?.id);
            const localHasProjects = (() => {
                try {
                    const saved = localStorage.getItem(projectsKey);
                    const parsed = saved ? JSON.parse(saved) : [];
                    return Array.isArray(parsed) && parsed.length > 0;
                } catch { return false; }
            })();

            const isOnboarded = loadedProjects.length > 0 || localOnboarded || localHasProjects;

            if (!isOnboarded) {
                setShowOnboarding(true);
            } else {
                const displayUser = userData || (loadedProjects[0] ? {
                    brandName: loadedProjects[0].name || loadedProjects[0].brandName,
                    domain: loadedProjects[0].url || loadedProjects[0].domain,
                    industry: loadedProjects[0].industry,
                    competitors: loadedProjects[0].competitors,
                    role_type: userData?.role_type || 'founder',
                } : null);
                setUser(displayUser);
                setUserRole(displayUser?.role_type || 'founder');
            }

            if (loadedProjects.length > 0) {
                setActiveProject(loadedProjects[0]);
            } else if (localHasProjects) {
                try {
                    const raw = localStorage.getItem(projectsKey);
                    const saved = raw ? JSON.parse(raw) : [];
                    if (saved?.length > 0) setActiveProject(saved[0]);
                } catch {}
            }

            setLoading(false);
        };

        loadInitialData();
    }, [authUser?.id]);

    const handleProjectSwitch = (project) => {
        setActiveProject(project);
        setActiveTab('overview');
    };

    /** Remove the active domain/project from the workspace (DB + local caches). Account stays signed in. */
    const handleRemoveProject = async (project) => {
        if (!project) return false;
        const pid = project.id;
        const domain = project.url || project.domain || '';

        removeLocalStorageForProject(authUser?.id, domain, pid);
        removeProjectFromFallbackList(authUser?.id, project);

        const canApiDelete = Number(pid) > 0 && authUser?.id != null && Number(authUser.id) > 0;
        if (canApiDelete) {
            try {
                await apiClient.projects.delete(pid);
            } catch (e) {
                import('sonner').then(({ toast }) =>
                    toast.error(e.message || 'Could not remove this domain from the server'),
                );
                return false;
            }
        }

        const loaded = await fetchProjects();
        removeProjectFromFallbackList(authUser?.id, project);

        let fallbackMapped = [];
        if (loaded.length === 0) {
            try {
                const key = projectsFallbackStorageKey(authUser?.id);
                const saved = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(saved) && saved.length > 0) {
                    fallbackMapped = saved.map((p) => ({
                        ...p,
                        name: p.brandName || p.name,
                        url: p.domain || p.url,
                    }));
                    setProjects(fallbackMapped);
                }
            } catch { /* ignore */ }
        }

        const pool = loaded.length > 0 ? loaded : fallbackMapped;
        const next = pool[0] || null;

        if (next) {
            setActiveProject(next);
            const merged = {
                brandName: next.name || next.brandName,
                domain: next.url || next.domain,
                industry: next.industry,
                competitors: next.competitors,
                role_type: userRole,
                projectId: next.id,
            };
            setUser((prev) => ({ ...prev, ...merged }));
            const existing = getDashboardUser(authUser?.id);
            setDashboardUser(authUser?.id, { ...existing, ...merged });
        } else {
            setActiveProject(null);
            const existing = getDashboardUser(authUser?.id);
            if (existing) {
                setDashboardUser(authUser?.id, {
                    ...existing,
                    brandName: undefined,
                    domain: undefined,
                    industry: undefined,
                    competitors: undefined,
                });
            }
            setUser(existing ? { ...existing, brandName: undefined, domain: undefined, industry: undefined, competitors: undefined, projectId: undefined } : null);
        }

        import('sonner').then(({ toast }) => toast.success('This domain has been removed from your workspace.'));
        return true;
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
        const userData = getDashboardUser(authUser?.id);
        setUser(userData);
        fetchProjects().then(loaded => {
            if (loaded.length > 0) setActiveProject(loaded[0]);
        });
    };

    const handleLogout = () => {
        logout();
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
        return <OnboardingFlow userId={authUser?.id} onComplete={handleOnboardingComplete} mode="firstTime" />;
    }

    if (showAddProjectOnboarding) {
        return <OnboardingFlow userId={authUser?.id} onComplete={handleAddProjectComplete} mode="addProject" />;
    }

    const renderContent = () => {
        if (activeTab === 'brand-hub') return <BrandHubPage user={contextUser} authUserId={authUser?.id} />;
        if (activeTab === 'agent') return <AgentPage user={contextUser} scanManager={scanManager} />;

        if (!activeProject) {
            return <EmptyProjectState onAddProject={() => setShowAddProjectOnboarding(true)} />;
        }

        switch (activeTab) {
            case 'overview':
                return <OverviewPage domains={projects} projects={projects} activeProject={activeProject} onAddDomain={() => setShowAddProjectOnboarding(true)} onRemoveProject={handleRemoveProject} onTabChange={setActiveTab} userRole={userRole} user={contextUser} scanManager={scanManager} />;
            case 'topic-discovery':
                return <TopicDiscoveryPage onTabChange={setActiveTab} user={contextUser} />;
            case 'content-studio':
                return <ContentStudioPage user={contextUser} />;
            case 'ai-visibility':
                return <AIVisibilityPage user={contextUser} scanManager={scanManager} onTabChange={setActiveTab} />;
            case 'competitive-intel':
                return <CompetitiveIntelPage user={contextUser} scanManager={scanManager} onTabChange={setActiveTab} />;
            case 'competitors':
                return <CompetitorsPage user={contextUser} scanManager={scanManager} onTabChange={setActiveTab} />;
            case 'sentiment-geo':
                return <SentimentGeoPage user={contextUser} scanManager={scanManager} />;
            case 'audit-health':
                return <AuditHealthPage user={contextUser} activeProject={activeProject} auditManager={auditManager} />;
            case 'prompt-intel':
                return (
                    <PromptIntelPage
                        user={contextUser}
                        scanManager={scanManager}
                        scanId={scanManager.scanId}
                        applyScanResult={scanManager.applyScanResult}
                    />
                );
            case 'actions':
                return <ActionsPage user={contextUser} onTabChange={setActiveTab} />;
            default:
                return <OverviewPage domains={projects} projects={projects} activeProject={activeProject} onAddDomain={() => setShowAddProjectOnboarding(true)} onRemoveProject={handleRemoveProject} onTabChange={setActiveTab} userRole={userRole} user={contextUser} scanManager={scanManager} />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={user}
                authUser={authUser}
                userRole={userRole}
                projects={projects}
                activeProject={activeProject}
                onProjectSwitch={handleProjectSwitch}
                onAddProject={() => {
                    if (projects.length >= 2) {
                        import('sonner').then(({ toast }) => toast.error('Project limit reached. You can only have up to 2 projects.'));
                        return;
                    }
                    setShowAddProjectOnboarding(true);
                }}
                onLogout={handleLogout}
                scanActive={scanManager.scanStatus === 'scanning'}
                auditActive={auditManager.status === 'crawling' || auditManager.status === 'analyzing'}
            />
            <div className="flex-1 min-h-0 overflow-auto bg-[#000000]">
                <div key={`${authUser?.id || 'anon'}_${activeProject?.id || 'np'}`} className="p-8 page-transition">
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
