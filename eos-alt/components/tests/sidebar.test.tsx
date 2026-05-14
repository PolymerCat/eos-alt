"use client";

import React, { useState } from 'react';
import { PPS } from '@/app/actions';
import ShelterCard from './shelter-card.test';

interface SidebarProps {
  ppsData: PPS[];
  onPPSSelect: (pps: PPS) => void;
  selectedPPS: PPS | null;
}

export default function SidebarTest({ ppsData, onPPSSelect, selectedPPS }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  // min-h-screen bg-slate-950 text-slate-100 p-6 z-30 relative
  return (
    <div className={`absolute z-0 top-0 left-0 z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80 md:w-96 flex flex-col h-full pointer-events-none`}>
      <div className="max-w-4xl mx-auto space-y-4 p-6 pointer-events-auto w-full h-full flex flex-col">

        <div className={`overflow-hidden flex flex-col rounded-3xl border border-border bg-panel shadow-2xl transition-all ${isOpen ? 'h-full max-h-[60vh]' : 'h-20'}`}>
          <div className="flex items-center justify-between gap-4 border-b border-border bg-background/90 p-4 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">Available shelters</h2>
              <p className="text-sm text-foreground/70">Tap a shelter card to select it.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-foreground/5"
            >
              {isOpen ? 'Hide' : 'Show'} list
            </button>
          </div>

          {isOpen ? (
            <div className="space-y-2 p-4 overflow-y-auto grow">
              {ppsData.map((pps) => (
                <ShelterCard
                  key={pps.id}
                  ppsData={pps}
                  selectedShelter={selectedPPS?.id === pps.id}
                  onShelterClick={onPPSSelect}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-foreground/60">Sidebar is closed. Click the button to open it and view current shelters.</div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm shrink-0">
          <h2 className="text-lg font-semibold mb-2">Selected Shelter</h2>
          {selectedPPS ? (
            <div className="space-y-1 text-sm text-foreground/80">
              <p><span className="font-semibold">Name:</span> {selectedPPS.name}</p>
              <p><span className="font-semibold">Location:</span> {selectedPPS.daerah}, {selectedPPS.negeri}</p>
              <p><span className="font-semibold">Capacity:</span> {selectedPPS.kapasiti}</p>
            </div>
          ) : (
            <p className="text-sm text-foreground/60">Select a shelter card to show details here.</p>
          )}
        </div>
      </div>
    </div>
  );
}

