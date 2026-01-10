import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d4ff" />
        <stop offset="100%" stopColor="#1e90ff" />
      </linearGradient>
      <linearGradient id="vip-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff006e" />
        <stop offset="100%" stopColor="#ff5e99" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Tech Hexagon Background */}
    <path 
      d="M50 5 L93.3 25 V75 L50 95 L6.7 75 V25 Z" 
      stroke="url(#cyber-grad)" 
      strokeWidth="2" 
      fill="rgba(0, 212, 255, 0.05)"
    />
    
    {/* Abstract Trophy / Neural Network Shape */}
    <path 
      d="M30 35 L50 65 L70 35" 
      stroke="url(#vip-grad)" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      filter="url(#glow)"
    />
    
    {/* Neural Nodes */}
    <circle cx="30" cy="35" r="4" fill="#00d4ff" filter="url(#glow)" />
    <circle cx="70" cy="35" r="4" fill="#00d4ff" filter="url(#glow)" />
    <circle cx="50" cy="65" r="4" fill="#ff006e" filter="url(#glow)" />
    
    {/* Data Flow Lines */}
    <path d="M50 65 V85" stroke="url(#cyber-grad)" strokeWidth="2" />
    <path d="M50 15 V35" stroke="url(#cyber-grad)" strokeWidth="2" strokeDasharray="4 2" />
    
    {/* Side Accents */}
    <path d="M15 50 L25 50" stroke="#1e90ff" strokeWidth="2" />
    <path d="M75 50 L85 50" stroke="#1e90ff" strokeWidth="2" />
  </svg>
);