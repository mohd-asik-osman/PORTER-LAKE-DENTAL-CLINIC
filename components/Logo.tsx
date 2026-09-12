import React from 'react';

export function Logo({ className = "h-12 w-auto", light = false }: { className?: string, light?: boolean }) {
  const textColor = light ? "white" : "#111827";
  return (
    <svg viewBox="0 0 600 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sun */}
      <circle cx="80" cy="50" r="35" fill="#E89B71" />
      
      {/* Mountain Cutout (White) */}
      <path d="M 40 80 L 60 50 L 75 60 L 90 40 L 110 60 L 120 80 Z" fill="white" />

      {/* Trees (Dark Blue) */}
      <g fill="#041E3A">
        {/* Tree 1 */}
        <polygon points="30,80 25,65 28,65 23,50 28,50 28,40 32,50 27,50 32,65 27,65 35,80" />
        {/* Tree 2 */}
        <polygon points="50,80 42,60 47,60 40,40 47,40 47,25 53,40 46,40 53,60 46,60 55,80" />
        {/* Tree 3 (Center, Tallest) */}
        <polygon points="75,80 65,55 72,55 65,30 72,30 72,10 78,30 71,30 78,55 71,55 80,80" />
        {/* Tree 4 */}
        <polygon points="100,80 92,60 97,60 90,40 97,40 97,25 103,40 96,40 103,60 96,60 105,80" />
        {/* Tree 5 */}
        <polygon points="120,80 115,65 118,65 113,50 118,50 118,40 122,50 117,50 122,65 117,65 125,80" />
      </g>
      
      {/* Base line for trees */}
      <line x1="20" y1="80" x2="135" y2="80" stroke="#041E3A" strokeWidth="2" />

      {/* Water Reflection (Teal) */}
      <path d="M 25 85 Q 60 85 80 90 T 130 85" stroke="#42B9B9" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 35 95 Q 70 95 90 100 T 120 95" stroke="#42B9B9" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 50 105 Q 80 105 100 110 T 110 105" stroke="#42B9B9" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Text */}
      <text x="160" y="55" fontFamily="sans-serif" fontSize="36" fontWeight="300" fill={textColor} letterSpacing="0.3em">PORTERS LAKE</text>
      <text x="240" y="95" fontFamily="sans-serif" fontSize="36" fontWeight="300" fill={textColor} letterSpacing="0.3em">DENTAL</text>
    </svg>
  );
}
