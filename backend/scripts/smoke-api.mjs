/**
 * Quick API smoke test against local backend (default http://127.0.0.1:3000).
 * Run: node backend/scripts/smoke-api.mjs
 * Env: API_BASE=http://127.0.0.1:3000  SKIP_GEMINI=1 (skip slow onboarding AI call)
 */
import '../src/loadEnv.js';

const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';
const skipGemini = process.env.SKIP_GEMINI === '1' || process.env.SKIP_GEMINI === 'true';

const results = [];

function ok(name, pass, detail = '') {
    results.push({ name, pass, detail });
    const s = pass ? 'OK' : 'FAIL';
    console.log(`[${s}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function j(method, path, { body, token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { _raw: text };
    }
    return { status: r.status, data };
}

async function main() {
    console.log(`Smoke API → ${BASE}\n`);

    {
        const { status, data } = await j('GET', '/health');
        ok('GET /health', status === 200 && data.status === 'ok', `status=${status} db=${data.database}`);
    }

    let token = null;
    {
        const { status, data } = await j('POST', '/api/auth/anonymous', { body: {} });
        token = data.token;
        ok('POST /api/auth/anonymous', (status === 200 || status === 201) && Boolean(token), `status=${status}`);
    }

    {
        const { status, data } = await j('GET', '/api/auth/verify', { token });
        ok('GET /api/auth/verify', status === 200 && data.success !== false, `status=${status}`);
    }

    let firstProjectId = null;
    {
        const { status, data } = await j('GET', '/api/projects/', { token });
        const list = data.projects ?? data;
        ok('GET /api/projects/', status === 200 && Array.isArray(list), `status=${status}`);
        if (Array.isArray(list) && list[0]?.id != null) firstProjectId = list[0].id;
    }

    {
        const { status } = await j('GET', '/api/visibility/latest', { token });
        ok('GET /api/visibility/latest', status === 200, `status=${status}`);
    }

    {
        const q = firstProjectId != null ? `?projectId=${firstProjectId}` : '?url=example.com';
        const { status } = await j('GET', `/api/audit/latest${q}`, { token });
        ok('GET /api/audit/latest', status === 200, `status=${status} ${q}`);
    }

    {
        const { status } = await j('GET', '/api/content/', { token });
        ok('GET /api/content/', status === 200, `status=${status}`);
    }

    {
        const q = firstProjectId != null ? `?projectId=${firstProjectId}` : '';
        const { status } = await j('GET', `/api/content/stats${q}`, { token });
        const expect = firstProjectId != null ? status === 200 : status === 400;
        ok('GET /api/content/stats', expect, `status=${status} (needs projectId when no projects)`);
    }

    if (!skipGemini) {
        const { status, data } = await j('POST', '/api/onboarding/competitors', {
            token,
            body: {
                domain: 'example.com',
                brandName: 'Example',
                industry: 'SaaS',
                companySize: '11-100',
                location: 'US',
                language: 'English',
                reach: 'worldwide',
            },
        });
        const hasList = Array.isArray(data.competitors);
        ok('POST /api/onboarding/competitors (Gemini)', status === 200 && hasList, `status=${status} n=${data.competitors?.length}`);
    } else {
        ok('POST /api/onboarding/competitors', true, 'skipped (SKIP_GEMINI=1)');
    }

    {
        const { status, data } = await j('POST', '/api/agent/chat', {
            token,
            body: { messages: [{ role: 'user', content: 'Say hi in 3 words.' }] },
        });
        const okChat = status === 200 && (data.reply || data.message || data.text || data.response);
        ok('POST /api/agent/chat', okChat || status < 500, `status=${status}`);
    }

    const failed = results.filter((r) => !r.pass);
    console.log(`\n${failed.length ? 'SOME CHECKS FAILED' : 'ALL CHECKS PASSED'} (${results.length} total)`);
    if (failed.length) process.exit(1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
