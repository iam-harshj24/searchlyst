/**
 * Reads API_HOST / API_PORT from env so the same tests work both
 * inside Docker (pointing at the searchlyst-api-test container)
 * and locally (defaulting to localhost:3000).
 */

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '3000';

export const BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const SEED_USER = {
  email: 'testuser@integration.test',
  password: 'testpass1234',
  name: 'Test User',
};

export const SEED_ADMIN = {
  email: 'admin@integration.test',
  password: 'adminpass1234',
  name: 'Local Admin',
};

/**
 * Thin wrapper around fetch that prefixes the base URL and
 * defaults to JSON content-type for POST/PUT/PATCH.
 */
export async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  return { status: res.status, data };
}

/**
 * POST to /api/auth/login and return the JWT token.
 */
export async function loginAs({ email, password }) {
  const { status, data } = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (status !== 200 || !data.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return data.token;
}

/**
 * Return headers object with Authorization bearer token.
 */
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
