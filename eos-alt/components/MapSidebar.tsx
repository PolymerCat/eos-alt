import React from 'react';
import { PPS } from '@/app/actions';
import DataSyncButton from '@/components/DataSyncButton';

interface MapSidebarProps {
  ppsData: PPS[];
  isOpen: boolean;
  onClose: () => void;
  onShelterClick: (pps: PPS) => void;
}

export default function MapSidebar({ ppsData, isOpen, onClose, onShelterClick }: MapSidebarProps) {
  return (
    <div className={`absolute top-0 left-0 z-30 h-full bg-panel border-r border-border shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80 md:w-96 flex flex-col`}>
      <div className="p-6 border-b border-border bg-panel flex flex-col gap-1 shadow-sm relative z-10">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-foreground">Shelter List</h2>
          <button 
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground p-1 rounded transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-foreground/60">{ppsData.length} active relief centers</p>
        <div className="mt-3">
          <DataSyncButton />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow bg-background/50 backdrop-blur-sm">
        {ppsData.map((pps) => (
          <div 
            key={pps.id} 
            onClick={() => onShelterClick(pps)}
            className="p-4 border-b border-border/50 hover:bg-accent/5 cursor-pointer transition-colors flex flex-col gap-2"
          >
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">{pps.name}</h3>
              <p className="text-xs text-foreground/60 mt-0.5">{pps.daerah}, {pps.negeri}</p>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium bg-red-600/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-600/20">
                {pps.bencana}
              </span>
              <span className="text-xs text-foreground/70 bg-foreground/5 px-2 py-0.5 rounded-md border border-border/50">
                Capacity: <span className="font-semibold">{pps.kapasiti}</span>
              </span>
            </div>
          </div>
        ))}
        {ppsData.length === 0 && (
          <div className="p-8 text-center text-foreground/50 text-sm">
            No active relief centers found.
          </div>
        )}
      </div>
    </div>
  );
}