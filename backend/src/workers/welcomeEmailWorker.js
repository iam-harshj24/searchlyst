import { welcomeEmailQueue } from '../queues/welcomeEmailQueue.js';
import { waitlistRepository } from '../repositories/waitlistRepository.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const COOLDOWN_MS = parseInt(process.env.WELCOME_EMAIL_COOLDOWN_MS || '2500', 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

welcomeEmailQueue.process(async (job) => {
  const { entryIds } = job.data;
  const entries = await waitlistRepository.findByIds(entryIds);
  const total = entries.length;
  let sent = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      const result = await sendWelcomeEmail({
        full_name: entry.full_name,
        email: entry.email,
      });
      if (result.success) {
        sent++;
        await waitlistRepository.markWelcomeEmailSent(entry.id);
      } else {
        failed++;
        errors.push({ email: entry.email, message: result.error || 'Failed to send' });
      }
    } catch (err) {
      failed++;
      errors.push({ email: entry.email, message: err.message || 'Failed to send' });
      console.error('Welcome email error for', entry.email, err);
    }

    await job.progress({ sent, failed, errors, total });

    if (i < entries.length - 1) {
      await sleep(COOLDOWN_MS);
    }
  }

  return { sent, failed, errors, total };
});

welcomeEmailQueue.on('error', (err) => {
  console.error('Welcome email queue error:', err);
});

welcomeEmailQueue.on('failed', (job, err) => {
  console.error('Welcome email job failed:', job.id, err);
});

export { welcomeEmailQueue };
