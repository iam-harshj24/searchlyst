import React from 'react';

/**
 * Maps 0–100 sentiment index to tier: negative (1 bar red), neutral (2 bars grey), positive (3 bars white).
 */
export function sentimentScoreToTier(score) {
    if (score == null || Number.isNaN(Number(score))) return null;
    const n = Number(score);
    if (n >= 75) return 'positive';
    if (n >= 50) return 'neutral';
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

export default SentimentTriGauge;
