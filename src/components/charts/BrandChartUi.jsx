import React from 'react';

/** Google favicon service — same pattern as tables elsewhere in the dashboard. */
export function brandFaviconUrl(domain, sz = 32) {
    if (!domain || typeof domain !== 'string') return null;
    const d = domain.replace(/^www\./i, '').trim();
    if (!d) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${sz}`;
}

export function resolveBrandChartMeta(name, { entities = [], sovRows = [], userDomain = '' } = {}) {
    const fullName = String(name || '').trim();
    const k = fullName.toLowerCase();
    const ent = entities.find((e) => String(e.name || '').trim().toLowerCase() === k);
    if (ent?.domain) return { fullName: ent.name || fullName, domain: String(ent.domain).replace(/^www\./i, '') };
    const row = sovRows.find((x) => String(x.name || '').trim().toLowerCase() === k);
    if (row?.domain) return { fullName: row.name || fullName, domain: String(row.domain).replace(/^www\./i, '') };
    if (userDomain) return { fullName, domain: String(userDomain).replace(/^www\./i, '') };
    return { fullName, domain: null };
}

export function BrandFaviconImg({ domain, size = 18, className = '' }) {
    const src = brandFaviconUrl(domain, Math.max(32, size * 2));
    if (!src) {
        return (
            <span
                className={`inline-block shrink-0 rounded bg-[#2a2a2a] ${className}`}
                style={{ width: size, height: size }}
                aria-hidden
            />
        );
    }
    return (
        <img
            src={src}
            alt=""
            width={size}
            height={size}
            className={`shrink-0 rounded object-contain ${className}`}
            onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
            }}
        />
    );
}

/** Recharts Tooltip for vertical entity / mention bars (payload[0].payload has fullName, domain, mentions). */
export function EntityMentionsBarTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    const fullName = row?.fullName || label || '';
    const domain = row?.domain;
    const v = payload[0]?.value;
    return (
        <div className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2.5 shadow-xl text-[12px] text-white max-w-[280px]">
            <div className="flex items-center gap-2 mb-1">
                <BrandFaviconImg domain={domain} size={22} />
                <span className="font-semibold text-[13px] leading-tight">{fullName}</span>
            </div>
            {domain ? <p className="text-[10px] text-[#888] mb-1 truncate">{domain}</p> : null}
            <p className="text-[11px] text-[#ccc] tabular-nums">
                <span className="text-[#888]">Mentions</span> · <span className="font-bold text-white">{v}</span>
            </p>
        </div>
    );
}

/** Recharts category-axis tick: favicon + truncated label (foreignObject for HTML inside SVG). */
export function EntityBarYAxisTick({ x, y, payload, rows }) {
    const row = Array.isArray(rows) ? rows.find((r) => r.name === payload?.value) : null;
    const domain = row?.domain;
    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x={-122} y={-10} width={118} height={20} className="overflow-visible">
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex h-5 items-center justify-end gap-1.5 pr-0.5"
                    title={row?.fullName || payload?.value || ''}
                >
                    <span className="truncate text-right text-[10px] text-[#aaa]">{payload?.value}</span>
                    <BrandFaviconImg domain={domain} size={16} className="shrink-0" />
                </div>
            </foreignObject>
        </g>
    );
}

/** Multi-series line chart: each row shows brand logo + name + value. */
export function BrandSeriesTooltip({ active, label, payload, metaByKey }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2.5 shadow-xl text-[11px] text-white min-w-[200px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888] mb-2">{label}</p>
            <ul className="space-y-1.5">
                {payload
                    .filter((p) => p && p.name != null)
                    .map((p) => {
                        const meta = metaByKey?.[p.dataKey] || {};
                        const title = meta.fullName || p.dataKey;
                        return (
                            <li key={String(p.dataKey)} className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-2">
                                    <BrandFaviconImg domain={meta.domain} size={18} />
                                    <span className="truncate font-medium text-[#eee]" title={title}>
                                        {title}
                                    </span>
                                </span>
                                <span className="shrink-0 font-bold tabular-nums text-white">{p.value ?? '—'}</span>
                            </li>
                        );
                    })}
            </ul>
        </div>
    );
}

