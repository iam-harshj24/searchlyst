
import React from 'react';

// Claude logo (orange sunburst) - same for both themes
export const ClaudeLogo = ({ className = "w-8 h-8" }) => (
    <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69824440a17c76d392c103dc/110911e6c_image.png" 
        alt="Claude" 
        className={className}
    />
);

// Gemini logo (blue/purple 4-pointed star) - same for both themes
export const GeminiLogo = ({ className = "w-8 h-8" }) => (
    <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69824440a17c76d392c103dc/ace1514fd_image.png" 
        alt="Gemini" 
        className={className}
    />
);

// Perplexity logo - black version (inverts to white in dark mode)
export const PerplexityLogo = ({ className = "w-8 h-8" }) => (
    <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69824440a17c76d392c103dc/048c18bc5_image.png" 
        alt="Perplexity" 
        className={`${className} dark:invert`}
    />
);

// ChatGPT logo - black version (inverts to white in dark mode)
export const ChatGPTLogo = ({ className = "w-8 h-8" }) => (
    <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69824440a17c76d392c103dc/69fd8d3f3_image.png" 
        alt="ChatGPT" 
        className={`${className} dark:invert`}
    />
);
