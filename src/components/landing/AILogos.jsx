import React from 'react';

export const PerplexityLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M50 10 L70 30 L70 50 L90 50 L90 70 L70 70 L70 90 L50 70 L30 90 L30 70 L10 70 L10 50 L30 50 L30 30 Z" />
    </svg>
);

export const ChatGPTLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="8">
        <path d="M50 20 Q70 20 80 35 Q90 50 80 65 Q70 80 50 80 Q30 80 20 65 Q10 50 20 35 Q30 20 50 20 Z" />
        <path d="M35 35 Q50 25 65 35 Q75 50 65 65 Q50 75 35 65 Q25 50 35 35 Z" />
        <circle cx="50" cy="50" r="15" />
    </svg>
);

export const GeminiLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M50 10 L55 30 L50 45 L45 30 Z" />
        <path d="M50 55 L55 70 L50 90 L45 70 Z" />
        <path d="M10 50 L30 45 L45 50 L30 55 Z" />
        <path d="M55 50 L70 45 L90 50 L70 55 Z" />
        <path d="M25 25 L40 35 L30 45 L20 35 Z" />
        <path d="M60 35 L75 25 L80 35 L70 45 Z" />
        <path d="M25 75 L35 65 L45 70 L35 80 Z" />
        <path d="M55 70 L65 65 L75 75 L65 80 Z" />
    </svg>
);

export const ClaudeLogo = ({ className = "w-8 h-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
        <path d="M50 15 L65 35 Q70 50 65 65 L50 85 L35 65 Q30 50 35 35 Z" />
        <path d="M50 30 L60 45 Q63 50 60 55 L50 70 L40 55 Q37 50 40 45 Z" />
    </svg>
);