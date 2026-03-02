import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { verifyEmailConfig } from './config/email.js';
import waitlistRoutes from './routes/waitlist.js';
import authRoutes from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import auditRoutes from './routes/audit.js';
import visibilityRoutes from './routes/visibility.js';
import projectRoutes from './routes/projects.js';
import contentRoutes from './routes/content.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - allow localhost and 127.0.0.1 for local dev (CORS blocks if origin mismatch)
const isLocalOrigin = (origin) => !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
  origin: (origin, cb) => {
    const ok = allowedOrigin ? origin === allowedOrigin : isLocalOrigin(origin);
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'searchlyst-backend'
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

    // Require JWT_SECRET in production
    const defaultSecret = 'your-secret-key-change-this-in-production';
    if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === defaultSecret)) {
      console.error('FATAL: JWT_SECRET must be set to a secure value in production');
      process.exit(1);
    }

    // Verify email configuration
    await verifyEmailConfig();

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
