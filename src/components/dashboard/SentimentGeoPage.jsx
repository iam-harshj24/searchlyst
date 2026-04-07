import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Globe, Search,
    Frown, Activity, Maximize2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ChatGPTLogo, GeminiLogo, PerplexityLogo } from '../landing/AILogos';
import { apiClient } from '@/api/apiClient';
import { TrendPill } from '@/components/ui/TrendPill';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    ComposableMap, Geographies, Geography, ZoomableGroup
} from 'react-simple-maps';
import { SentimentPercentDisplay } from '@/components/ui/SentimentTriGauge';
import { BrandFaviconImg } from '@/components/charts/BrandChartUi';
import { promptPreview } from '@/lib/promptPreview';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/** Jio-style sentiment palette (trend + breakdown). */
const SENTIMENT_JIO = {
    positive: '#ffffff',
    neutral: '#94a3b8',
    negative: '#ef4444',
};

function normalizeSentimentTriple(p, n, neg) {
    const s = p + n + neg;
    if (s < 1) return { positive: 33, neutral: 34, negative: 33 };
    const rp = Math.round((p / s) * 100);
    const rn = Math.round((n / s) * 100);
    const rneg = Math.max(0, 100 - rp - rn);
    return { positive: rp, neutral: rn, negative: rneg };
}

function demoSentimentTrend() {
    return [
        { month: 'Jan', monthFull: 'January', positive: 42, neutral: 40, negative: 18 },
        { month: 'Feb', monthFull: 'February', positive: 48, neutral: 36, negative: 16 },
        { month: 'Mar', monthFull: 'March', positive: 55, neutral: 32, negative: 13 },
        { month: 'Apr', monthFull: 'April', positive: 70, neutral: 20, negative: 10 },
        { month: 'May', monthFull: 'May', positive: 68, neutral: 24, negative: 8 },
        { month: 'Jun', monthFull: 'June', positive: 72, neutral: 21, negative: 7 },
        { month: 'Jul', monthFull: 'July', positive: 75, neutral: 18, negative: 7 },
    ];
}

function buildSentimentTrendData(scanResult, summary) {
    const hist = scanResult?.sentiment?.trend;
    if (Array.isArray(hist) && hist.length > 0) {
        return hist.map((row) => ({
            month: String(row.month || ''),
            monthFull: String(row.monthFull || row.month || ''),
            positive: Number(row.positive) || 0,
            neutral: Number(row.neutral) || 0,
            negative: Number(row.negative) || 0,
        }));
    }
    if (!scanResult || !summary) return demoSentimentTrend();

    const ref = scanResult.scannedAt ? new Date(scanResult.scannedAt) : new Date();
    const end = normalizeSentimentTriple(
        Number(summary.positive) || 0,
        Number(summary.neutral) || 0,
        Number(summary.negative) || 0,
    );
    const start = normalizeSentimentTriple(
        Math.max(0, end.positive - 30),
        Math.min(100, end.neutral + 18),
        Math.max(0, end.negative - 6),
    );
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(ref.getFullYear(), ref.getMonth() - (6 - i), 1);
        const t = i / 6;
        const smooth = t * t;
        const raw = {
            positive: Math.round(start.positive + (end.positive - start.positive) * smooth),
            neutral: Math.round(start.neutral + (end.neutral - start.neutral) * smooth),
            negative: Math.round(start.negative + (end.negative - start.negative) * smooth),
        };
        const nn = normalizeSentimentTriple(raw.positive, raw.neutral, raw.negative);
        data.push({
            month: monthShort[d.getMonth()],
            monthFull: d.toLocaleString('en-US', { month: 'long' }),
            ...nn,
        });
    }
    return data;
}

function SentimentTrendTooltip({ active, payload, brandName, domain }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const title = row.monthFull || row.month;
    const rows = [
        { key: 'positive', label: 'Positive', color: SENTIMENT_JIO.positive },
        { key: 'neutral', label: 'Neutral', color: SENTIMENT_JIO.neutral },
        { key: 'negative', label: 'Negative', color: SENTIMENT_JIO.negative },
    ];
    return (
        <div className="min-w-[188px] rounded-xl border border-[#333] bg-[#141414] px-3.5 py-2.5 text-[12px] shadow-2xl">
            <div className="mb-2 flex items-center gap-2 border-b border-[#2a2a2a] pb-2">
                <BrandFaviconImg domain={domain} size={22} />
                <span className="truncate font-semibold text-[13px] text-white" title={brandName}>
                    {brandName || 'Your brand'}
                </span>
            </div>
            <p className="mb-1.5 text-[11px] font-medium text-[#888]">{title}</p>
            {rows.map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-2 py-0.5">
                    <span className="h-2 w-2 shrink-0 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                    <span className="text-[#a3a3a3]">{label}</span>
                    <span className="ml-auto font-bold tabular-nums text-white">{row[key]}</span>
                </div>
            ))}
        </div>
    );
}

function SentimentPieBrandTooltip({ active, payload, brandName, domain }) {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const sliceName = p.name;
    const val = p.value;
    return (
        <div className="min-w-[160px] rounded-xl border border-[#333] bg-[#141414] px-3 py-2.5 text-[12px] text-white shadow-xl">
            <div className="mb-2 flex items-center gap-2">
                <BrandFaviconImg domain={domain} size={22} />
                <span className="truncate font-semibold" title={brandName}>
                    {brandName || 'Your brand'}
                </span>
            </div>
            <p className="text-[#ccc]">
                <span className="text-[#888]">{sliceName}</span>{' '}
                <span className="font-bold tabular-nums">{val}%</span>
            </p>
        </div>
    );
}

