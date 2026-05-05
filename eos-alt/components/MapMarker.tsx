"use client";

import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import { PPS } from '@/app/actions';
import MapPopup from './MapPopup';

interface MapMarkerProps {
  pps: PPS;
  map: maplibregl.Map;
}

export default function MapMarker({ pps, map }: MapMarkerProps) {
  useEffect(() => {
    const lat = parseFloat(pps.latti);
    const lng = parseFloat(pps.longi);

    if (isNaN(lat) || isNaN(lng)) return;

    // Create a pulsing marker
    const el = document.createElement('div');
    el.className = 'pps-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#ff4444';
    el.style.border = '2px solid #ffffff';
    el.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';

    const marker = new maplibregl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map);

    // Create popup content container
    const popupContainer = document.createElement('div');

    // Render React component into the container
    const root = createRoot(popupContainer);
    root.render(<MapPopup pps={pps} />);

    // Add popup
    const popup = new maplibregl.Popup({ offset: 25 })
      .setDOMContent(popupContainer);

    marker.setPopup(popup);

    // Cleanup
    return () => {
      marker.remove();
      root.unmount();
    };
  }, [pps, map]);

  return null;
}