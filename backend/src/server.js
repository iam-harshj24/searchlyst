import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyEmailConfig } from './config/email.js';
import waitlistRoutes from './routes/waitlist.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import brandProfileRoutes from './routes/brandProfile.js';
import socialRoutes from './routes/social.js';
import contentRoutes from './routes/content.js';
import chatRoutes from './routes/chat.js';
import auditRoutes from './routes/audits.js';
import sentimentGeoRoutes from './routes/sentimentGeo.js';
import overviewRoutes from './routes/overview.js';
import aiVisibilityRoutes from './routes/aiVisibility.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
app.use('/api/domains', projectRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/brand-profile', brandProfileRoutes);
app.use('/api/projects/:projectId/audits', auditRoutes);
app.use('/api/projects/:projectId/sentiment-geo', sentimentGeoRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/projects/:projectId/ai-visibility', aiVisibilityRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/chat', chatRoutes);

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
