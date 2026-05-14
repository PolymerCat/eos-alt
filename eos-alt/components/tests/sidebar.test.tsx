"use client";

import React, { useState } from 'react';
import { PPS } from '@/app/actions';
import ShelterCard from './shelter-card.test';

const sampleShelters: PPS[] = [
  {
    id: '1',
    name: 'Pusat Pemindahan A',
    latti: '3.1234',
    longi: '101.5432',
    negeri: 'Selangor',
    daerah: 'Petaling',
    mukim: 'Dengkil',
    bencana: 'Banjir',
    mangsa: '120',
    keluarga: '35',
    kapasiti: '72%',
  },
  {
    id: '2',
    name: 'Pusat Pemindahan B',
    latti: '4.2105',
    longi: '101.9758',
    negeri: 'Kuala Lumpur',
    daerah: 'Cheras',
    mukim: 'Taman Tun',
    bencana: 'Banjir',
    mangsa: '80',
    keluarga: '22',
    kapasiti: '48%',
  },
  {
    id: '3',
    name: 'Pusat Pemindahan C',
    latti: '2.9843',
    longi: '101.4651',
    negeri: 'Selangor',
    daerah: 'Hulu Langat',
    mukim: 'Kajang',
    bencana: 'Tanah Runtuh',
    mangsa: '45',
    keluarga: '12',
    kapasiti: '63%',
  },
];

export default function SidebarTest() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<PPS | null>(null);

  const handleShelterClick = (pps: PPS) => {
    setSelectedShelter(pps);
  };
    // min-h-screen bg-slate-950 text-slate-100 p-6 z-30 relative
  return (
    <div className="absolute z-0 top-0 left-0 z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80 md:w-96 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-4">

        <div className={`overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl transition-all ${isOpen ? 'h-auto' : 'h-20'}`}>
          <div className="flex items-center justify-between gap-4 border-b border-border bg-background/90 p-4">
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
            <div className="space-y-2 p-4">
              {sampleShelters.map((pps) => (
                <ShelterCard
                  key={pps.id}
                  ppsData={pps}
                  selectedShelter={selectedShelter?.id === pps.id}
                  onShelterClick={handleShelterClick}
                  onClick={() => handleShelterClick(pps)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-foreground/60">Sidebar is closed. Click the button to open it and view current shelters.</div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Selected Shelter</h2>
          {selectedShelter ? (
            <div className="space-y-1 text-sm text-foreground/80">
              <p><span className="font-semibold">Name:</span> {selectedShelter.name}</p>
              <p><span className="font-semibold">Location:</span> {selectedShelter.daerah}, {selectedShelter.negeri}</p>
              <p><span className="font-semibold">Capacity:</span> {selectedShelter.kapasiti}</p>
            </div>
          ) : (
            <p className="text-sm text-foreground/60">Select a shelter card to show details here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
