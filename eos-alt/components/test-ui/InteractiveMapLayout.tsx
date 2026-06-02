"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createRoot } from "react-dom/client";
import type { PPS } from "@/app/actions";
import PageSection from "./PageSection";
import ShelterCard from "./ShelterCard";
import StatCard from "./StatCard";
import Marker from "../tests/Marker.test";
import MapPopup from "../tests/MapPopup";

interface InteractiveMapLayoutProps {
  shelters: PPS[];
  weatherAlertsCount: number;
}

export default function InteractiveMapLayout({
  shelters,
  weatherAlertsCount,
}: InteractiveMapLayoutProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(
    shelters[0]?.id || null
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});

  const selectedShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  // Initialize Map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [101.9758, 4.2105], // Center of Malaysia
      zoom: 5.5,
      maxBounds: [
        [98, 0],
        [120, 8],
      ], // Limit to Malaysia region
      minZoom: 4,
      maxZoom: 18,
    });

    mapRef.current = newMap;

    newMap.on("load", async () => {
      try {
        const res = await fetch("/MY-box.geojson");
        const geojson = await res.json();
        const featureData =
          geojson.features?.find((f: any) => f.properties?.name === "Malaysia") || geojson;

        if (newMap.isStyleLoaded()) {
          newMap.addSource("malaysia-source", { type: "geojson", data: featureData });
          newMap.addLayer({
            id: "malaysia-border",
            type: "line",
            source: "malaysia-source",
            paint: {
              "line-color": "#00f2ff",
              "line-width": 2,
              "line-blur": 1,
            },
          });
        }
      } catch (err) {
        console.error("Map border load error:", err);
      } finally {
        setMapLoaded(true);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when shelters change or map loads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    shelters.forEach((shelter) => {
      const lng = Number.parseFloat(shelter.longi);
      const lat = Number.parseFloat(shelter.latti);
      if (Number.isNaN(lng) || Number.isNaN(lat)) return;

      // Create Custom Marker
      const markerEl = document.createElement("div");
      const root = createRoot(markerEl);
      root.render(<Marker color="#ef4444" size={16} pulse={false} />);

      // Create React Popup
      const popupNode = document.createElement("div");
      const popupRoot = createRoot(popupNode);
      popupRoot.render(<MapPopup pps={shelter} />);

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: "none",
      }).setDOMContent(popupNode);

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // On open/close or select
      marker.getElement().addEventListener("click", () => {
        setSelectedShelterId(shelter.id);
        map.flyTo({ center: [lng, lat], zoom: 12, essential: true });
      });

      markersRef.current[shelter.id] = marker;
    });
  }, [shelters, mapLoaded]);

  // Handle flying to selected shelter when list is clicked
  const handleSelectShelter = (shelter: PPS) => {
    setSelectedShelterId(shelter.id);
    const lng = Number.parseFloat(shelter.longi);
    const lat = Number.parseFloat(shelter.latti);
    if (!Number.isNaN(lng) && !Number.isNaN(lat) && mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 12, essential: true });

      // Open popup for this marker
      const marker = markersRef.current[shelter.id];
      if (marker) {
        // Close other popups
        Object.entries(markersRef.current).forEach(([id, m]) => {
          if (id !== shelter.id) {
            const p = m.getPopup();
            if (p && p.isOpen()) p.remove();
          }
        });

        const popup = marker.getPopup();
        if (popup && !popup.isOpen()) {
          popup.addTo(mapRef.current);
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <aside className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Shelters" value={shelters.length} detail="Open records" />
          <StatCard label="Warnings" value={weatherAlertsCount} detail="Weather feed" />
        </div>
        <PageSection title="Shelter List" description="Interactive Google Maps-style side panel.">
          <div className="flex max-h-[620px] flex-col gap-3 overflow-y-auto pr-1">
            {shelters.map((shelter) => (
              <ShelterCard
                key={shelter.id}
                shelter={shelter}
                isSelected={shelter.id === selectedShelterId}
                onClick={() => handleSelectShelter(shelter)}
              />
            ))}
          </div>
        </PageSection>
      </aside>

      <section className="relative min-h-[680px] overflow-hidden rounded-lg border border-border bg-[#dbeafe] shadow-sm">
        {/* Style overrides for MapLibre popups */}
        <style dangerouslySetInnerHTML={{ __html: `
          .maplibregl-popup-close-button {
            padding: 0 !important;
            font-size: 16px !important;
            line-height: 1 !important;
            color: #94a3b8 !important;
            font-weight: normal !important;
            transition: color 0.15s, background-color 0.15s !important;
            border-radius: 9999px !important;
            margin: 6px !important;
            border: 0 !important;
            background: transparent !important;
            cursor: pointer !important;
            outline: none !important;
            width: 24px !important;
            height: 24px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            right: 0 !important;
            top: 0 !important;
          }
          .maplibregl-popup-close-button:hover {
            color: #475569 !important;
            background-color: #f1f5f9 !important;
          }
          .maplibregl-popup-content {
            padding: 0 !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
            border: 1px solid #e2e8f0 !important;
          }
          .maplibregl-popup-tip {
            border-top-color: #ffffff !important;
            border-bottom-color: #ffffff !important;
          }
        `}} />

        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Map Controls */}
        <div className="absolute left-4 top-4 z-10 rounded-lg border border-border bg-panel p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-foreground/50">Map Controls</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-md bg-background px-2 py-1 select-none">Shelters</span>
            <span className="rounded-md bg-background px-2 py-1 select-none">Weather</span>
            <span className="rounded-md bg-background px-2 py-1 select-none">Saved Locations</span>
          </div>
        </div>

        {/* Selected Shelter Box */}
        <div className="absolute bottom-4 right-4 z-10 w-[min(360px,calc(100%-2rem))] rounded-lg border border-border bg-panel p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase text-accent">Selected Shelter</p>
          {selectedShelter ? (
            <>
              <h2 className="mt-2 text-base font-bold text-foreground">{selectedShelter.name}</h2>
              <p className="mt-1 text-sm text-foreground/60">
                {selectedShelter.daerah}, {selectedShelter.negeri}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-foreground/50">Victims</p>
                  <p className="font-semibold text-foreground">{selectedShelter.mangsa}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/50">Families</p>
                  <p className="font-semibold text-foreground">{selectedShelter.keluarga}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/50">Capacity</p>
                  <p className="font-semibold text-foreground">{selectedShelter.kapasiti}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-foreground/60">No shelter selected.</p>
          )}
        </div>
      </section>
    </div>
  );
}
