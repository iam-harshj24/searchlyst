/**
 * Live Infatica smoke test (Perplexity + Gemini + Google SERP).
 * Requires: INFATICA_API_KEY in .env or environment.
 * Run from backend: node scripts/test-infatica-live.mjs
 */
import 'dotenv/config';
import { queryPerplexity, queryGemini, queryGoogleAI } from '../src/services/infaticaService.js';
import { parseResponse } from '../src/services/responseParser.js';

const q = process.argv.slice(2).join(' ') || 'What are three trusted sources for enterprise CRM comparisons in 2026?';

async function main() {
    if (!process.env.INFATICA_API_KEY) {
        console.error('Set INFATICA_API_KEY to run this script.');
        process.exit(1);
    }

    console.log('\n=== INFATICA LIVE SMOKE TEST ===\n');
    console.log('Query:', q.slice(0, 120) + (q.length > 120 ? '…' : ''), '\n');

    const brand = 'Salesforce';
    const domain = 'salesforce.com';
    const competitors = [{ name: 'HubSpot', domain: 'hubspot.com' }];

    for (const [label, fn, engine] of [
        ['Perplexity', () => queryPerplexity(q, ''), 'perplexity'],
        ['Gemini', () => queryGemini(q, ''), 'gemini'],
        ['Google SERP (AI Overview context)', () => queryGoogleAI(q, 'us'), 'googleAI'],
    ]) {
        console.log(`--- ${label} ---`);
        try {
            const raw = await fn();
            const parsed = parseResponse(raw, brand, domain, competitors, engine);
            const textLen = parsed.rawText?.length ?? parsed.textLength ?? 0;
            const cites = parsed.citations?.length ?? 0;
            console.log(`  text length: ${textLen} | citations: ${cites} | brand mentioned: ${parsed.brandMentioned}`);
            if (parsed.citations?.length) {
                console.log('  top sources:', parsed.citations.slice(0, 5).map(c => c.domain).join(', '));
            }
        } catch (e) {
            console.error(`  ERROR: ${e.message}`);
        }
    }

    console.log('\n=== DONE ===\n');
}

main();
