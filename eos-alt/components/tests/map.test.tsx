"use client";
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import { PPS } from '@/app/actions';
import SidebarTest from './sidebar.test';
import MapPopup from './MapPopup';
import Marker from './Marker.test';
import { useGeolocation } from '@/hooks/UserLocation';


interface MapProps {
  ppsData: PPS[];
}

export default function TestMap({ ppsData }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPPS, setSelectedPPS] = useState<PPS | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { location } = useGeolocation();

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
        const features = Array.isArray((geojson as { features?: unknown[] }).features)
          ? (geojson as { features: Array<{ properties?: { name?: string } }> }).features
          : [];
        const featureData = features.find((feature) => feature.properties?.name === 'Malaysia') || geojson;

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

      // Update or create User Location Marker
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        const root = createRoot(el);
        root.render(<Marker color="#3b82f6" size={20} pulse={true} label="You are here" />);

        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      } else {
        userMarkerRef.current.setLngLat([longitude, latitude]);
      }

      // Optionally fly to user location on first fix
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

      // 1. Create container for Custom Marker
      const markerEl = document.createElement('div');
      const markerRoot = createRoot(markerEl);
      markerRoot.render(<Marker color="#ef4444" />);

      // 2. Create container for the React Popup
      const popupNode = document.createElement('div');
      const popupRoot = createRoot(popupNode);
      popupRoot.render(<MapPopup pps={pps} />);

      // 3. Create the MapLibre popup
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: 'none'
      }).setDOMContent(popupNode);

      const marker = new maplibregl.Marker({ element: markerEl })
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

      // Close all other popups
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        if (id !== pps.id) {
          const popup = marker.getPopup();
          if (popup && popup.isOpen()) {
            popup.remove();
          }
        }
      });

      if (fromSidebar) {
        const marker = markersRef.current[pps.id];
        if (marker) {
          const popup = marker.getPopup();
          if (popup && !popup.isOpen()) {
            popup.addTo(map.current);
          }
        }
      }
    }
  };


  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 w-full">
      {/* Global overrides for MapLibre Popups to resolve Tailwind conflict and style beautifully */}
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

      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      <SidebarTest ppsData={ppsData} onPPSSelect={handlePPSSelect} selectedPPS={selectedPPS} />
    </div>
  )
}

