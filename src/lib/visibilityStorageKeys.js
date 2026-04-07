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
