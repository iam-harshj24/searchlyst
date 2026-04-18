/**
 * User-Flow E2E Test — Simulates a user running an AI Visibility scan
 *
 * Prerequisites: Backend running (npm run dev), .env with DATABASE_URL, JWT_SECRET
 * Optional: GEMINI_API_KEY, INFATICA_API_KEY for full scan (otherwise scan may fail)
 *
 * Run: node scripts/test-user-flow.mjs (from backend dir)
 */

const API_BASE = 'http://localhost:3000/api';
let token = null;

async function fetchApi(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function step(name, fn) {
  try {
    const result = await fn();
    console.log(`  ✓ ${name}`);
    return result;
  } catch (e) {
    console.error(`  ✗ ${name}:`, e.message);
    throw e;
  }
}

async function main() {
  console.log('\n=== USER FLOW E2E TEST ===\n');
  console.log('Simulating: Anonymous user → Start scan → Poll → Validate result\n');

  // 1. Health check
  await step('Health check', async () => {
    const res = await fetch(`${API_BASE.replace('/api', '')}/health`);
    if (!res.ok) throw new Error('Backend not reachable - is it running?');
  });

  // 2. Create anonymous user (get token)
  await step('Create anonymous user / get token', async () => {
    const { ok, data } = await fetchApi('POST', '/auth/anonymous');
    if (!ok) throw new Error(data.message || 'Anonymous auth failed');
    token = data.token;
    if (!token) throw new Error('No token returned');
  });

  // 3. Start visibility scan
  let scanId;
  await step('Start visibility scan', async () => {
    const { ok, data } = await fetchApi('POST', '/visibility/scan', {
      brandName: 'Searchlyst',
      domain: 'searchlyst.com',
      industry: 'SEO',
      competitors: [{ name: 'Ahrefs', domain: 'ahrefs.com' }],
      location: 'US',
      language: 'English',
    });
    if (!ok) throw new Error(data.message || 'Start scan failed');
    scanId = data.scanId;
    if (!scanId) throw new Error('No scanId returned');
  });

  // 4. Poll for completion (max 5 min for real scan)
  console.log('\n  Polling for scan completion (max 5 min)...');
  const maxPolls = 100; // 100 * 3s = 5 min
  let result = null;
  let finalStatus = null;

  for (let i = 0; i < maxPolls; i++) {
    const { ok, data } = await fetchApi('GET', `/visibility/${scanId}/status`);
    if (!ok) throw new Error('Get status failed');

    finalStatus = data.status;
    if (data.result) result = data.result;

    if (finalStatus === 'completed') {
      console.log(`  ✓ Scan completed after ${(i + 1) * 3}s`);
      break;
    }
    if (finalStatus === 'failed') {
      console.log(`  ✗ Scan failed: ${data.error || 'unknown'}`);
      break;
    }

    const phase = data.phase || 'unknown';
    const detail = data.phaseDetail || '';
    if (i % 5 === 0) console.log(`    [${i * 3}s] ${phase}: ${detail.substring(0, 50)}...`);
    await new Promise(r => setTimeout(r, 3000));
  }

  if (!result && finalStatus !== 'failed') {
    console.log('  ⚠ Scan did not complete within timeout (may need GEMINI_API_KEY, INFATICA_API_KEY)');
  }

  // 5. Validate result structure (if completed)
  if (result) {
    console.log('\n  Validating result structure...');
    const checks = [
      ['score.overall', result.score?.overall !== undefined],
      ['shareOfVoice.brand', result.shareOfVoice?.brand],
      ['platformBreakdown', result.platformBreakdown && typeof result.platformBreakdown === 'object'],
      ['prompts', Array.isArray(result.prompts)],
      ['entityGraph', Array.isArray(result.entityGraph)],
      ['platforms', result.platforms && result.platforms.perplexity !== undefined],
    ];
    checks.forEach(([key, ok]) => console.log(ok ? `  ✓ ${key}` : `  ✗ ${key} missing`));
    const allOk = checks.every(([, ok]) => ok);
    if (allOk) console.log('\n  ✓ All result fields present');
    else console.log('\n  ⚠ Some fields missing - check scan output');
  }

  // 6. Test getLatestScan
  if (token) {
    await step('Get latest scan (API)', async () => {
      const { ok, data } = await fetchApi('GET', '/visibility/latest?domain=searchlyst.com');
      if (!ok) throw new Error(data.message || 'Get latest failed');
      // May be null if no completed scan
    });
  }

  console.log('\n=== USER FLOW TEST DONE ===\n');
}

main().catch(e => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