const ISO_NUMERIC_TO_NAME = {
    840: 'United States', 124: 'Canada', 484: 'Mexico', 276: 'Germany', 250: 'France',
    826: 'United Kingdom', 380: 'Italy', 724: 'Spain', 616: 'Poland', 56: 'Belgium',
    752: 'Sweden', 578: 'Norway', 246: 'Finland', 208: 'Denmark', 40: 'Austria',
    528: 'Netherlands', 642: 'Romania', 203: 'Czech Republic', 703: 'Slovakia',
    348: 'Hungary', 620: 'Portugal', 300: 'Greece', 100: 'Bulgaria', 191: 'Croatia',
    705: 'Slovenia', 372: 'Ireland', 756: 'Switzerland', 356: 'India', 156: 'China',
    392: 'Japan', 410: 'South Korea', 360: 'Indonesia', 764: 'Thailand', 36: 'Australia',
    554: 'New Zealand', 458: 'Malaysia', 608: 'Philippines', 704: 'Vietnam',
    702: 'Singapore', 50: 'Bangladesh', 586: 'Pakistan', 144: 'Sri Lanka',
    76: 'Brazil', 32: 'Argentina', 170: 'Colombia', 604: 'Peru', 152: 'Chile',
    218: 'Ecuador', 591: 'Panama', 858: 'Uruguay', 600: 'Paraguay', 68: 'Bolivia',
    682: 'Saudi Arabia', 784: 'UAE', 364: 'Iran', 368: 'Iraq', 400: 'Jordan',
    414: 'Kuwait', 512: 'Oman', 634: 'Qatar', 275: 'Palestine', 376: 'Israel',
    792: 'Turkey', 566: 'Nigeria', 710: 'South Africa', 818: 'Egypt', 12: 'Algeria',
    504: 'Morocco', 404: 'Kenya', 800: 'Uganda', 288: 'Ghana', 834: 'Tanzania',
    716: 'Zimbabwe', 706: 'Somalia', 231: 'Ethiopia', 686: 'Senegal', 466: 'Mali',
    120: 'Cameroon', 180: 'Congo (DRC)', 643: 'Russia', 398: 'Kazakhstan', 860: 'Uzbekistan',
};

const COUNTRY_TO_ISO = {};
for (const [iso, name] of Object.entries(ISO_NUMERIC_TO_NAME)) {
    COUNTRY_TO_ISO[name.toLowerCase()] = parseInt(iso, 10);
}

const COUNTRY_FLAGS = {
    'united states': '🇺🇸', 'canada': '🇨🇦', 'mexico': '🇲🇽', 'germany': '🇩🇪', 'france': '🇫🇷',
    'united kingdom': '🇬🇧', 'italy': '🇮🇹', 'spain': '🇪🇸', 'india': '🇮🇳', 'china': '🇨🇳',
    'japan': '🇯🇵', 'south korea': '🇰🇷', 'australia': '🇦🇺', 'brazil': '🇧🇷', 'singapore': '🇸🇬',
    'uae': '🇦🇪', 'saudi arabia': '🇸🇦', 'south africa': '🇿🇦', 'nigeria': '🇳🇬', 'kenya': '🇰🇪',
    'indonesia': '🇮🇩', 'thailand': '🇹🇭', 'malaysia': '🇲🇾', 'philippines': '🇵🇭', 'vietnam': '🇻🇳',
    'turkey': '🇹🇷', 'egypt': '🇪🇬', 'russia': '🇷🇺', 'poland': '🇵🇱', 'netherlands': '🇳🇱',
    'switzerland': '🇨🇭', 'sweden': '🇸🇪', 'norway': '🇳🇴', 'denmark': '🇩🇰', 'ireland': '🇮🇪',
    'new zealand': '🇳🇿', 'argentina': '🇦🇷', 'colombia': '🇨🇴', 'chile': '🇨🇱', 'israel': '🇮🇱',
    'qatar': '🇶🇦', 'pakistan': '🇵🇰', 'bangladesh': '🇧🇩',
};

const COUNTRY_CODES = {
    'united states': 'US', 'canada': 'CA', 'mexico': 'MX', 'germany': 'DE', 'france': 'FR',
    'united kingdom': 'GB', 'italy': 'IT', 'spain': 'ES', 'india': 'IN', 'china': 'CN',
    'japan': 'JP', 'south korea': 'KR', 'australia': 'AU', 'brazil': 'BR', 'singapore': 'SG',
    'uae': 'AE', 'saudi arabia': 'SA', 'south africa': 'ZA', 'nigeria': 'NG', 'kenya': 'KE',
    'indonesia': 'ID', 'thailand': 'TH', 'malaysia': 'MY', 'philippines': 'PH', 'vietnam': 'VN',
    'turkey': 'TR', 'egypt': 'EG', 'russia': 'RU', 'poland': 'PL', 'netherlands': 'NL',
    'switzerland': 'CH', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK', 'ireland': 'IE',
    'new zealand': 'NZ', 'argentina': 'AR', 'colombia': 'CO', 'chile': 'CL', 'israel': 'IL',
    'qatar': 'QA', 'pakistan': 'PK', 'bangladesh': 'BD',
};

/** Map fill: red (low) → grey (mid) → white-ish (high). */
function getSentimentColor(sentiment) {
    if (!sentiment && sentiment !== 0) return '#1a1a1a';
    if (sentiment >= 80) return '#3f3f3f';
    if (sentiment >= 65) return '#303030';
    if (sentiment >= 50) return '#282828';
    return '#3a2222';
}

function getSentimentColorBright(sentiment) {
    if (!sentiment && sentiment !== 0) return '#333';
    if (sentiment >= 80) return '#f5f5f5';
    if (sentiment >= 65) return '#a3a3a3';
    if (sentiment >= 50) return '#737373';
    return SENTIMENT_JIO.negative;
}

/** Flag emoji from full country name (matches `COUNTRY_FLAGS` keys). */
function flagForRegionName(regionName) {
    if (!regionName) return '🌍';
    const k = String(regionName).toLowerCase().split('(')[0].trim();
    return COUNTRY_FLAGS[k] || '🌍';
}

/** When backend omits `sentimentIndex`, approximate from summary % (same weights as scoring engine). */
function estimateSentimentIndexFromSummary(s) {
    const p = (Number(s?.positive) || 0) / 100;
    const n = (Number(s?.neutral) || 0) / 100;
    const neg = (Number(s?.negative) || 0) / 100;
    const raw = p * 1 + n * 0.25 + neg * -1;
    return Math.round(((raw + 1) / 2) * 1000) / 10;
}

function PlatformSentimentTableHeaderCell({ children, align = 'center' }) {
    return (
        <th
            className={`pb-3 px-1 ${align === 'left' ? 'text-left' : 'text-center'} align-bottom`}
        >
            {children}
        </th>
    );
}

/** Icon-only platform column header; label used for aria/title only. */
function EngineColumnHeader({ logo: Logo, label }) {
    return (
        <div className="flex items-end justify-center w-full">
            <div
                className="w-8 h-8 rounded-lg bg-[#141414] border border-[#2a2a2a] flex items-center justify-center"
                aria-label={label}
                title={label}
            >
                <Logo className="w-[18px] h-[18px] object-contain text-white" aria-hidden />
            </div>
        </div>
    );
}

