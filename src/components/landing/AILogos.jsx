import React from 'react';

// Perplexity - geometric arrows pointing outward with square frame
export const PerplexityLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square">
        {/* Outer square frame */}
        <path d="M25 35 L25 75 L75 75 L75 35" />
        {/* Center vertical line */}
        <path d="M50 15 L50 85" />
        {/* Left diagonal arrow */}
        <path d="M50 15 L25 40" />
        <path d="M25 40 L25 55" />
        {/* Right diagonal arrow */}
        <path d="M50 15 L75 40" />
        <path d="M75 40 L75 55" />
        {/* Bottom left diagonal */}
        <path d="M50 85 L30 65" />
        {/* Bottom right diagonal */}
        <path d="M50 85 L70 65" />
        {/* Center cross lines */}
        <path d="M35 50 L65 50" />
    </svg>
);

// ChatGPT - interlocking hexagonal knot
export const ChatGPTLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {/* Top loop */}
        <path d="M50 20 C70 20, 80 35, 75 50" />
        {/* Top right to bottom */}
        <path d="M75 50 C70 65, 55 70, 50 70" />
        {/* Bottom center going left */}
        <path d="M50 70 C35 70, 25 60, 25 50" />
        {/* Left side going up */}
        <path d="M25 50 C25 35, 35 25, 50 20" />
        {/* Inner connections */}
        <path d="M40 35 L60 50 L40 65" />
        <path d="M60 35 L40 50 L60 65" />
    </svg>
);

// Gemini - 4-pointed star
export const GeminiLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M50 5 Q52 45 95 50 Q52 55 50 95 Q48 55 5 50 Q48 45 50 5 Z" />
    </svg>
);

// Claude - sunburst/asterisk with rounded pill-shaped rays
export const ClaudeLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        {/* 12 rays arranged in a circle */}
        <rect x="46" y="8" width="8" height="28" rx="4" />
        <rect x="46" y="64" width="8" height="28" rx="4" />
        <rect x="8" y="46" width="28" height="8" rx="4" />
        <rect x="64" y="46" width="28" height="8" rx="4" />
        
        <rect x="46" y="8" width="8" height="28" rx="4" transform="rotate(30 50 50)" />
        <rect x="46" y="64" width="8" height="28" rx="4" transform="rotate(30 50 50)" />
        
        <rect x="46" y="8" width="8" height="28" rx="4" transform="rotate(60 50 50)" />
        <rect x="46" y="64" width="8" height="28" rx="4" transform="rotate(60 50 50)" />
        
        <rect x="46" y="8" width="8" height="28" rx="4" transform="rotate(90 50 50)" />
        <rect x="46" y="64" width="8" height="28" rx="4" transform="rotate(90 50 50)" />
        
        <rect x="46" y="8" width="8" height="28" rx="4" transform="rotate(120 50 50)" />
        <rect x="46" y="64" width="8" height="28" rx="4" transform="rotate(120 50 50)" />
        
        <rect x="46" y="8" width="8" height="28" rx="4" transform="rotate(150 50 50)" />
        <rect x="46" y="64" width="8" height="28" rx="4" transform="rotate(150 50 50)" />
    </svg>
);