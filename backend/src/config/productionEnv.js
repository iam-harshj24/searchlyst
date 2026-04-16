/**
 * Fail fast on misconfiguration when NODE_ENV=production.
 * Call once before listen().
 */
export function validateProductionEnv() {
    if (process.env.NODE_ENV !== 'production') return;

    const errors = [];
    const jwt = process.env.JWT_SECRET?.trim();
    const defaultJwt = 'your-secret-key-change-this-in-production';
    if (!jwt || jwt === defaultJwt) {
        errors.push('JWT_SECRET must be set to a long random value (not the example default).');
    }
    if (!process.env.DATABASE_URL?.trim()) {
        errors.push('DATABASE_URL is required.');
    }

    const bindLocalOnly = process.env.BIND_LOCAL_ONLY === 'true';
    if (!bindLocalOnly && !process.env.FRONTEND_URL?.trim()) {
        errors.push(
            'FRONTEND_URL must be set to your live frontend origin (e.g. https://app.example.com) so browsers can call the API (CORS).',
        );
    }

    if (errors.length) {
        console.error('[Production] Invalid configuration:\n', errors.map((e) => `  - ${e}`).join('\n'));
        process.exit(1);
    }
}

/** JSON body size cap — keeps accidental/malicious huge payloads from tying up the event loop. */
export const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '512kb';
