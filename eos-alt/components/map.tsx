"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { PPS } from '@/app/actions';
import MapSidebar from './MapSidebar';
import MapMarkersLayer from './MapMarkersLayer';

interface MapProps {
  ppsData: PPS[];
}

export default function Map({ ppsData }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [101.9758, 4.2105],
      zoom: 5.5,
      maxBounds: [[98, 0], [120, 8]], // Limit to Malaysia region with some padding
      minZoom: 4, // Allow zooming out a bit
      maxZoom: 18,
    });

    map.current.on('load', async () => {
      try {
        // Fetch boundary from local geojson
        const res = await fetch('/MY-box.geojson');
        const geojson = await res.json();
        
        // Add sources (using entire geojson if Malaysia feature not found)
        const featureData = geojson.features?.find((f: any) => f.properties?.name === 'Malaysia') || geojson;

        map.current?.addSource('malaysia-source', { type: 'geojson', data: featureData });

        // Add Malaysia border
        map.current?.addLayer({
          id: 'malaysia-border',
          type: 'line',
          source: 'malaysia-source',
          paint: {
            'line-color': '#00f2ff',
            'line-width': 2,
            'line-blur': 1,
          }
        });
      } catch (err) {
        console.error("Map initialization error:", err);
      } finally {
        setMapLoaded(true);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [ppsData]);

  const handleShelterClick = (pps: PPS) => {
    const lat = parseFloat(pps.latti);
    const lng = parseFloat(pps.longi);
    if (!isNaN(lat) && !isNaN(lng) && map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 12, essential: true });
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  };

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 w-full">
      <MapSidebar 
        ppsData={ppsData} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onShelterClick={handleShelterClick} 
      />

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-20 bg-panel text-foreground p-2 rounded-lg shadow-md border border-border hover:bg-background transition-colors flex items-center justify-center"
        aria-label="Toggle Sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Render Markers Layer when base map is ready */}
      {mapLoaded && map.current && (
        <MapMarkersLayer map={map.current} ppsData={ppsData} />
      )}
    </div>
  );
}