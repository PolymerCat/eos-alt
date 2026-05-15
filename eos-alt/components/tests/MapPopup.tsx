"use client";

import React from 'react';
import { PPS } from '@/app/actions';

/**
 * Props for the MapPopup component
 * @param pps - The PPS data object containing details about the shelter
 */
interface MapPopupProps {
  pps: PPS;
}

/**
 * MapPopup Component
 * 
 * This component represents the UI inside a map marker's popup.
 * By moving this into a standalone component, we can use React state,
 * Tailwind CSS, and complex logic easily compared to raw HTML strings.
 */
export default function MapPopup({ pps }: MapPopupProps) {
  
  /**
   * Example handler for an action inside the popup
   */
  const handleViewDetails = () => {
    console.log(`Viewing details for: ${pps.name}`);
    // You could trigger a sidebar change or navigate to a details page here
  };

  return (
    <div className="p-3 min-w-[240px] font-sans text-slate-800">
      {/* Header Section */}
      <div className="mb-3 border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold text-slate-900 leading-tight">
          {pps.name}
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {pps.daerah}, {pps.negeri}
        </p>
      </div>

      {/* Stats/Information Section */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50 text-center">
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-blue-400 mb-0.5">
            Capacity
          </span>
          <span className="text-xs font-bold text-blue-700">
            {pps.kapasiti}
          </span>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
            Type
          </span>
          <span className="text-xs font-bold text-slate-700 uppercase">
            Shelter
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleViewDetails}
        className="w-full py-2 px-4 text-xs font-medium bg-slate-900 text-white rounded-md 
                   hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 
                   flex items-center justify-center gap-2"
      >
        <span>View Full Profile</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14m-7-7 7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
