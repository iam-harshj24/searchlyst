import React from 'react';
import { TrendPill } from '@/components/ui/TrendPill';

/**
 * Maps 0–100 sentiment index to tier: negative (1 bar red), neutral (2 bars grey), positive (3 bars white).
 */
export function sentimentScoreToTier(score) {
    if (score == null || Number.isNaN(Number(score))) return null;
    const n = Number(score);
    if (n >= 70) return 'positive';
    if (n >= 40) return 'neutral';
    return 'negative';
}

/** positive | neutral | negative | n/a → tier */
export function sentimentLabelToTier(label) {
    const s = String(label || '').toLowerCase().trim();
    if (s === 'positive') return 'positive';
    if (s === 'negative') return 'negative';
    if (s === 'neutral') return 'neutral';
    if (s === 'n/a' || s === 'na' || !s) return null;
    return null;
}

/** Jio-style palette: red / grey / white (no green/yellow). */
const TIER_FILL = {
    negative: { count: 1, active: 'bg-[#E92A15]', inactive: 'bg-[#2a2a2a]' },
    neutral: { count: 2, active: 'bg-[#737373]', inactive: 'bg-[#2a2a2a]' },
    positive: { count: 3, active: 'bg-[#f5f5f5]', inactive: 'bg-[#2a2a2a]' },
};

const SIZE_MAP = {
    sm: { h: 'h-[14px]', w: 'w-[42px]', gap: 'border-[#171717]' },
    md: { h: 'h-[18px]', w: 'w-[54px]', gap: 'border-[#171717]' },
    lg: { h: 'h-[22px]', w: 'w-[66px]', gap: 'border-[#171717]' },
};

/**
 * Three-part stadium gauge: semicircle caps via rounded-full on outer shell.
 * 1 filled = negative (red), 2 = neutral (grey), 3 = positive (white).
 */
export function SentimentTriGauge({
    value,
    label,
    size = 'md',
    className = '',
    title,
}) {
    let tier = null;
    if (label != null && label !== '') {
        tier = sentimentLabelToTier(label);
    }
    if (tier == null && value != null) {
        tier = sentimentScoreToTier(value);
    }

    const s = SIZE_MAP[size] || SIZE_MAP.md;
    const aria =
        title ||
        (tier === 'positive' ? 'Positive sentiment' : tier === 'neutral' ? 'Neutral sentiment' : tier === 'negative' ? 'Negative sentiment' : 'Sentiment not available');

    if (!tier) {
        return (
            <div
                className={`inline-flex rounded-full overflow-hidden border border-[#333] bg-[#1a1a1a] ${s.h} ${s.w} ${className}`}
                role="img"
                aria-label={aria}
            >
                <div className={`flex-1 h-full ${s.gap} border-r border-[#262626] bg-[#2a2a2a]`} />
                <div className={`flex-1 h-full ${s.gap} border-r border-[#262626] bg-[#2a2a2a]`} />
                <div className="flex-1 h-full bg-[#2a2a2a]" />
            </div>
        );
    }

    const { count, active, inactive } = TIER_FILL[tier];

    return (
        <div
            className={`inline-flex rounded-full overflow-hidden border border-[#404040] shadow-inner ${s.h} ${s.w} ${className}`}
            role="img"
            aria-label={aria}
        >
            <div className={`flex-1 h-full border-r ${s.gap} ${count >= 1 ? active : inactive}`} />
            <div className={`flex-1 h-full border-r ${s.gap} ${count >= 2 ? active : inactive}`} />
            <div className={`flex-1 h-full ${count >= 3 ? active : inactive}`} />
        </div>
    );
}

/** Same 0–100 mapping as scoring engine: positive → 100, neutral → 62.5, negative → 0. */
const LABEL_TO_PERCENT = { positive: 100, neutral: 62.5, negative: 0 };

export function sentimentLabelToApproxPercent(label) {
    const t = sentimentLabelToTier(label);
    if (!t) return null;
    return LABEL_TO_PERCENT[t];
}

/**
 * Text-only sentiment: primary % (from 0–100 number or positive/neutral/negative label) plus optional inline trend (↑/↓ + % + suffix).
 * Replaces tri-bar “pill” gauges across the app.
 */
export function SentimentPercentDisplay({
    label,
    value,
    trendPct,
    trendSuffix = '',
    align = 'end',
    size = 'md',
    className = '',
}) {
    let pct = null;
    if (value != null && typeof value === 'number' && !Number.isNaN(value)) {
        pct = Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
    } else if (label != null && label !== '' && label !== 'n/a') {
        pct = sentimentLabelToApproxPercent(label);
    }
    const justify =
        align === 'center' ? 'justify-center' : align === 'start' ? 'justify-start' : 'justify-end';
    const mainCls =
        size === 'lg' ? 'text-[15px]' : size === 'sm' ? 'text-[11px]' : 'text-[13px]';
    if (pct == null) {
        return (
            <span className={`text-[#555] tabular-nums text-[11px] ${justify} flex ${className}`}>—</span>
        );
    }
    const tr = trendPct != null && Number.isFinite(Number(trendPct)) ? Number(trendPct) : null;
    return (
        <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 ${justify} ${className}`}>
            <span className={`font-semibold tabular-nums text-white ${mainCls}`}>{pct.toFixed(1)}%</span>
            {tr != null && (
                <span className="inline-flex items-center gap-1 shrink-0">
                    <TrendPill delta={tr} format="percent" />
                    {trendSuffix ? <span className="text-[10px] text-[#666]">{trendSuffix}</span> : null}
                </span>
            )}
        </span>
    );
}

export default SentimentTriGauge;
