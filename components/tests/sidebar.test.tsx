"use client";

import React, { useState } from 'react';
import { PPS } from '@/app/actions';
import type { SavedLocation } from '@/types/emergency';
import ShelterCard from './shelter-card.test';

export type TestMapLayer = "shelters" | "saved_locations";

interface SidebarProps {
  ppsData: PPS[];
  savedLocations: SavedLocation[];
  mapLayer: TestMapLayer;
  onMapLayerChange: (layer: TestMapLayer) => void;
  onPPSSelect: (pps: PPS, fromSidebar?: boolean) => void;
  onSavedLocationSelect: (location: SavedLocation, fromSidebar?: boolean) => void;
  selectedPPS: PPS | null;
  selectedSavedLocation: SavedLocation | null;
}

function getLayerCopy(layer: TestMapLayer) {
  if (layer === "saved_locations") {
    return {
      title: "Saved locations",
      description: "Tap a saved place to focus it on the map.",
      closedCopy: "Sidebar is closed. Click the button to open it and view saved locations.",
      selectedTitle: "Selected Location",
      emptyCopy: "No saved locations found. Add one from Profile.",
    };
  }

  return {
    title: "Available shelters",
    description: "Tap a shelter card to select it.",
    closedCopy: "Sidebar is closed. Click the button to open it and view current shelters.",
    selectedTitle: "Selected Shelter",
    emptyCopy: "No shelters found for this data mode.",
  };
}

export default function SidebarTest({
  ppsData,
  savedLocations,
  mapLayer,
  onMapLayerChange,
  onPPSSelect,
  onSavedLocationSelect,
  selectedPPS,
  selectedSavedLocation,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const copy = getLayerCopy(mapLayer);

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute left-4 top-4 z-40 rounded-full border border-border bg-panel px-4 py-2 text-sm font-medium text-foreground shadow-lg transition hover:bg-background"
          aria-label="Show shelter list"
        >
          Show list
        </button>
      )}

      <div className={`absolute top-0 left-0 z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80 md:w-96 flex flex-col h-full pointer-events-none`}>
        <div className="max-w-4xl mx-auto space-y-4 p-6 pointer-events-auto w-full h-full flex flex-col">

        <div className={`overflow-hidden flex flex-col rounded-3xl border border-border bg-panel shadow-2xl transition-all ${isOpen ? 'h-full max-h-[60vh]' : 'h-20'}`}>
          <div className="flex items-center justify-between gap-4 border-b border-border bg-background/90 p-4 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">{copy.title}</h2>
              <p className="text-sm text-foreground/70">{copy.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-foreground/5"
            >
              {isOpen ? 'Hide' : 'Show'} list
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-border bg-panel p-3">
            <button
              type="button"
              onClick={() => onMapLayerChange("shelters")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mapLayer === "shelters"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-background text-foreground/65 hover:text-foreground"
              }`}
            >
              Shelters
            </button>
            <button
              type="button"
              onClick={() => onMapLayerChange("saved_locations")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mapLayer === "saved_locations"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-background text-foreground/65 hover:text-foreground"
              }`}
            >
              Saved Locations
            </button>
          </div>

          {isOpen ? (
            <div className="space-y-2 p-4 overflow-y-auto grow">
              {mapLayer === "shelters" ? (
                ppsData.length > 0 ? (
                  ppsData.map((pps) => (
                    <ShelterCard
                      key={pps.id}
                      ppsData={pps}
                      selectedShelter={selectedPPS?.id === pps.id}
                      onShelterClick={(pps) => onPPSSelect(pps, true)}
                    />
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-foreground/60">
                    {copy.emptyCopy}
                  </p>
                )
              ) : (
                savedLocations.length > 0 ? (
                  savedLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => onSavedLocationSelect(location, true)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedSavedLocation?.id === location.id
                          ? "border-blue-500 bg-blue-500/10 shadow-sm"
                          : "border-border bg-background hover:border-blue-500/60"
                      }`}
                    >
                      <p className="font-semibold text-foreground">{location.label}</p>
                      <p className="mt-1 text-sm text-foreground/65">
                        {location.districtName}, {location.stateName}
                      </p>
                      {location.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-foreground/55">
                          {location.description}
                        </p>
                      ) : null}
                      <p className="mt-3 font-mono text-[11px] text-foreground/45">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-foreground/60">
                    {copy.emptyCopy}
                  </p>
                )
              )}
            </div>
          ) : (
            <div className="p-4 text-sm text-foreground/60">{copy.closedCopy}</div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm shrink-0">
          <h2 className="text-lg font-semibold mb-2">{copy.selectedTitle}</h2>
          {mapLayer === "shelters" && selectedPPS ? (
            <div className="space-y-1 text-sm text-foreground/80">
              <p><span className="font-semibold">Name:</span> {selectedPPS.name}</p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className={selectedPPS.status === "offline" ? "text-slate-500" : "text-emerald-600"}>
                  {selectedPPS.status === "offline" ? "Offline" : "Online"}
                </span>
              </p>
              <p><span className="font-semibold">Location:</span> {selectedPPS.daerah}, {selectedPPS.negeri}</p>
              <p><span className="font-semibold">Capacity:</span> {selectedPPS.kapasiti}</p>
            </div>
          ) : mapLayer === "saved_locations" && selectedSavedLocation ? (
            <div className="space-y-1 text-sm text-foreground/80">
              <p><span className="font-semibold">Name:</span> {selectedSavedLocation.label}</p>
              <p><span className="font-semibold">Location:</span> {selectedSavedLocation.districtName}, {selectedSavedLocation.stateName}</p>
              {selectedSavedLocation.description ? (
                <p><span className="font-semibold">Note:</span> {selectedSavedLocation.description}</p>
              ) : null}
              <p>
                <span className="font-semibold">Coordinates:</span>{" "}
                {selectedSavedLocation.latitude.toFixed(4)}, {selectedSavedLocation.longitude.toFixed(4)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-foreground/60">
              Select a {mapLayer === "shelters" ? "shelter" : "saved location"} card to show details here.
            </p>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

