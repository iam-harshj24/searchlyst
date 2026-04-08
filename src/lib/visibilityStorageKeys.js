/**
 * localStorage key helpers — every key includes the authenticated user id so
 * multiple accounts on the same browser never share visibility/audit cache or active-scan handles.
 */

export function storageUserIdSegment(authUserId) {
    if (authUserId == null || authUserId === '') return 'anon';
    return String(authUserId);
}

export function visibilityResultStorageKey(authUserId, domain, projectId) {
    const uid = storageUserIdSegment(authUserId);
    return `searchlyst_visibility_${uid}_${domain || 'default'}_${projectId ?? 'default'}`;
}

export function activeScanStorageKey(authUserId, domain, projectId) {
    const uid = storageUserIdSegment(authUserId);
    return `searchlyst_active_scan_${uid}_${domain || 'default'}_${projectId ?? 'default'}`;
}

/** Last completed visibility scan id for this project — keeps Custom prompt working after cache-only load. */
export function lastVisibilityScanIdStorageKey(authUserId, domain, projectId) {
    const uid = storageUserIdSegment(authUserId);
    return `searchlyst_last_visibility_scan_id_${uid}_${domain || 'default'}_${projectId ?? 'default'}`;
}

export function readLastVisibilityScanId(authUserId, domain, projectId) {
    try {
        const v = localStorage.getItem(lastVisibilityScanIdStorageKey(authUserId, domain, projectId));
        return v && typeof v === 'string' ? v : '';
    } catch {
        return '';
    }
}

export function writeLastVisibilityScanId(authUserId, domain, projectId, scanId) {
    if (!scanId || typeof scanId !== 'string') return;
    try {
        localStorage.setItem(lastVisibilityScanIdStorageKey(authUserId, domain, projectId), scanId);
    } catch {
        /* ignore */
    }
}

export function auditResultStorageKey(authUserId, domain, projectId) {
    const uid = storageUserIdSegment(authUserId);
    return `searchlyst_audit_${uid}_${domain || 'default'}_${projectId ?? 'default'}`;
}

export function activeAuditStorageKey(authUserId, domain, projectId) {
    const uid = storageUserIdSegment(authUserId);
    return `searchlyst_active_audit_${uid}_${domain || 'default'}_${projectId ?? 'default'}`;
}

/** Offline project list fallback — must be per login (never share across accounts). */
export function projectsFallbackStorageKey(authUserId) {
    const uid = storageUserIdSegment(authUserId);
    return uid === 'anon' ? 'searchlyst_projects' : `searchlyst_projects_${uid}`;
}

/** Read cached visibility JSON for this account + project (no cross-account keys). */
const BRANDHUB_PREFIX = 'searchlyst_brandhub';

/** Normalize host for storage keys (no protocol, no path, lowercase). */
function normalizeDomainKey(domainRaw) {
    if (!domainRaw) return 'default';
    return String(domainRaw)
        .replace(/^https?:\/\//i, '')
        .split('/')[0]
        .replace(/^www\./i, '')
        .toLowerCase()
        .trim() || 'default';
}

/**
 * Remove browser cache tied to one project/domain (visibility, audits, scans, competitors, actions, brand hub).
 */
export function removeLocalStorageForProject(authUserId, domainRaw, projectId) {
    const uid = storageUserIdSegment(authUserId);
    const domain = normalizeDomainKey(domainRaw);
    const keys = [
        visibilityResultStorageKey(authUserId, domain, projectId),
        lastVisibilityScanIdStorageKey(authUserId, domain, projectId),
        activeScanStorageKey(authUserId, domain, projectId),
        auditResultStorageKey(authUserId, domain, projectId),
        activeAuditStorageKey(authUserId, domain, projectId),
        `searchlyst_added_competitors_${uid}_${domain}`,
        `searchlyst_actions_state_${uid}_${domain}`,
    ];
    if (uid === 'anon') {
        keys.push(
            `searchlyst_visibility_${domain}_${projectId ?? 'default'}`,
            `searchlyst_visibility_${domain}`,
            `searchlyst_audit_${domain}`,
            `searchlyst_added_competitors_${domain}`,
        );
    }
    for (const k of keys) {
        try {
            localStorage.removeItem(k);
        } catch { /* ignore */ }
    }
    if (authUserId != null && authUserId !== '' && projectId != null && projectId !== '') {
        try {
            localStorage.removeItem(`${BRANDHUB_PREFIX}_${authUserId}_${projectId}`);
        } catch { /* ignore */ }
    }
}

/** Drop one project from the offline projects fallback list (matches domain or id). */
export function removeProjectFromFallbackList(authUserId, project) {
    const key = projectsFallbackStorageKey(authUserId);
    try {
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return;
        const targetDom = normalizeDomainKey(project?.url || project?.domain);
        const pid = project?.id;
        const next = arr.filter((p) => {
            const pd = normalizeDomainKey(p?.url || p?.domain);
            if (pid != null && p?.id != null && Number(p.id) === Number(pid)) return false;
            if (targetDom !== 'default' && pd === targetDom) return false;
            return true;
        });
        localStorage.setItem(key, JSON.stringify(next));
    } catch { /* ignore */ }
}

export function safeDateMs(val) {
    if (val == null || val === '') return 0;
    try {
        const t = new Date(val).getTime();
        return Number.isNaN(t) ? 0 : t;
    } catch {
        return 0;
    }
}

/**
 * Pick the richer / newer full-scan payload so every dashboard tab matches Prompt Intelligence.
 * Compares prompt count hints (`config.totalCalls`) then `scannedAt`.
 */
export function mergeVisibilityScan(live, cached) {
    const liveOk = live && Array.isArray(live.prompts) && live.prompts.length > 0;
    const cacheOk = cached && Array.isArray(cached.prompts) && cached.prompts.length > 0;
    if (liveOk && !cacheOk) return live;
    if (!liveOk && cacheOk) return cached;
    if (!liveOk && !cacheOk) return live || cached || null;

    const liveCalls = Number(live.config?.totalCalls) || 0;
    const cacheCalls = Number(cached.config?.totalCalls) || 0;

    if (liveCalls > cacheCalls) return live;
    if (cacheCalls > liveCalls) return cached;

    const tLive = safeDateMs(live.scannedAt);
    const tCache = safeDateMs(cached.scannedAt);
    return tLive >= tCache ? live : cached;
}

export function readVisibilityCache(authUserId, domain, projectId) {
    try {
        const key = visibilityResultStorageKey(authUserId, domain, projectId);
        let saved = localStorage.getItem(key);
        // Guest-only legacy keys (pre user isolation)
        if (!saved && storageUserIdSegment(authUserId) === 'anon') {
            const legacy = `searchlyst_visibility_${domain || 'default'}_${projectId ?? 'default'}`;
            saved = localStorage.getItem(legacy);
            if (!saved && (projectId == null || projectId === 'default')) {
                saved = localStorage.getItem(`searchlyst_visibility_${domain || 'default'}`);
            }
        }
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}
