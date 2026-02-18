import { z } from 'zod';

// Flexible website validation: accepts website.com, www.website.com, https://website.com, https://www.website.com
const websiteUrlRegex = /^(https?:\/\/)?(www\.)?[\w][\w.-]*\.[a-zA-Z]{2,}(\/.*)?$/i;

export const waitlistSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Must be a valid email address'),
  website_url: z.string()
    .min(1, 'Website is required')
    .refine((val) => websiteUrlRegex.test(val.trim()), 'Must be a valid website')
    .transform((val) => {
      const trimmed = val.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    }),
  source: z.enum(['home', 'about', 'pricing', 'unknown']).optional().default('unknown'),
});

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createAdminSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'contacted', 'converted']),
});