/** Legend with favicon per brand line. */
export function BrandSeriesLegend({ payload, metaByKey }) {
    if (!payload?.length) return null;
    return (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 pt-2">
            {payload.map((entry) => {
                const key = entry.dataKey ?? entry.value;
                const meta = metaByKey?.[key] || {};
                const title = meta.fullName || key;
                return (
                    <div key={String(key)} className="flex items-center gap-1.5 text-[11px]" title={title}>
                        <BrandFaviconImg domain={meta.domain} size={14} />
                        <span className="max-w-[120px] truncate" style={{ color: entry.color }}>
                            {title}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/** Single-metric chart (e.g. visibility trend) — header with brand. */
export function SingleBrandTooltipShell({ active, label, payload, brandName, domain, valueLabel = 'Score' }) {
    if (!active || !payload?.length) return null;
    const row = payload[0];
    return (
        <div className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2.5 shadow-xl text-[12px] text-white">
            <div className="mb-2 flex items-center gap-2 border-b border-[#333] pb-2">
                <BrandFaviconImg domain={domain} size={22} />
                <div className="min-w-0">
                    <p className="truncate font-semibold">{brandName || 'Your brand'}</p>
                    {label ? <p className="text-[10px] text-[#888]">{label}</p> : null}
                </div>
            </div>
            <p className="text-[11px]">
                <span className="text-[#888]">{valueLabel}</span>{' '}
                <span className="font-bold tabular-nums">{row?.value != null ? `${row.value}%` : '—'}</span>
            </p>
        </div>
    );
}

/** Sentiment / geo charts: brand context in tooltip (series are not brands). */
/** Vertical bar chart of cited URLs — logo from site domain, full URL on hover. */
export function CitationUrlBarTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    const fullUrl = row?.fullUrl || '';
    const domain = row?.hostDomain;
    const v = payload[0]?.value;
    return (
        <div className="max-w-[320px] rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2.5 text-[12px] text-white shadow-xl">
            <div className="mb-1 flex items-center gap-2">
                <BrandFaviconImg domain={domain} size={22} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#888]">Source</span>
            </div>
            <p className="break-all text-[11px] leading-snug text-[#e5e5e5]" title={fullUrl}>
                {fullUrl || row?.label}
            </p>
            <p className="mt-1.5 text-[11px] text-[#888]">
                Citations · <span className="font-bold text-white tabular-nums">{v}</span>
            </p>
        </div>
    );
}

export function CitationUrlYAxisTick({ x, y, payload, rows }) {
    const row = Array.isArray(rows) ? rows.find((r) => r.label === payload?.value) : null;
    const domain = row?.hostDomain;
    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x={-148} y={-10} width={144} height={20} className="overflow-visible">
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex h-5 items-center justify-end gap-1.5 pr-0.5"
                    title={row?.fullUrl || payload?.value || ''}
                >
                    <span className="truncate text-right text-[9px] text-[#999]">{payload?.value}</span>
                    <BrandFaviconImg domain={domain} size={14} className="shrink-0" />
                </div>
            </foreignObject>
        </g>
    );
}

export function BrandContextTooltipShell({ active, label, payload, brandName, domain, formatter }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-[#333] bg-[#1A1A1A] px-3 py-2.5 shadow-xl text-[12px] text-white min-w-[180px]">
            <div className="mb-2 flex items-center gap-2">
                <BrandFaviconImg domain={domain} size={20} />
                <span className="truncate font-semibold text-[#eee]">{brandName || 'Your brand'}</span>
            </div>
            {label ? <p className="mb-1.5 text-[10px] text-[#888]">{label}</p> : null}
            <ul className="space-y-1">
                {payload.map((p, i) => (
                    <li key={i} className="flex justify-between gap-3 text-[11px]">
                        <span style={{ color: p.color }}>{p.name}</span>
                        <span className="font-medium tabular-nums">
                            {formatter ? formatter(p.value, p.name, p) : p.value}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
