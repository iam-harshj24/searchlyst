import './loadEnv.js'; // Must be first: loads .env from backend root regardless of cwd
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/prisma.js';
import { verifyEmailConfig } from './config/email.js';
import { validateProductionEnv, JSON_BODY_LIMIT } from './config/productionEnv.js';
import waitlistRoutes from './routes/waitlist.js';
import authRoutes from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import auditRoutes from './routes/audit.js';
import visibilityRoutes from './routes/visibility.js';
import projectRoutes from './routes/projects.js';
import contentRoutes from './routes/content.js';
import agentRoutes from './routes/agent.js';
import adminRoutes from './routes/admin.js';
import './workers/welcomeEmailWorker.js';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

/** Behind nginx, Cloud Run, Render, etc. — required for correct client IPs and rate limiting. */
if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
}

/** In development: accept only this machine unless BIND_LOCAL_ONLY=false. In production: off unless BIND_LOCAL_ONLY=true. */
const BIND_LOCAL_ONLY =
    process.env.NODE_ENV === 'development'
        ? process.env.BIND_LOCAL_ONLY !== 'false'
        : process.env.BIND_LOCAL_ONLY === 'true';

const HOST = process.env.HOST || (BIND_LOCAL_ONLY ? '127.0.0.1' : '0.0.0.0');

function isLoopbackIp(ip) {
    if (!ip) return false;
    if (ip === '127.0.0.1' || ip === '::1') return true;
    if (ip.startsWith('::ffff:') && ip.includes('127.0.0.1')) return true;
    return false;
}

// Middleware — allow loopback origins for local dev (incl. IPv6 ::1 / [::1], which browsers use)
function isLocalOrigin(origin) {
    if (!origin) return true;
    try {
        const { hostname } = new URL(origin);
        const h = hostname.toLowerCase();
        return (
            h === 'localhost' ||
            h === '127.0.0.1' ||
            h === '::1' ||
            h === '[::1]'
        );
    } catch {
        return false;
    }
}
const allowedOrigin = process.env.FRONTEND_URL;
const isDev = process.env.NODE_ENV === 'development';

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
);

app.use(cors({
    origin: (origin, cb) => {
        let ok;
        if (!allowedOrigin) {
            ok = isLocalOrigin(origin);
        } else if (isDev && isLocalOrigin(origin)) {
            ok = true;
        } else {
            ok = origin === allowedOrigin;
        }
        cb(null, ok);
    },
    credentials: true,
}));

// Reject non-loopback clients when running in local-only mode (use socket only — not X-Forwarded-For)
if (BIND_LOCAL_ONLY) {
    app.use((req, res, next) => {
        const ip = req.socket?.remoteAddress || '';
        if (!isLoopbackIp(ip)) {
            return res.status(403).json({
                success: false,
                message: 'This API is configured for local use only (this machine).',
            });
        }
        next();
    });
}

const trustProxyEnabled = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Math.min(5000, Math.max(50, Number(process.env.API_RATE_LIMIT_MAX) || (isProd ? 500 : 5000))),
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: trustProxyEnabled },
});

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

app.use('/api', apiLimiter);

const logRequests = isDev || process.env.LOG_HTTP === '1' || process.env.LOG_HTTP === 'true';
if (logRequests) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check — verifies Prisma can reach DATABASE_URL (SQLite file or remote DB)
app.get('/health', async (req, res) => {
    const timestamp = new Date().toISOString();
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp,
            service: 'searchlyst-backend',
        });
    } catch (err) {
        console.error('Health DB check failed:', err);
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            timestamp,
            service: 'searchlyst-backend',
            message: 'Database unreachable — check DATABASE_URL in backend/.env',
        });
    }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/visibility', visibilityRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const status = Number(err.status) || 500;
    const message =
        isProd && status >= 500
            ? 'Internal server error'
            : (err.message || 'Internal server error');
    res.status(status).json({
        success: false,
        message,
        ...(isProd ? {} : { error: err.stack }),
    });
});

let httpServer = null;
let shuttingDown = false;

// Initialize and start server
const startServer = async () => {
    try {
        validateProductionEnv();

        console.log('🚀 Starting Searchlyst Backend...\n');
        const geminiOk = Boolean(
            process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
        );
        console.log(`✓ GEMINI_API_KEY: ${geminiOk ? 'configured' : 'NOT SET (AI features will fail)'}`);
        if (isProd && !process.env.INFATICA_API_KEY?.trim()) {
            console.warn('⚠ INFATICA_API_KEY is not set — AI visibility / Infatica routes will fail.');
        }

        await prisma.$connect();
        console.log('✓ Database connected (Prisma → DATABASE_URL)');

        await verifyEmailConfig();

        try {
            const { cleanupOrphanedScans } = await import('./controllers/visibilityController.js');
            await cleanupOrphanedScans();
        } catch (e) {
            console.warn('Orphan cleanup skipped:', e.message);
        }

        httpServer = app.listen(PORT, HOST, () => {
            console.log(`\n✓ Server is running on ${HOST}:${PORT}`);
            console.log(`✓ API available at http://localhost:${PORT}/api`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
            if (BIND_LOCAL_ONLY) {
                console.log('✓ Local-only mode: API bound to this machine (set BIND_LOCAL_ONLY=false in .env to allow LAN)\n');
            } else {
                console.log('');
            }
            if (isProd && !logRequests) {
                console.log('✓ HTTP request logging disabled (set LOG_HTTP=1 to enable)\n');
            }
            console.log('Press Ctrl+C to stop the server');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received, shutting down gracefully...`);
    try {
        const { awaitActiveVisibilityScans } = await import('./controllers/visibilityController.js');
        await awaitActiveVisibilityScans({ maxMs: 120_000 });
    } catch (e) {
        console.warn('Visibility drain:', e.message);
    }
    if (httpServer) {
        await new Promise((resolve) => {
            httpServer.close(() => resolve());
        });
    }
    try {
        await prisma.$disconnect();
    } catch (_) { /* ignore */ }
    process.exit(0);
}

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

startServer();
