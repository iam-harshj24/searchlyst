import { z } from 'zod';

export const waitlistSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Must be a valid email address'),
  website_url: z.union([z.string().url(), z.literal('')]).optional().default(''),
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
