/**
 * Single-call Infatica /chatgpt smoke test.
 * Run: node scripts/test-chatgpt-only.mjs [optional query]
 */
import 'dotenv/config';
import { queryInfaticaChatGPT } from '../src/services/infaticaService.js';
import { parseResponse } from '../src/services/responseParser.js';

const q = process.argv.slice(2).join(' ') || 'Say hello in exactly five words.';

async function main() {
    if (!process.env.INFATICA_API_KEY?.trim()) {
        console.error('Missing INFATICA_API_KEY (set in backend/.env)');
        process.exit(1);
    }
    console.log('Query:', q, '\n');
    try {
        const raw = await queryInfaticaChatGPT(q, '', '');
        const textLen = raw?.text ? String(raw.text).trim().length : 0;
        const htmlLen = raw?.html ? String(raw.html).trim().length : 0;
        const srcN = Array.isArray(raw?.sources) ? raw.sources.length : 0;
        const ok = textLen > 0 || htmlLen > 0 || srcN > 0;
        console.log('Result:', ok ? 'HAS CONTENT' : 'EMPTY');
        console.log('  text chars:', textLen);
        console.log('  html chars:', htmlLen);
        console.log('  sources:', srcN);
        const preview = (raw?.text || raw?.html || '').toString().replace(/\s+/g, ' ').trim().slice(0, 500);
        if (preview) console.log('  preview:', preview + (preview.length >= 500 ? '…' : ''));

        const parsed = parseResponse(raw, 'DemoBrand', 'demo.com', [], 'chatgpt');
        const rt = (parsed.rawText || '').trim();
        console.log('\nAfter parseResponse (chatgpt):');
        console.log('  rawText length:', rt.length);
        if (rt.length) console.log('  answer preview:', rt.slice(0, 280).replace(/\s+/g, ' ') + (rt.length > 280 ? '…' : ''));

        process.exit(ok ? 0 : 2);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

main();
