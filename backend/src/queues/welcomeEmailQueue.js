import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const welcomeEmailQueue = new Queue('welcome-emails', REDIS_URL, {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (process.env.NODE_ENV === 'development') return null;
      return Math.min(times * 50, 2000);
    }
  },
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
  },
});

export async function addWelcomeEmailJob(entryIds) {
  const job = await welcomeEmailQueue.add({ entryIds });
  return job.id;
}
