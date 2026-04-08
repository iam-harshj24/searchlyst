import React from 'react';
import { ChatGPTLogo, GeminiLogo, GoogleLogo, PerplexityLogo } from '@/components/landing/AILogos';

/**
 * Left → right stacking: left sits under right (higher z-index on the right).
 * Matches product reference: ChatGPT → Google → Perplexity; Gemini follows.
 */
export const ENGINE_STACK_DISPLAY_ORDER = ['chatgpt', 'googleAI', 'perplexity', 'gemini'];

const SIZE_MAP = {
    sm: { box: 'w-7 h-7', icon: 'w-[15px] h-[15px]', overlap: '-ml-2' },
    md: { box: 'w-8 h-8', icon: 'w-[17px] h-[17px]', overlap: '-ml-2.5' },
    lg: { box: 'w-9 h-9', icon: 'w-5 h-5', overlap: '-ml-3' },
};

function EngineTile({ engineKey, sizeCfg, dimmed }) {
    const { box, icon } = sizeCfg;
    const base = `${box} rounded-[10px] flex items-center justify-center shrink-0 border-2 border-white shadow-sm ring-0`;
    const dim = dimmed ? 'opacity-[0.38] grayscale-[0.3]' : 'opacity-100';

    if (engineKey === 'chatgpt') {
        return (
            <span className={`${base} bg-[#10a37f] ${dim}`} title="ChatGPT">
                <ChatGPTLogo className={`${icon} text-white`} />
            </span>
        );
    }
    if (engineKey === 'googleAI') {
        return (
            <span className={`${base} bg-white ${dim}`} title="Google AI Overviews">
                <GoogleLogo className={icon} />
            </span>
        );
    }
    if (engineKey === 'perplexity') {
        return (
            <span className={`${base} bg-[#0d3d3d] ${dim}`} title="Perplexity">
                <img
                    src="/perplexity.png"
                    alt=""
                    className={`${icon} object-contain`}
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
            </span>
        );
    }
    if (engineKey === 'gemini') {
        return (
            <span className={`${base} bg-[#1a1a1a] ${dim}`} title="Gemini">
                <GeminiLogo className={`${icon} text-[#4285f4]`} />
            </span>
        );
    }
    return null;
}

/**
 * @param {Object} props
 * @param {string[]} [props.order] — engine keys to show (subset allowed)
 * @param {Record<string, { hasResponse?: boolean, mentioned?: boolean }>} [props.byEngine]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.className]
 * @param {boolean} [props.legend] — if true, all tiles fully opaque (column header sample)
 * @param {boolean} [props.onlyActiveEngines] — if true, render only engines with response or brand mention (no dimmed stack)
 */
export function StackedEngineIcons({
    order = ENGINE_STACK_DISPLAY_ORDER,
    byEngine = {},
    size = 'md',
    className = '',
    legend = false,
    onlyActiveEngines = false,
}) {
    const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;
    let keys = (order || []).filter((k) => ENGINE_STACK_DISPLAY_ORDER.includes(k));

    if (onlyActiveEngines && !legend) {
        keys = keys.filter((ek) => {
            const st = byEngine[ek] || {};
            return st.hasResponse || st.mentioned;
        });
    }

    if (keys.length === 0) return null;

    return (
        <div className={`inline-flex flex-row items-center pl-0.5 ${className}`} role="group" aria-label="AI models">
            {keys.map((ek, i) => {
                const st = byEngine[ek] || {};
                const active = legend || st.hasResponse || st.mentioned;
                const dimmed = !legend && !active;
                return (
                    <div
                        key={ek}
                        className={`relative ${i === 0 ? '' : sizeCfg.overlap}`}
                        style={{ zIndex: i + 1 }}
                    >
                        <EngineTile engineKey={ek} sizeCfg={sizeCfg} dimmed={dimmed} />
                    </div>
                );
            })}
        </div>
    );
}

/** Build `byEngine` from a list of engine keys (e.g. citation URL rows). */
export function buildStackStatesFromEngineKeyList(rawKeys) {
    const keys = (rawKeys || []).map((k) => String(k || '').toLowerCase().replace(/\s/g, ''));
    const out = {};
    for (const ek of ENGINE_STACK_DISPLAY_ORDER) {
        const k = ek === 'googleAI' ? 'googleai' : ek;
        out[ek] = { hasResponse: keys.includes(k), mentioned: false };
    }
    return out;
}

/** Build `byEngine` from Prompt Intel / scan row shape `{ engines: { perplexity: { ... } } }`. */
export function buildStackStatesFromPromptEngines(engines) {
    const out = {};
    if (!engines || typeof engines !== 'object') return out;
    for (const ek of ENGINE_STACK_DISPLAY_ORDER) {
        const e = engines[ek];
        if (!e || typeof e !== 'object') {
            out[ek] = { hasResponse: false, mentioned: false };
            continue;
        }
        const t = String(e.rawText || e.snippet || '').trim().length;
        const c = Array.isArray(e.citations) ? e.citations.length : 0;
        const st = String(e.status || '');
        const hasResponse =
            t > 0 || c > 0 || st.includes('✓') || st.toLowerCase().includes('received');
        out[ek] = { hasResponse, mentioned: !!e.mentioned };
    }
    return out;
}
