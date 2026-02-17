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

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Must be a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'contacted', 'converted']),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  url: z.string().min(1, 'URL is required').max(500),
  status: z.string().optional(),
  visibility_score: z.number().optional(),
  total_citations: z.number().optional(),
  sentiment: z.number().optional(),
  issues_count: z.number().optional(),
});

export const analyzeWritingStyleSchema = z.object({
  projectId: z.union([z.number(), z.string()]).transform(Number),
});

export const runAuditSchema = z.object({
  url: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional(),
  mode: z.enum(['single', 'full']).default('single'),
  includeAiCheck: z.boolean().default(true),
}).transform((data) => ({
  url: data.url?.trim() || undefined,
  mode: data.mode,
  includeAiCheck: data.includeAiCheck,
}));
