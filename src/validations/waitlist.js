import { z } from 'zod';
import { isWorkEmail } from '@/components/emailValidation';

export const waitlistSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Must be a valid email address'),
  website_url: z.string().min(1, 'Company website is required').url('Must be a valid URL'),
  source: z.enum(['home', 'about', 'pricing', 'unknown']).optional().default('unknown'),
}).refine((data) => isWorkEmail(data.email), {
  message: 'Please enter your work email. Personal emails (Gmail, Yahoo, Outlook, etc.) are not accepted.',
  path: ['email'],
});
