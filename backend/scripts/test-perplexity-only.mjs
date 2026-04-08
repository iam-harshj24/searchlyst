/**
 * Infatica /perplexity smoke test.
 * Run: node scripts/test-perplexity-only.mjs [query]
 */
import 'dotenv/config';
import { queryPerplexity } from '../src/services/infaticaService.js';
import { parseResponse } from '../src/services/responseParser.js';

const q = process.argv.slice(2).join(' ') || 'List two facts about the planet Mars in one short sentence each.';

async function main() {
    if (!process.env.INFATICA_API_KEY?.trim()) {
        console.error('Missing INFATICA_API_KEY');
        process.exit(1);
    }
    console.log('Query:', q, '\n');
    try {
        const t0 = Date.now();
        const raw = await queryPerplexity(q, 'US', 'en-US');
        const ms = Date.now() - t0;
        const textLen = raw?.text ? String(raw.text).trim().length : 0;
        const htmlLen = raw?.html ? String(raw.html).trim().length : 0;
        const srcN = Array.isArray(raw?.sources) ? raw.sources.length : 0;
        console.log(`Infatica round-trip: ${ms}ms`);
        console.log('  text:', textLen, 'html:', htmlLen, 'sources:', srcN);

        const parsed = parseResponse(raw, 'TestCo', 'test.com', [], 'perplexity');
        const rt = (parsed.rawText || '').trim();
        console.log('  parseResponse rawText length:', rt.length);
        if (rt.length) console.log('  preview:', rt.slice(0, 220).replace(/\s+/g, ' ') + (rt.length > 220 ? '…' : ''));

        const ok = textLen > 0 || htmlLen > 0 || srcN > 0;
        process.exit(ok && rt.length > 20 ? 0 : 2);
    } catch (e) {
        console.error('FAILED:', e.message);
        process.exit(1);
    }
}

main();
