import React from 'react';

// Perplexity - geometric arrows with square frame (matching official logo)
export const PerplexityLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* Top arrow pointing up */}
        <path d="M50 10 L50 45" />
        <path d="M30 30 L50 10 L70 30" />
        {/* Left vertical */}
        <path d="M30 30 L30 70" />
        {/* Right vertical */}
        <path d="M70 30 L70 70" />
        {/* Bottom horizontal */}
        <path d="M30 70 L70 70" />
        {/* Bottom arrow pointing down */}
        <path d="M50 55 L50 90" />
        <path d="M35 75 L50 90 L65 75" />
        {/* Center horizontal */}
        <path d="M30 45 L70 45" />
    </svg>
);

// ChatGPT - hexagonal interlocking knot (matching official logo)
export const ChatGPTLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer hexagonal flower pattern */}
        <path d="M50 15 L50 30" />
        <path d="M50 15 C65 15, 78 25, 80 40" />
        <path d="M80 40 L67 47" />
        <path d="M80 40 C85 55, 78 70, 65 78" />
        <path d="M65 78 L58 65" />
        <path d="M65 78 C55 85, 40 85, 30 78" />
        <path d="M30 78 L37 65" />
        <path d="M30 78 C18 70, 12 55, 17 40" />
        <path d="M17 40 L30 47" />
        <path d="M17 40 C20 25, 35 15, 50 15" />
        {/* Inner connections */}
        <path d="M50 30 L67 47 L58 65 L37 65 L30 47 L50 30" />
    </svg>
);

// Gemini - 4-pointed star (matching official logo)
export const GeminiLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M50 0 C50 50, 50 50, 100 50 C50 50, 50 50, 50 100 C50 50, 50 50, 0 50 C50 50, 50 50, 50 0 Z" />
    </svg>
);

// Claude - sunburst with rounded pill rays (matching official logo)
export const ClaudeLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        {/* Top ray */}
        <rect x="46" y="5" width="8" height="30" rx="4" />
        {/* Bottom ray */}
        <rect x="46" y="65" width="8" height="30" rx="4" />
        {/* Right ray */}
        <rect x="65" y="46" width="30" height="8" rx="4" />
        {/* Left ray */}
        <rect x="5" y="46" width="30" height="8" rx="4" />
        {/* Top-right ray */}
        <rect x="46" y="5" width="8" height="30" rx="4" transform="rotate(45 50 50)" />
        {/* Bottom-left ray */}
        <rect x="46" y="65" width="8" height="30" rx="4" transform="rotate(45 50 50)" />
        {/* Top-left ray */}
        <rect x="46" y="5" width="8" height="30" rx="4" transform="rotate(-45 50 50)" />
        {/* Bottom-right ray */}
        <rect x="46" y="65" width="8" height="30" rx="4" transform="rotate(-45 50 50)" />
        {/* Additional rays for fuller sunburst */}
        <rect x="46" y="5" width="8" height="30" rx="4" transform="rotate(22.5 50 50)" />
        <rect x="46" y="65" width="8" height="30" rx="4" transform="rotate(22.5 50 50)" />
        <rect x="46" y="5" width="8" height="30" rx="4" transform="rotate(-22.5 50 50)" />
        <rect x="46" y="65" width="8" height="30" rx="4" transform="rotate(-22.5 50 50)" />
        <rect x="46" y="5" width="8" height="30" rx="4" transform="rotate(67.5 50 50)" />
        <rect x="46" y="65" width="8" height="30" rx="4" transform="rotate(67.5 50 50)" />
        <rect x="46" y="5" width="8" height="30" rx="4" transform="rotate(-67.5 50 50)" />
        <rect x="46" y="65" width="8" height="30" rx="4" transform="rotate(-67.5 50 50)" />
    </svg>
);