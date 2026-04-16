import './loadEnv.js'; // Must be first: loads .env from backend root regardless of cwd
import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma.js';
import { verifyEmailConfig } from './config/email.js';
import waitlistRoutes from './routes/waitlist.js';
import authRoutes from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import auditRoutes from './routes/audit.js';
import visibilityRoutes from './routes/visibility.js';
import projectRoutes from './routes/projects.js';
import contentRoutes from './routes/content.js';
import agentRoutes from './routes/agent.js';
import './workers/welcomeEmailWorker.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - allow localhost and 127.0.0.1 for local dev (CORS blocks if origin mismatch)
const isLocalOrigin = (origin) => !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const allowedOrigin = process.env.FRONTEND_URL;
const isDev = process.env.NODE_ENV === 'development';
app.use(cors({
  origin: (origin, cb) => {
    // Production: only the configured frontend origin (or any local origin if unset).
    // Development: if FRONTEND_URL is set, still allow any localhost / 127.0.0.1 port so Vite
    // can hop ports (5173, 5174, …) and localhost vs 127.0.0.1 both work with the same .env.
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
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  let database = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    // leave as 'disconnected'
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'searchlyst-backend',
    database,
  });
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Searchlyst Backend...\n');
    const geminiOk = Boolean(
      process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    );
    console.log(`✓ GEMINI_API_KEY: ${geminiOk ? 'configured' : 'NOT SET (AI features will fail)'}`);

    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET is not set');
      process.exit(1);
    }

    // Verify email configuration
    await verifyEmailConfig();

    // Cleanup orphaned scans from previous server crashes
    try {
      const { cleanupOrphanedScans } = await import('./controllers/visibilityController.js');
      await cleanupOrphanedScans();
    } catch (e) { console.warn('Orphan cleanup skipped:', e.message); }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n✓ Server is running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/health\n`);
      console.log('Press Ctrl+C to stop the server');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
