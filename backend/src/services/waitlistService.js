import { waitlistRepository } from '../repositories/waitlistRepository.js';
import { sendWaitlistNotification } from './emailService.js';

export const waitlistService = {
  async createEntry(data) {
    const existing = await waitlistRepository.findByEmail(data.email);
    if (existing) {
      return { success: false, conflict: true };
    }

    const newEntry = await waitlistRepository.create(data);

    sendWaitlistNotification({
      full_name: data.full_name,
      email: data.email,
      website_url: data.website_url,
      source: data.source,
    }).catch((err) => {
      console.error('Email notification failed:', err);
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
};
