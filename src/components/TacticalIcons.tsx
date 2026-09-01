import React from 'react';

/**
 * Industrial Hex Bolt Rivet Accent
 */
export const HexBolt: React.FC<{ className?: string }> = ({ className = "w-2.5 h-2.5 text-neutral-600" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" opacity="0.6" />
    <circle cx="12" cy="12" r="4" fill="#0D0F12" />
  </svg>
);

/**
 * Tactical Off-Road Locking Differential & Axle Graphic
 */
export const AxleLockerIcon: React.FC<{ locked?: boolean; className?: string }> = ({ 
  locked = true, 
  className = "w-5 h-5" 
}) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      {/* Heavy-duty axle shaft */}
      <line x1="2" y1="12" x2="22" y2="12" strokeWidth="3" stroke={locked ? "#EF4444" : "#64748B"} />
      {/* Heavy-duty wheels / beadlocks */}
      <rect x="2" y="7" width="2.5" height="10" rx="1" fill={locked ? "#EF4444" : "#64748B"} />
      <rect x="19.5" y="7" width="2.5" height="10" rx="1" fill={locked ? "#EF4444" : "#64748B"} />
      {/* Differential pumpkin */}
      <circle cx="12" cy="12" r="4.5" fill="#14171E" stroke={locked ? "#EF4444" : "#64748B"} strokeWidth="2" />
      {/* Electronic locker status indicator */}
      <circle cx="12" cy="12" r="1.8" fill={locked ? "#10B981" : "#EF4444"} />
    </svg>
  );
};

/**
 * Tactical Heavy-Duty Logo Mark
 */
export const SentinelEmblem: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="w-full h-full bg-[#EF4444] rounded-xs rotate-45 shadow-md shadow-[#EF4444]/30 flex items-center justify-center">
      <div className="w-2.5 h-2.5 bg-[#0D0F12] rounded-xs" />
    </div>
  </div>
);
