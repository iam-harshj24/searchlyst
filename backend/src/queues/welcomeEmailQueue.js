import dotenv from 'dotenv';
dotenv.config();

// Welcome email queue — requires Redis (Bull).
// In development without Redis, this resolves to null (non-fatal).
let welcomeEmailQueue = null;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true' || false;

if (REDIS_ENABLED) {
  try {
    const { default: Queue } = await import('bull');
    const q = new Queue('welcome-emails', REDIS_URL, {
      defaultJobOptions: { attempts: 1, removeOnComplete: 100 },
    });
    q.on('error', (err) => {
      console.warn('[WelcomeEmailQueue] Redis error (non-fatal):', err.message);
    });
    welcomeEmailQueue = q;
    console.log('[WelcomeEmailQueue] Queue initialized successfully');
  } catch (err) {
    console.warn('[WelcomeEmailQueue] Failed to init queue (non-fatal):', err.message);
  }
} else {
  console.log('[WelcomeEmailQueue] Redis disabled — email queue running in no-op mode (set REDIS_ENABLED=true to enable)');
}

export { welcomeEmailQueue };

export async function addWelcomeEmailJob(entryIds) {
  if (!welcomeEmailQueue) {
    console.warn('[WelcomeEmailQueue] Queue unavailable — skipping welcome email job');
    return null;
  }
  const job = await welcomeEmailQueue.add({ entryIds });
  return job.id;
}
