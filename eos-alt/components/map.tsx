"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { PPS } from '@/app/actions';
import MapMarker from './MapMarker';
import MapSidebar from './MapSidebar';

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

    // Initialize with OpenFreeMap
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
        // 2. Fetch Malaysia's boundary from local geojson
        const res = await fetch('/MY-box.geojson');
        const geojson = await res.json();
        
        // Extract Malaysia feature
        const malaysiaFeature = geojson.features.find((f: any) => f.properties.name === 'Malaysia');

        // Add sources
        map.current?.addSource('malaysia-source', { type: 'geojson', data: malaysiaFeature });

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

        // Mark map as loaded
        setMapLoaded(true);

      } catch (err) {
        console.error("Map initialization error:", err);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [ppsData]);

  return (
    <div className="fixed inset-0 w-full h-full">
      <MapSidebar ppsData={ppsData} isOpen={sidebarOpen} />

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-20 left-4 z-20 bg-white p-2 rounded shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Render markers when map is loaded */}
      {mapLoaded && map.current && ppsData.map((pps) => (
        <MapMarker key={pps.id} pps={pps} map={map.current} />
      ))}
    </div>
  );
}