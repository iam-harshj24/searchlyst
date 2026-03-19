import { waitlistRepository } from '../repositories/waitlistRepository.js';
import { sendWaitlistNotification, sendWelcomeEmail } from './emailService.js';
import { addWelcomeEmailJob } from '../queues/welcomeEmailQueue.js';

export const waitlistService = {
  async createEntry(data) {
    const existing = await waitlistRepository.findByEmail(data.email);
    if (existing) {
      return { success: false, conflict: true };
    }

    const newEntry = await waitlistRepository.create(data);

    // Send welcome email to the user (non-blocking, skip if disabled)
    if (process.env.SEND_WELCOME_EMAIL !== 'false') {
      (async () => {
        try {
          const emailResult = await sendWelcomeEmail({
            full_name: data.full_name,
            email: data.email,
          });
          if (emailResult?.success) {
            await waitlistRepository.markWelcomeEmailSent(newEntry.id);
          }
        } catch (err) {
          console.error('Welcome email failed:', err);
        }
      })();
    }

    // Send internal notification to admin (non-blocking)
    sendWaitlistNotification({
      full_name: data.full_name,
      email: data.email,
      website_url: data.website_url,
      source: data.source,
    }).catch((err) => {
      console.error('Admin notification failed:', err);
    });

    return { success: true, data: newEntry };
  },

  async getAllEntries() {
    const entries = await waitlistRepository.findAll();
    return entries;
  },

  async updateStatus(id, status) {
    const entry = await waitlistRepository.updateStatus(id, status);
    return entry;
  },

  async getStats() {
    return waitlistRepository.getStats();
  },

  async bulkCreateEntries(entries) {
    const created = [];
    const skipped = [];
    const errors = [];

    for (let i = 0; i < entries.length; i++) {
      const row = i + 1;
      const entry = entries[i];
      try {
        const existing = await waitlistRepository.findByEmail(entry.email);
        if (existing) {
          skipped.push({ row, email: entry.email, message: 'Email already on waitlist' });
          continue;
        }

        const newEntry = await waitlistRepository.create({
          full_name: entry.full_name,
          email: entry.email,
          website_url: entry.website_url || null,
          source: 'bulk_upload',
        });
        created.push(newEntry);
      } catch (err) {
        errors.push({ row, email: entry.email, message: err.message || 'Failed to create entry' });
      }
    }

    let welcomeEmailJobId = null;
    if (created.length > 0 && process.env.SEND_WELCOME_EMAIL !== 'false') {
      const createdIds = created.map((entry) => entry.id);
      welcomeEmailJobId = await addWelcomeEmailJob(createdIds);
    }

    return { created, skipped, errors, welcomeEmailJobId };
  },
};
