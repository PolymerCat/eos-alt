"use client";

import React from 'react';

interface MarkerProps {
  color?: string;
  size?: number;
  pulse?: boolean;
  label?: string;
}

/**
 * Marker Component
 * 
 * A flexible, pulsing circle marker for the map.
 * @param color - The hex or tailwind color for the marker (default: #ef4444)
 * @param size - The diameter of the marker in pixels (default: 16)
 * @param pulse - Whether the marker should have a pulsing animation (default: true)
 * @param label - Optional text displayed below the marker without moving its map anchor
 */
export default function Marker({ 
  color = "#ef4444", 
  size = 16, 
  pulse = true,
  label,
}: MarkerProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      
      {/* The Pulse Effect */}
      {pulse && (
        <div 
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: color, animationDuration: '2s' }}
        />
      )}

      {/* The Solid Center */}
      <div 
        className="relative rounded-full border-2 border-white shadow-md"
        style={{ 
          backgroundColor: color, 
          width: size, 
          height: size 
        }}
      />

      {/* Optional: Add a small white dot in the center for a premium look */}
      <div className="absolute w-1 h-1 bg-white rounded-full opacity-50" />

      {label && (
        <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-blue-600 px-2 py-0.5 text-[10px] font-semibold leading-4 text-white shadow-md">
          {label}
        </div>
      )}
    </div>
  );
}
