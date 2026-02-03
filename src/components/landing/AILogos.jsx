import React from 'react';

// Perplexity - geometric star/compass shape
export const PerplexityLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="6">
        <path d="M50 5 L50 95" />
        <path d="M5 50 L95 50" />
        <path d="M20 20 L80 80" />
        <path d="M80 20 L20 80" />
        <rect x="25" y="25" width="50" height="50" />
    </svg>
);

// ChatGPT - interlocking knot/flower pattern
export const ChatGPTLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5">
        <path d="M50 15 C65 15 75 25 75 40 C75 50 65 55 50 55" />
        <path d="M50 55 C35 55 25 65 25 75 C25 85 35 90 50 85" />
        <path d="M50 85 C65 80 80 75 85 60 C90 45 80 35 65 35" />
        <path d="M65 35 C55 35 45 30 40 20 C35 15 40 10 50 15" />
        <path d="M35 40 C25 45 15 55 15 70 C15 80 25 85 35 80" />
        <path d="M35 80 C45 75 55 75 65 80 C75 85 80 75 75 65" />
    </svg>
);

// Gemini - sparkle/star burst
export const GeminiLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <ellipse cx="50" cy="50" rx="8" ry="45" />
        <ellipse cx="50" cy="50" rx="45" ry="8" />
        <ellipse cx="50" cy="50" rx="8" ry="45" transform="rotate(45 50 50)" />
        <ellipse cx="50" cy="50" rx="45" ry="8" transform="rotate(45 50 50)" />
    </svg>
);

// Claude - sunburst/asterisk pattern
export const ClaudeLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <rect x="47" y="10" width="6" height="35" rx="3" />
        <rect x="47" y="55" width="6" height="35" rx="3" />
        <rect x="10" y="47" width="35" height="6" rx="3" />
        <rect x="55" y="47" width="35" height="6" rx="3" />
        <rect x="47" y="10" width="6" height="35" rx="3" transform="rotate(45 50 50)" />
        <rect x="47" y="55" width="6" height="35" rx="3" transform="rotate(45 50 50)" />
        <rect x="10" y="47" width="35" height="6" rx="3" transform="rotate(45 50 50)" />
        <rect x="55" y="47" width="35" height="6" rx="3" transform="rotate(45 50 50)" />
        <rect x="47" y="10" width="6" height="35" rx="3" transform="rotate(22.5 50 50)" />
        <rect x="47" y="55" width="6" height="35" rx="3" transform="rotate(22.5 50 50)" />
        <rect x="47" y="10" width="6" height="35" rx="3" transform="rotate(67.5 50 50)" />
        <rect x="47" y="55" width="6" height="35" rx="3" transform="rotate(67.5 50 50)" />
    </svg>
);