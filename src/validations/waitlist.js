import { z } from 'zod';

// Flexible website validation: accepts website.com, www.website.com, https://website.com, https://www.website.com
const websiteUrlRegex = /^(https?:\/\/)?(www\.)?[\w][\w.-]*\.[a-zA-Z]{2,}(\/.*)?$/i;

export const waitlistSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Must be a valid email address'),
  website_url: z.string()
    .min(1, 'Website is required')
    .refine((val) => websiteUrlRegex.test(val.trim()), 'Must be a valid website (e.g. website.com or https://website.com)'),
  source: z.enum(['home', 'about', 'pricing', 'unknown']).optional().default('unknown'),
});
