/**
 * Build continuous visibility trend series from scan history so charts do not skip calendar periods.
 */

function localDayKey(t) {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDayKey(key) {
    const [y, m, day] = key.split('-').map(Number);
    return new Date(y, m - 1, day);
}

export function historyToPoints(history) {
    if (!Array.isArray(history)) return [];
    return history
        .map((h) => ({
            t: new Date(h.date).getTime(),
            score: Number(h.score),
        }))
        .filter((p) => !Number.isNaN(p.t) && Number.isFinite(p.score));
}

/**
 * One row per calendar day from first scan in range through end date; carry-forward last known score.
 */
export function buildVisibilityTrendDaily(history, options = {}) {
    const { extendToToday = true, filterDays = 0 } = options;
    let pts = historyToPoints(history);
    if (filterDays > 0) {
        const cut = Date.now() - filterDays * 86400000;
        pts = pts.filter((p) => p.t >= cut);
    }
    if (pts.length === 0) return [];
    pts.sort((a, b) => a.t - b.t);

    const byDay = new Map();
    for (const p of pts) {
        const k = localDayKey(p.t);
        const prev = byDay.get(k);
        if (!prev || p.t >= prev.t) byDay.set(k, { t: p.t, score: p.score });
    }

    const keys = [...byDay.keys()].sort();
    const start = parseLocalDayKey(keys[0]);
    const end = extendToToday ? new Date() : parseLocalDayKey(keys[keys.length - 1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const out = [];
    let lastScore = null;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = localDayKey(d.getTime());
        const row = byDay.get(k);
        if (row) lastScore = row.score;
        if (lastScore == null) continue;
        out.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateFull: k,
            score: Math.round(lastScore),
        });
    }
    return out;
}

function startOfWeekMondayLocal(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
}

/**
 * One row per ISO week (week starts Monday, local); score = mean of scans in that week.
 */
export function buildVisibilityTrendWeekly(history, options = {}) {
    const { filterDays = 0 } = options;
    let pts = historyToPoints(history);
    if (filterDays > 0) {
        const cut = Date.now() - filterDays * 86400000;
        pts = pts.filter((p) => p.t >= cut);
    }
    if (pts.length === 0) return [];
    pts.sort((a, b) => a.t - b.t);

    const weekMap = new Map();
    for (const p of pts) {
        const ws = startOfWeekMondayLocal(new Date(p.t));
        const k = localDayKey(ws.getTime());
        if (!weekMap.has(k)) weekMap.set(k, []);
        weekMap.get(k).push(p.score);
    }

    const keys = [...weekMap.keys()].sort();
    return keys.map((k) => {
        const scores = weekMap.get(k);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const d = parseLocalDayKey(k);
        return {
            date: `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            dateFull: k,
            score: Math.round(avg),
        };
    });
}