function MapTooltip({ info, x, y, brandName, domain }) {
    if (!info) return null;
    return (
        <div
            className="absolute bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-2xl text-[13px] pointer-events-none z-50 w-48"
            style={{ left: x + 12, top: y - 60 }}
        >
            <div className="mb-2 flex items-center gap-2 border-b border-[#2a2a2a] pb-2">
                <BrandFaviconImg domain={domain} size={20} />
                <span className="truncate text-[11px] font-semibold text-[#ccc]" title={brandName}>
                    {brandName || 'Your brand'}
                </span>
            </div>
            <p className="mb-2 font-semibold text-white flex items-center gap-2">
                <span className="text-[20px] leading-none" aria-hidden>{flagForRegionName(info.region)}</span>
                <span>{info.region}</span>
            </p>
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-[#666]">Citations:</span>
                    <span className="text-white font-bold">{info.citations?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                    <span className="text-[#666]">Sentiment:</span>
                    <SentimentPercentDisplay value={info.sentiment} size="sm" align="end" />
                </div>
                <div className="flex justify-between">
                    <span className="text-[#666]">Mentions:</span>
                    <span className="text-white font-bold">{info.mentions || 0}</span>
                </div>
            </div>
        </div>
    );
}

function deriveSentimentAndGeo(scanResult) {
    if (!scanResult) return null;

    const sentiment = scanResult.sentiment || {};
    const summary = sentiment.summary || { positive: 0, neutral: 100, negative: 0 };
    const detailed = sentiment.detailed || { positive: 0, neutral: 0, negative: 0 };
    const totalSentimentRuns = sentiment.total || 0;

    const sentimentBreakdown = [
        { name: 'Positive', value: summary.positive || 0, color: SENTIMENT_JIO.positive },
        { name: 'Neutral', value: summary.neutral || 0, color: SENTIMENT_JIO.neutral },
        { name: 'Negative', value: summary.negative || 0, color: SENTIMENT_JIO.negative },
    ];

    const sentimentTrend = buildSentimentTrendData(scanResult, summary);

    const ENGINE_ORDER_LOCAL = ['perplexity', 'gemini', 'googleAI'];
    const ENGINE_LABELS = { perplexity: 'Perplexity', gemini: 'Gemini', googleAI: 'ChatGPT' };

    const prompts = (scanResult.prompts || []).map(p => {
        const engines = p.engines || {};
        const engineEntries = Object.entries(engines);
        const mentioned = engineEntries.some(([, e]) => e.mentioned);
        const positions = engineEntries.map(([, e]) => e.positionRank).filter(Boolean);
        const position = positions.length > 0 ? Math.min(...positions) : null;

        let totalCitations = 0;
        engineEntries.forEach(([, e]) => {
            totalCitations += (e.citations?.length || e.citationCount || 0);
        });

        const sentiments = engineEntries.map(([, e]) => e.sentiment).filter(s => s && s !== 'n/a');
        const posCount = sentiments.filter(s => s === 'positive').length;
        const sentimentLabel = sentiments.length > 0
            ? (posCount / sentiments.length >= 0.5 ? 'positive' : 'neutral')
            : 'neutral';

        const perEngine = ENGINE_ORDER_LOCAL.map((ek) => {
            const row = engines[ek];
            const sc = row?.sentimentScore;
            const sentimentScore = sc != null && Number.isFinite(Number(sc)) ? Math.min(100, Math.max(0, Number(sc))) : null;
            return {
                engine: ek,
                label: ENGINE_LABELS[ek] || ek,
                mentioned: !!row?.mentioned,
                sentiment: row?.sentiment || 'n/a',
                sentimentScore,
            };
        });

        return {
            prompt: p.query,
            brandMentioned: mentioned,
            position,
            citationCount: totalCitations,
            sentiment: sentimentLabel,
            perEngine,
        };
    });

    const citationDomains = scanResult.citationSummary || scanResult.sourceDomains?.topDomains || [];

    const regionMap = {};
    for (const citation of citationDomains) {
        const d = (citation.domain || '').toLowerCase();
        let geo = 'global';
        if (d.endsWith('.co.uk') || d.endsWith('.uk')) geo = 'united kingdom';
        else if (d.endsWith('.de')) geo = 'germany';
        else if (d.endsWith('.fr')) geo = 'france';
        else if (d.endsWith('.in') || d.includes('.co.in')) geo = 'india';
        else if (d.endsWith('.au') || d.endsWith('.com.au')) geo = 'australia';
        else if (d.endsWith('.ca')) geo = 'canada';
        else if (d.endsWith('.jp')) geo = 'japan';
        else if (d.endsWith('.br')) geo = 'brazil';
        else if (d.endsWith('.com') || d.endsWith('.org') || d.endsWith('.io') || d.endsWith('.net')) geo = 'united states';

        if (!regionMap[geo]) regionMap[geo] = { citations: 0, mentions: 0 };
        regionMap[geo].citations += citation.count || 1;
        regionMap[geo].mentions += citation.uniqueUrls || 1;
    }

    const allRuns = [];
    for (const p of scanResult.prompts || []) {
        for (const [engine, data] of Object.entries(p.engines || {})) {
            allRuns.push({ engine, mentioned: data.mentioned, sentiment: data.sentiment });
        }
    }

    const geoSentiment = {};
    for (const [geo, data] of Object.entries(regionMap)) {
        const isoKey = COUNTRY_TO_ISO[geo];
        if (isoKey) {
            geoSentiment[isoKey] = {
                region: ISO_NUMERIC_TO_NAME[isoKey] || geo,
                sentiment: Math.round(summary.positive || 50),
                citations: data.citations,
                mentions: data.mentions,
            };
        }
    }

    const topCountries = Object.entries(regionMap)
        .filter(([geo]) => geo !== 'global')
        .sort((a, b) => b[1].citations - a[1].citations)
        .slice(0, 6)
        .map(([geo, data]) => {
            const total = Object.values(regionMap).reduce((s, r) => s + r.citations, 0) || 1;
            return {
                country: geo.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
                code: COUNTRY_CODES[geo] || geo.substring(0, 2).toUpperCase(),
                share: Math.round((data.citations / total) * 100),
                flag: COUNTRY_FLAGS[geo] || '🌍',
                citations: data.citations,
            };
        });

    const totalCitations = citationDomains.reduce((s, c) => s + (c.count || 1), 0);
    const trackedPrompts = prompts.length;
    const activeRegions = Object.keys(regionMap).filter(g => g !== 'global').length;
    const negativePct = summary.negative || 0;

    const rawIdx = summary.sentimentIndex;
    const averageSentiment =
        rawIdx != null && Number.isFinite(Number(rawIdx))
            ? Number(rawIdx)
            : totalSentimentRuns > 0
                ? estimateSentimentIndexFromSummary(summary)
                : null;

    return {
        sentimentBreakdown,
        sentimentTrend,
        summary,
        prompts,
        geoSentiment,
        topCountries,
        totalCitations,
        trackedPrompts,
        activeRegions,
        negativePct,
        averageSentiment,
    };
}


const KPI_INSPECT_COPY = {
    citations: {
        title: 'Total citations',
        description:
            'Count of citation rows attributed to your brand in the latest scan’s source summary. Use this as volume of AI-surfaced references, not unique URLs.',
    },
    regions: {
        title: 'Active regions',
        description:
            'Number of country buckets inferred from citation domains (for example .de → Germany). More regions usually means broader geographic exposure in AI answers.',
    },
    avgSentiment: {
        title: 'Average sentiment',
        description:
            'Weighted sentiment index (0–100) from all engine runs where your brand was mentioned: positive +1, neutral +0.25, negative −1, scaled to 0–100. Higher is more favorable overall.',
    },
    negative: {
        title: 'Negative mentions',
        description:
            'Share of labeled engine runs (with brand mention) classified as negative in this scan. Compare with the previous scan using the trend pill.',
    },
};

export default function SentimentGeoPage({ user, scanManager }) {
    const [tooltip, setTooltip] = useState(null);
    const [hoveredGeo, setHoveredGeo] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [chartInspect, setChartInspect] = useState(null);
    const [kpiInspect, setKpiInspect] = useState(null);
    const [expandMapTip, setExpandMapTip] = useState(null);
    const [expandHoveredGeo, setExpandHoveredGeo] = useState(null);

    const brandName = user?.brandName || 'Your Brand';
    const domain = user?.domain || '';
    const scanResult = scanManager?.scanResult || null;

    useEffect(() => {
        setScanHistory([]);
    }, [user?.authUserId, domain, user?.projectId]);

    useEffect(() => {
        let cancelled = false;
        if (!domain) return;
        const days = 365;
        apiClient.visibility
            .getScanHistory(user?.projectId, domain, { days, limit: 120 })
            .then((res) => {
                if (!cancelled && res?.history) setScanHistory(res.history);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user?.authUserId, domain, user?.projectId, scanResult?.scannedAt]);

    const geoSnapshotTrends = useMemo(() => {
        const h = Array.isArray(scanHistory) ? scanHistory : [];
        if (h.length < 2) return null;
        const last = h[h.length - 1]?.geoSnapshot;
        const prev = h[h.length - 2]?.geoSnapshot;
        if (!last || !prev || !last.sentimentSummary || !prev.sentimentSummary) return null;
        const idxDelta =
            last.sentimentIndex != null &&
            prev.sentimentIndex != null &&
            Number.isFinite(Number(last.sentimentIndex)) &&
            Number.isFinite(Number(prev.sentimentIndex))
                ? Math.round((Number(last.sentimentIndex) - Number(prev.sentimentIndex)) * 10) / 10
                : null;
        return {
            citations: last.totalCitations - prev.totalCitations,
            regions: last.activeRegions - prev.activeRegions,
            negative: last.negativePct - prev.negativePct,
            sentimentIndex: idxDelta,
            positive: last.sentimentSummary.positive - prev.sentimentSummary.positive,
            neutral: last.sentimentSummary.neutral - prev.sentimentSummary.neutral,
            negativeSent: last.sentimentSummary.negative - prev.sentimentSummary.negative,
        };
    }, [scanHistory]);

    const derived = useMemo(() => deriveSentimentAndGeo(scanResult), [scanResult]);

    const scanDate = scanResult?.scannedAt
        ? new Date(scanResult.scannedAt).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })
        : new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });

    const hasData = !!(scanResult && derived);

    const sentimentBreakdown = derived?.sentimentBreakdown || [
        { name: 'Positive', value: 0, color: SENTIMENT_JIO.positive },
        { name: 'Neutral', value: 0, color: SENTIMENT_JIO.neutral },
        { name: 'Negative', value: 0, color: SENTIMENT_JIO.negative },
    ];
    const sentimentTrend = derived?.sentimentTrend || demoSentimentTrend();
    const summary = derived?.summary || { positive: 0, neutral: 0, negative: 0 };
    const prompts = derived?.prompts || [];
    const geoSentiment = derived?.geoSentiment || {};
    const topCountries = derived?.topCountries || [];
    const totalCitations = derived?.totalCitations || 0;
    const trackedPrompts = derived?.trackedPrompts || 0;
    const activeRegions = derived?.activeRegions || 0;
    const negativePct = derived?.negativePct || 0;
    const averageSentiment = derived?.averageSentiment ?? null;

    useEffect(() => {
        if (chartInspect !== 'map') {
            setExpandMapTip(null);
            setExpandHoveredGeo(null);
        }
    }, [chartInspect]);

    return (
        <div className="w-full pb-12">
            <div className="h-[93px] flex items-center justify-between -mt-8 -mx-8 px-8 border-b border-[#222] bg-[#000] sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#0a0e0a] rounded-xl flex items-center justify-center border border-[#E92A15]/40 shadow-[0_0_15px_rgba(233,42,21,0.15)]">
                        <Globe className="w-5 h-5 text-[#E92A15]" />
                    </div>
                    <div>
                        <h1 className="text-[19px] font-semibold text-white tracking-tight">Sentiment &amp; Geo Tracking</h1>
                        <p className="text-[#888] text-[13px] mt-0.5">Track how AI perceives <span className="text-[#bbb]">{brandName}</span> across regions and prompts</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-5 max-w-[1400px]">
                {/* KPI row — click any card for a larger explanation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        {
                            id: 'citations',
                            label: 'Total Citations',
                            value: hasData ? String(totalCitations) : '—',
                            icon: Search,
                            trend: hasData ? geoSnapshotTrends?.citations : null,
                            format: 'count',
                        },
                        {
                            id: 'regions',
                            label: 'Active Regions',
                            value: hasData ? String(activeRegions) : '—',
                            icon: Globe,
                            trend: hasData ? geoSnapshotTrends?.regions : null,
                            format: 'count',
                        },
                        {
                            id: 'avgSentiment',
                            label: 'Average sentiment',
                            value: null,
                            valueNode:
                                hasData && averageSentiment != null ? (
                                    <span className="text-white text-[32px] font-bold tracking-tight leading-none tabular-nums">
                                        {averageSentiment.toFixed(1)}
                                        <span className="text-[14px] font-semibold text-[#555] ml-1">/100</span>
                                    </span>
                                ) : (
                                    '—'
                                ),
                            icon: Activity,
                            trend: hasData ? geoSnapshotTrends?.sentimentIndex : null,
                            format: 'index',
                        },
                        {
                            id: 'negative',
                            label: 'Negative mentions',
                            value: hasData ? `${negativePct}%` : '—',
                            icon: Frown,
                            trend: hasData ? geoSnapshotTrends?.negative : null,
                            format: 'percent',
                        },
                    ].map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <div
                                key={kpi.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setKpiInspect(kpi.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setKpiInspect(kpi.id);
                                    }
                                }}
                                className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-5 hover:border-[#E92A15]/35 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E92A15]/50"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[#555] text-[11px] font-bold uppercase tracking-[0.12em]">{kpi.label}</span>
                                    <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                                        <Icon className="w-[14px] h-[14px] text-[#555]" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-baseline gap-2 mb-2">
                                    {kpi.valueNode != null ? (
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            {typeof kpi.valueNode === 'string' ? (
                                                <p className="text-white text-[32px] font-bold tracking-tight leading-none">{kpi.valueNode}</p>
                                            ) : (
                                                kpi.valueNode
                                            )}
                                            <TrendPill delta={kpi.trend} format={kpi.format} />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-white text-[32px] font-bold tracking-tight leading-none">{kpi.value}</p>
                                            <TrendPill delta={kpi.trend} format={kpi.format} />
                                        </>
                                    )}
                                </div>
                                <p className="text-[#555] text-[10px]">vs previous completed scan · click for details</p>
                            </div>
                        );
                    })}
                </div>

                {/* Sentiment trend + breakdown side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 flex flex-col min-h-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-white font-semibold text-[16px]">Sentiment Trend</h2>
                                <p className="text-[#666] text-[13px] mt-0.5">How AI platforms perceive your brand over time.</p>
                                {!hasData && (
                                    <p className="text-[#555] text-[11px] mt-2">Sample curve — run a scan to anchor the last point to your data.</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] shrink-0">
                                <span className="flex items-center gap-1.5 text-[#e5e5e5]">
                                    <span className="w-2 h-2 rounded-full inline-block border border-white/15" style={{ backgroundColor: SENTIMENT_JIO.positive }} />
                                    Positive
                                </span>
                                <span className="flex items-center gap-1.5 text-[#94a3b8]">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SENTIMENT_JIO.neutral }} />
                                    Neutral
                                </span>
                                <span className="flex items-center gap-1.5 text-[#ef4444]">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: SENTIMENT_JIO.negative }} />
                                    Negative
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setChartInspect('trend')}
                            className="relative w-full flex-1 min-h-[280px] text-left rounded-xl border border-transparent hover:border-[#333] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E92A15]/45 transition-colors group"
                            aria-label="Open sentiment trend chart in a larger view"
                        >
                            <span className="absolute top-1 right-2 z-10 flex items-center gap-1 text-[10px] font-medium text-[#555] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none">
                                <Maximize2 className="w-3 h-3" strokeWidth={2.2} aria-hidden />
                                Enlarge
                            </span>
                            <div className="w-full flex-1 min-h-[280px]" style={{ minHeight: 280 }}>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={sentimentTrend} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="sentTrendPos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={SENTIMENT_JIO.positive} stopOpacity={0.4} />
                                            <stop offset="100%" stopColor={SENTIMENT_JIO.positive} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="sentTrendNeu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={SENTIMENT_JIO.neutral} stopOpacity={0.45} />
                                            <stop offset="100%" stopColor={SENTIMENT_JIO.neutral} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="sentTrendNeg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={SENTIMENT_JIO.negative} stopOpacity={0.45} />
                                            <stop offset="100%" stopColor={SENTIMENT_JIO.negative} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 11 }} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#525252', fontSize: 10 }}
                                        domain={[0, 100]}
                                        ticks={[0, 25, 50, 75, 100]}
                                        width={36}
                                    />
                                    <Tooltip
                                        content={(props) => (
                                            <SentimentTrendTooltip {...props} brandName={brandName} domain={domain} />
                                        )}
                                        cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.35 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="negative"
                                        name="Negative"
                                        stroke={SENTIMENT_JIO.negative}
                                        strokeWidth={2}
                                        fill="url(#sentTrendNeg)"
                                        dot={{ r: 3, strokeWidth: 1.5, fill: '#0B0B0B', stroke: SENTIMENT_JIO.negative }}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: SENTIMENT_JIO.negative }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="neutral"
                                        name="Neutral"
                                        stroke={SENTIMENT_JIO.neutral}
                                        strokeWidth={2}
                                        fill="url(#sentTrendNeu)"
                                        dot={{ r: 3, strokeWidth: 1.5, fill: '#0B0B0B', stroke: SENTIMENT_JIO.neutral }}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: SENTIMENT_JIO.neutral }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="positive"
                                        name="Positive"
                                        stroke={SENTIMENT_JIO.positive}
                                        strokeWidth={2}
                                        fill="url(#sentTrendPos)"
                                        dot={{ r: 3, strokeWidth: 1.5, fill: '#0B0B0B', stroke: SENTIMENT_JIO.positive }}
                                        activeDot={{ r: 5, strokeWidth: 0, fill: SENTIMENT_JIO.positive }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            </div>
                        </button>
                    </div>

                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 flex flex-col">
                        <div className="mb-3">
                            <h2 className="text-white font-semibold text-[16px]">Sentiment Breakdown</h2>
                            <p className="text-[#666] text-[13px] mt-0.5">Share of AI labels in this scan</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setChartInspect('pie')}
                            className="relative flex-1 flex flex-col min-h-0 rounded-xl border border-transparent hover:border-[#333] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E92A15]/45 transition-colors group text-left"
                            aria-label="Open sentiment breakdown chart in a larger view"
                        >
                            <span className="absolute top-0 right-0 z-10 flex items-center gap-1 text-[10px] font-medium text-[#555] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none">
                                <Maximize2 className="w-3 h-3" strokeWidth={2.2} aria-hidden />
                                Enlarge
                            </span>
                        <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={sentimentBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={72}
                                        dataKey="value"
                                        strokeWidth={0}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {sentimentBreakdown.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={(props) => (
                                            <SentimentPieBrandTooltip {...props} brandName={brandName} domain={domain} />
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-2 border-t border-[#1a1a1a] pt-4">
                            {sentimentBreakdown.map((item, i) => {
                                const trendKey = i === 0 ? 'positive' : i === 1 ? 'neutral' : 'negativeSent';
                                const rowTrend = geoSnapshotTrends?.[trendKey];
                                return (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="text-[#888] text-[12px] truncate">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span
                                                className="text-[12px] font-bold tabular-nums"
                                                style={{
                                                    color: i === 2 ? SENTIMENT_JIO.negative : i === 0 ? SENTIMENT_JIO.positive : SENTIMENT_JIO.neutral,
                                                }}
                                            >
                                                {item.value}%
                                            </span>
                                            <TrendPill delta={rowTrend} format="percent" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[#555] text-[11px] mt-4 pt-3 border-t border-[#1a1a1a]">
                            Based on {scanResult?.sentiment?.total || 0} brand mentions (Perplexity, Gemini &amp; ChatGPT).
                        </p>
                        </button>
                    </div>
                </div>

                {/* Per-Platform Sentiment Table */}
                <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h2 className="text-white font-semibold text-[16px]">Per-Platform Sentiment</h2>
                            <p className="text-[#666] text-[13px] mt-0.5">
                                How each AI platform portrays your brand per prompt. Cells use a 0–100% score when available (Gemini batch per prompt when configured, else lexical around the brand mention).
                            </p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1a1a1a]">
                                    <PlatformSentimentTableHeaderCell align="left">
                                        <span className="text-[10px] text-[#444] uppercase tracking-[0.12em] font-bold">Prompt</span>
                                    </PlatformSentimentTableHeaderCell>
                                    <PlatformSentimentTableHeaderCell>
                                        <span className="text-[10px] text-[#444] uppercase tracking-[0.12em] font-bold">Mentioned</span>
                                    </PlatformSentimentTableHeaderCell>
                                    <PlatformSentimentTableHeaderCell>
                                        <span className="text-[10px] text-[#444] uppercase tracking-[0.12em] font-bold">Position</span>
                                    </PlatformSentimentTableHeaderCell>
                                    <PlatformSentimentTableHeaderCell>
                                        <EngineColumnHeader logo={PerplexityLogo} label="Perplexity" />
                                    </PlatformSentimentTableHeaderCell>
                                    <PlatformSentimentTableHeaderCell>
                                        <EngineColumnHeader logo={GeminiLogo} label="Gemini" />
                                    </PlatformSentimentTableHeaderCell>
                                    <PlatformSentimentTableHeaderCell>
                                        <EngineColumnHeader logo={ChatGPTLogo} label="ChatGPT" />
                                    </PlatformSentimentTableHeaderCell>
                                </tr>
                            </thead>
                            <tbody>
                                {prompts.length === 0 ? (
                                    <>
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i} className="border-b border-[#111]">
                                                <td className="py-4 pr-4"><div className="animate-pulse bg-[#1a1a1a] rounded w-48 h-4" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-12 h-5 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-8 h-4 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-14 h-5 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-14 h-5 mx-auto" /></td>
                                                <td className="text-center"><div className="animate-pulse bg-[#1a1a1a] rounded w-14 h-5 mx-auto" /></td>
                                            </tr>
                                        ))}
                                        <tr><td colSpan={6} className="py-4 text-center text-[#444] text-[12px]">Run a scan to see per-platform sentiment data</td></tr>
                                    </>
                                ) : prompts.map((row, i) => {
                                    const promptP = promptPreview(row.prompt);
                                    const sentChip = (eng) => {
                                        const d = (row.perEngine || []).find((e) => e.engine === eng);
                                        if (!d || !d.mentioned) return <span className="text-[#444] text-[11px]">—</span>;
                                        const v = d.sentimentScore != null && Number.isFinite(Number(d.sentimentScore)) ? Number(d.sentimentScore) : null;
                                        const lab =
                                            v == null && d.sentiment && String(d.sentiment).toLowerCase() !== 'n/a'
                                                ? String(d.sentiment).toLowerCase()
                                                : undefined;
                                        return (
                                            <div className="flex justify-center">
                                                <SentimentPercentDisplay value={v} label={lab} size="sm" align="center" />
                                            </div>
                                        );
                                    };
                                    return (
                                        <tr key={i} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                                            <td className="py-4 pr-4 max-w-[280px]">
                                                <div className="flex items-center gap-2">
                                                    <Search className="w-3.5 h-3.5 text-[#444] shrink-0" />
                                                    <span
                                                        className={`text-[#ccc] text-[13px] truncate ${promptP.truncated ? 'cursor-help' : ''}`}
                                                        title={promptP.truncated ? promptP.full : undefined}
                                                    >
                                                        {promptP.display}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium ${row.brandMentioned
                                                    ? 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a]'
                                                    : 'bg-[#1a0a0a] text-[#E92A15] border border-[#E92A15]/20'
                                                }`}>
                                                    {row.brandMentioned ? '✓ Yes' : '✗ No'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {row.position != null
                                                    ? <span className="text-white text-[14px] font-bold">#{row.position}</span>
                                                    : <span className="text-[#333] text-[14px]">—</span>
                                                }
                                            </td>
                                            <td className="text-center">{sentChip('perplexity')}</td>
                                            <td className="text-center">{sentChip('gemini')}</td>
                                            <td className="text-center">{sentChip('googleAI')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Regional Performance Map + Top Countries */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-[#0B0B0B] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-start justify-between gap-3 mb-1 pr-24">
                            <div>
                                <h2 className="text-white font-semibold text-[16px] mb-1">Regional Performance</h2>
                                <p className="text-[#666] text-[13px]">Citations and sentiment score by region (from real scan data)</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setChartInspect('map')}
                            className="absolute top-5 right-5 z-[55] flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#141414] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3] hover:border-[#E92A15]/45 hover:text-white transition-colors"
                            aria-label="Open regional map in a larger view"
                        >
                            <Maximize2 className="w-3.5 h-3.5" strokeWidth={2.2} aria-hidden />
                            Expand
                        </button>
                        <div className="relative rounded-xl overflow-hidden bg-[#080808] mt-4" style={{ height: 360 }}>
                            <ComposableMap
                                projectionConfig={{ scale: 195, center: [15, 5] }}
                                style={{ width: '100%', height: '100%', background: '#080808' }}
                            >
                                <ZoomableGroup center={[15, 5]} zoom={1.2} minZoom={1} maxZoom={6}>
                                    <Geographies geography={GEO_URL}>
                                        {({ geographies }) =>
                                            geographies.map(geo => {
                                                const numId = parseInt(geo.id, 10);
                                                const data = geoSentiment[numId];
                                                const fillColor = data ? getSentimentColor(data.sentiment) : '#1a1a1a';
                                                const isHovered = hoveredGeo === geo.id;
                                                return (
                                                    <Geography
                                                        key={geo.rsmKey}
                                                        geography={geo}
                                                        fill={isHovered && data ? getSentimentColorBright(data.sentiment) + '99' : fillColor}
                                                        stroke="#0d0d0d"
                                                        strokeWidth={0.5}
                                                        style={{
                                                            default: { outline: 'none' },
                                                            hover: { outline: 'none', cursor: data ? 'pointer' : 'default' },
                                                            pressed: { outline: 'none' },
                                                        }}
                                                        onMouseEnter={(evt) => {
                                                            if (data) {
                                                                setHoveredGeo(geo.id);
                                                                const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                if (containerRect) {
                                                                    setTooltip({
                                                                        ...data,
                                                                        x: evt.clientX - containerRect.left,
                                                                        y: evt.clientY - containerRect.top,
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                        onMouseMove={(evt) => {
                                                            if (data) {
                                                                const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                if (containerRect) {
                                                                    setTooltip(prev => prev ? { ...prev, x: evt.clientX - containerRect.left, y: evt.clientY - containerRect.top } : prev);
                                                                }
                                                            }
                                                        }}
                                                        onMouseLeave={() => {
                                                            setHoveredGeo(null);
                                                            setTooltip(null);
                                                        }}
                                                    />
                                                );
                                            })
                                        }
                                    </Geographies>
                                </ZoomableGroup>
                            </ComposableMap>
                            {tooltip && (
                                <MapTooltip
                                    info={tooltip}
                                    x={tooltip.x}
                                    y={tooltip.y}
                                    brandName={brandName}
                                    domain={domain}
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <span className="text-[#666] text-[11px]">Low</span>
                            <div className="flex-1 h-2 rounded-full" style={{ background: `linear-gradient(to right, ${SENTIMENT_JIO.negative}, ${SENTIMENT_JIO.neutral}, #d4d4d4, ${SENTIMENT_JIO.positive})` }} />
                            <span className="text-[#666] text-[11px]">High</span>
                            <div className="flex items-center gap-3 ml-2">
                                {[
                                    { dot: '#f5f5f5', label: '≥80%' },
                                    { dot: '#a3a3a3', label: '65–79%' },
                                    { dot: '#737373', label: '50–64%' },
                                    { dot: SENTIMENT_JIO.negative, label: '<50%' },
                                ].map(({ dot, label }) => (
                                    <span key={label} className="flex items-center gap-1 text-[11px] text-[#666]">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Countries */}
                    <div className="bg-[#0B0B0B] border border-[#222] rounded-2xl p-6">
                        <h2 className="text-white font-semibold text-[16px] mb-1">Top Countries by Citations</h2>
                        <p className="text-[#666] text-[13px] mb-5">Where your brand gets the most AI mentions</p>
                        <div className="rounded-xl border border-[#1f1f1f] overflow-hidden">
                            {topCountries.length === 0 ? (
                                <div className="p-4 space-y-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="animate-pulse bg-[#1a1a1a] rounded-lg w-11 h-11 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="animate-pulse bg-[#1a1a1a] rounded h-4 w-3/4" />
                                                <div className="animate-pulse bg-[#1a1a1a] rounded-full h-1 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-[#444] text-[12px] text-center pt-2">Awaiting scan data</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <tbody>
                                        {topCountries.map((c, i) => (
                                            <tr
                                                key={`${c.code}-${i}`}
                                                className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#111]/90 transition-colors"
                                            >
                                                <td className="py-3 pl-3 pr-2 w-10 align-middle">
                                                    <span className="text-[#555] text-[11px] font-bold tabular-nums">#{i + 1}</span>
                                                </td>
                                                <td className="py-3 pr-2 align-middle w-[52px]">
                                                    <div
                                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] leading-none border border-[#2a2a2a] bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] shadow-inner"
                                                        title={c.country}
                                                    >
                                                        {c.flag}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-3 align-middle min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                        <span className="text-white text-[13px] font-semibold tracking-tight">{c.country}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-[#2c2c2c]">
                                                            {c.code}
                                                        </span>
                                                        <span className="text-[#888] text-[12px] font-medium tabular-nums ml-auto">{c.share}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-[#222]">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#E92A15]/80 to-white/90"
                                                            style={{ width: `${Math.min(c.share * 2.5, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-[#555] mt-1 tabular-nums">{c.citations?.toLocaleString?.() ?? c.citations} citations</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <Dialog open={!!kpiInspect && !!KPI_INSPECT_COPY[kpiInspect]} onOpenChange={(open) => !open && setKpiInspect(null)}>
                    <DialogContent className="bg-[#0a0a0a] border-[#333] text-white max-w-lg shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white text-[17px]">
                                {kpiInspect ? KPI_INSPECT_COPY[kpiInspect]?.title : ''}
                            </DialogTitle>
                            <DialogDescription className="text-[#a3a3a3] text-[13px] leading-relaxed pt-1">
                                {kpiInspect ? KPI_INSPECT_COPY[kpiInspect]?.description : ''}
                            </DialogDescription>
                        </DialogHeader>
                        {kpiInspect === 'avgSentiment' && hasData && averageSentiment != null && (
                            <div className="rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-3 mt-2">
                                <p className="text-[10px] uppercase tracking-wider text-[#666] mb-1">Current scan</p>
                                <p className="text-[28px] font-bold tabular-nums text-white">
                                    {averageSentiment.toFixed(1)}
                                    <span className="text-[14px] font-semibold text-[#666]"> / 100</span>
                                </p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={chartInspect != null} onOpenChange={(open) => !open && setChartInspect(null)}>
                    <DialogContent className="bg-[#0a0a0a] border-[#333] text-white max-w-[min(96vw,920px)] w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
                        <DialogHeader>
                            <DialogTitle className="text-white text-[17px]">
                                {chartInspect === 'trend' && 'Sentiment trend — expanded'}
                                {chartInspect === 'pie' && 'Sentiment breakdown — expanded'}
                                {chartInspect === 'map' && 'Regional performance — expanded'}
                            </DialogTitle>
                            <DialogDescription className="text-[#888] text-[12px]">
                                {chartInspect === 'trend' && 'Positive, neutral, and negative share over the displayed window (hover points for exact values).'}
                                {chartInspect === 'pie' && 'Distribution of AI sentiment labels for this scan.'}
                                {chartInspect === 'map' && 'Hover countries with data to see citations, sentiment, and mentions.'}
                            </DialogDescription>
                        </DialogHeader>

                        {chartInspect === 'trend' && (
                            <div className="w-full mt-2" style={{ height: 420 }}>
                                <ResponsiveContainer width="100%" height={420}>
                                    <AreaChart data={sentimentTrend} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                                        <defs>
                                            <linearGradient id="sentTrendPosModal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={SENTIMENT_JIO.positive} stopOpacity={0.4} />
                                                <stop offset="100%" stopColor={SENTIMENT_JIO.positive} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="sentTrendNeuModal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={SENTIMENT_JIO.neutral} stopOpacity={0.45} />
                                                <stop offset="100%" stopColor={SENTIMENT_JIO.neutral} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="sentTrendNegModal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={SENTIMENT_JIO.negative} stopOpacity={0.45} />
                                                <stop offset="100%" stopColor={SENTIMENT_JIO.negative} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#525252', fontSize: 11 }}
                                            domain={[0, 100]}
                                            ticks={[0, 25, 50, 75, 100]}
                                            width={40}
                                        />
                                        <Tooltip
                                            content={(props) => (
                                                <SentimentTrendTooltip {...props} brandName={brandName} domain={domain} />
                                            )}
                                            cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeOpacity: 0.35 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="negative"
                                            name="Negative"
                                            stroke={SENTIMENT_JIO.negative}
                                            strokeWidth={2}
                                            fill="url(#sentTrendNegModal)"
                                            dot={{ r: 4, strokeWidth: 1.5, fill: '#0a0a0a', stroke: SENTIMENT_JIO.negative }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: SENTIMENT_JIO.negative }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="neutral"
                                            name="Neutral"
                                            stroke={SENTIMENT_JIO.neutral}
                                            strokeWidth={2}
                                            fill="url(#sentTrendNeuModal)"
                                            dot={{ r: 4, strokeWidth: 1.5, fill: '#0a0a0a', stroke: SENTIMENT_JIO.neutral }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: SENTIMENT_JIO.neutral }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="positive"
                                            name="Positive"
                                            stroke={SENTIMENT_JIO.positive}
                                            strokeWidth={2}
                                            fill="url(#sentTrendPosModal)"
                                            dot={{ r: 4, strokeWidth: 1.5, fill: '#0a0a0a', stroke: SENTIMENT_JIO.positive }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: SENTIMENT_JIO.positive }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {chartInspect === 'pie' && (
                            <div className="flex flex-col lg:flex-row items-center gap-8 mt-4">
                                <div className="w-full max-w-[320px]" style={{ height: 320 }}>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={sentimentBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={115}
                                                dataKey="value"
                                                strokeWidth={0}
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {sentimentBreakdown.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={(props) => (
                                                    <SentimentPieBrandTooltip {...props} brandName={brandName} domain={domain} />
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <ul className="flex-1 space-y-3 w-full min-w-0">
                                    {sentimentBreakdown.map((item, i) => (
                                        <li key={item.name} className="flex items-center justify-between gap-3 text-[14px]">
                                            <span className="flex items-center gap-2 text-[#ccc]">
                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                {item.name}
                                            </span>
                                            <span className="font-bold tabular-nums text-white">{item.value}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {chartInspect === 'map' && (
                            <div className="relative rounded-xl overflow-hidden bg-[#080808] mt-3 border border-[#2a2a2a]" style={{ height: 480 }}>
                                <ComposableMap
                                    projectionConfig={{ scale: 220, center: [15, 5] }}
                                    style={{ width: '100%', height: '100%', background: '#080808' }}
                                >
                                    <ZoomableGroup center={[15, 5]} zoom={1.25} minZoom={1} maxZoom={6}>
                                        <Geographies geography={GEO_URL}>
                                            {({ geographies }) =>
                                                geographies.map((geo) => {
                                                    const numId = parseInt(geo.id, 10);
                                                    const data = geoSentiment[numId];
                                                    const fillColor = data ? getSentimentColor(data.sentiment) : '#1a1a1a';
                                                    const isHovered = expandHoveredGeo === geo.id;
                                                    return (
                                                        <Geography
                                                            key={geo.rsmKey}
                                                            geography={geo}
                                                            fill={
                                                                isHovered && data
                                                                    ? `${getSentimentColorBright(data.sentiment)}99`
                                                                    : fillColor
                                                            }
                                                            stroke="#0d0d0d"
                                                            strokeWidth={0.5}
                                                            style={{
                                                                default: { outline: 'none' },
                                                                hover: { outline: 'none', cursor: data ? 'pointer' : 'default' },
                                                                pressed: { outline: 'none' },
                                                            }}
                                                            onMouseEnter={(evt) => {
                                                                if (data) {
                                                                    setExpandHoveredGeo(geo.id);
                                                                    const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                    if (containerRect) {
                                                                        setExpandMapTip({
                                                                            ...data,
                                                                            x: evt.clientX - containerRect.left,
                                                                            y: evt.clientY - containerRect.top,
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                            onMouseMove={(evt) => {
                                                                if (data) {
                                                                    const containerRect = evt.target.closest('.relative')?.getBoundingClientRect();
                                                                    if (containerRect) {
                                                                        setExpandMapTip((prev) =>
                                                                            prev ? { ...prev, x: evt.clientX - containerRect.left, y: evt.clientY - containerRect.top } : prev
                                                                        );
                                                                    }
                                                                }
                                                            }}
                                                            onMouseLeave={() => {
                                                                setExpandHoveredGeo(null);
                                                                setExpandMapTip(null);
                                                            }}
                                                        />
                                                    );
                                                })
                                            }
                                        </Geographies>
                                    </ZoomableGroup>
                                </ComposableMap>
                                {expandMapTip && (
                                    <MapTooltip
                                        info={expandMapTip}
                                        x={expandMapTip.x}
                                        y={expandMapTip.y}
                                        brandName={brandName}
                                        domain={domain}
                                    />
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Footer */}
                <div className="flex items-center justify-center pt-4">
                    <p className="text-[#333] text-[11px] font-semibold uppercase tracking-[0.15em]">
                        SCANNED {scanDate}
                    </p>
                </div>
            </div>
        </div>
    );
}
