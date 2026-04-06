import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Small bordered pill with ↗ / ↘ and change amount — green up, red down (reference KPI style).
 * @param {'percent'|'count'|'index'} format — percent appends %, count integer delta, index one decimal (e.g. sentiment score points)
 */
export function TrendPill({ delta, format = 'percent', className = '' }) {
    if (delta == null || !Number.isFinite(Number(delta))) {
        return (
            <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-[#333] text-[#666] text-[11px] font-medium tabular-nums ${className}`}
            >
                —
            </span>
        );
    }
    const n = Number(delta);
    const up = n > 0;
    const down = n < 0;
    const flat = n === 0;
    const absVal =
        format === 'count' ? Math.abs(Math.round(n)) : Math.abs(n);
    const text =
        format === 'count'
            ? String(absVal)
            : format === 'index'
              ? absVal.toFixed(1)
              : `${absVal.toFixed(1)}%`;

    return (
        <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold tabular-nums ${
                up
                    ? 'border-emerald-500/45 text-emerald-500 bg-emerald-500/[0.08]'
                    : down
                      ? 'border-red-500/45 text-red-500 bg-red-500/[0.08]'
                      : 'border-[#3f3f3f] text-[#888] bg-[#1a1a1a]'
            } ${className}`}
        >
            {!flat && (up ? <ArrowUpRight className="w-3 h-3 shrink-0" strokeWidth={2.2} /> : <ArrowDownRight className="w-3 h-3 shrink-0" strokeWidth={2.2} />)}
            {flat && format === 'percent' ? '0%' : flat && format === 'index' ? '0' : flat ? '0' : text}
        </span>
    );
}

export default TrendPill;
