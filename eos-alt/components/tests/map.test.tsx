"use client";
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import { PPS } from '@/app/actions';
import SidebarTest from './sidebar.test';
import MapPopup from './MapPopup';
import { useGeolocation } from '@/hooks/UserLocation';


interface MapProps {
  ppsData: PPS[];
}

export default function TestMap({ ppsData }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPPS, setSelectedPPS] = useState<PPS | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const { location, error } = useGeolocation();

  // Initialize map on component mount
  useEffect(() => {
    // if map already initialized, do nothing
    if (map.current) return;

    // initialize map data and settings
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [101.9758, 4.2105],
      zoom: 5.5,
      maxBounds: [[98, 0], [120, 8]], // Limit to Malaysia region with some padding
      minZoom: 4, // Allow zooming out a bit
      maxZoom: 18,
    });

    // Initial map load, fetch and display Malaysia boundary
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

  }, []); // Run only once

  useEffect(() => {
    if (location && map.current) {
      const { latitude, longitude } = location.coords;
      map.current.flyTo({ center: [longitude, latitude], zoom: 12 });
    }
  }, [location]);

  // Handle markers when map is loaded or data changes
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    ppsData.forEach((pps) => {
      const lng = parseFloat(pps.longi);
      const lat = parseFloat(pps.latti);
      if (isNaN(lng) || isNaN(lat)) return;

      // 1. Create a container element for the React component
      const popupNode = document.createElement('div');

      // 2. Render the React component into the container
      // We use a small delay or ensure it's only on the client
      const root = createRoot(popupNode);
      root.render(<MapPopup pps={pps} />);

      // 3. Create the MapLibre popup and attach the container
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: 'none'
      }).setDOMContent(popupNode);

      // Clean up the React root when the popup is removed to prevent memory leaks
      popup.on('close', () => {
        // Optional: you could unmount here if needed, 
        // though MapLibre usually handles DOM removal.
      });

      const marker = new maplibregl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click listener
      marker.getElement().addEventListener('click', () => {
        handlePPSSelect(pps);
      });

      markersRef.current[pps.id] = marker;
    });

  }, [ppsData, mapLoaded]);

  const handlePPSSelect = (pps: PPS, fromSidebar: boolean = false) => {
    setSelectedPPS(pps);
    const lng = parseFloat(pps.longi);
    const lat = parseFloat(pps.latti);
    if (!isNaN(lng) && !isNaN(lat) && map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 12,
        essential: true, // this animation is considered essential with respect to prefers-reduced-motion
      });

      if (fromSidebar) {
        const marker = markersRef.current[pps.id];
        if (marker && !marker.getPopup().isOpen()) {
          marker.togglePopup();
        }
      }
    }
  };


  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 w-full">

      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <SidebarTest ppsData={ppsData} onPPSSelect={handlePPSSelect} selectedPPS={selectedPPS} />
    </div>
  )
}

