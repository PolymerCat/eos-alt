"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    // 1. Initialize with OpenFreeMap (Truly Free, No API Key)
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      // OpenFreeMap Liberty style is a great open-source default
      style: 'https://tiles.openfreemap.org/styles/dark', 
      center: [101.9758, 4.2105], 
      zoom: 5.5,
    });

    map.current.on('load', async () => {
      try {
        // 2. Fetch Malaysia's boundary
        const res = await fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/countries/malaysia.geojson');
        const geojson = await res.json();

        // 3. Create the Mask (The "Blackout" effect)
        // This is a "Feature" with an empty "properties" object to satisfy TypeScript
        const worldMask: any = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [
            // 1. Exterior Ring: The whole world
            [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
            // 2. Interior Rings: Every part of Malaysia
            ...geojson.features.flatMap((feature: any) => {
                if (feature.geometry.type === 'Polygon') {
                // If it's a simple polygon, take its first ring
                return [feature.geometry.coordinates[0]];
                } else if (feature.geometry.type === 'MultiPolygon') {
                // If it's a MultiPolygon, take the first ring of every sub-polygon
                return feature.geometry.coordinates.map((poly: any) => poly[0]);
                }
                return [];
            })
            ]
        }
        };

        // 4. Add the sources
        map.current?.addSource('malaysia-source', { type: 'geojson', data: geojson });
        map.current?.addSource('mask-source', { type: 'geojson', data: worldMask });

        // 5. Layer: Dim the rest of the world
        map.current?.addLayer({
          id: 'world-mask',
          type: 'fill',
          source: 'mask-source',
          paint: {
            'fill-color': '#050505', // Near black
            'fill-opacity': 1.0
          }
        });
        // 2. Optional: Remove Labels from the Base Map
        // This loop finds any layer with "label" or "symbol" in the ID and hides it
        // unless it's something we want to keep.
        const layers = map.current?.getStyle().layers;
        if (layers) {
        layers.forEach((layer) => {
            // Hide all text labels globally so they don't show through the mask
            if (layer.type === 'symbol') {
            map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
            }
        });
        }

        // 6. Layer: Cyan Neon Border (Fashion Frame Accent)
        map.current?.addLayer({
          id: 'malaysia-border',
          type: 'line',
          source: 'malaysia-source',
          paint: {
            'line-color': '#00f2ff',
            'line-width': 2,
            'line-blur': 1,
            'fill-opacity': 0.05 // A very faint cyan tint inside Malaysia
          }
        });

      } catch (err) {
        console.error("Map initialization error:", err);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    // <div className="relative w-full group overflow-hidden rounded-3xl border border-slate-800 shadow-2xl bg-[#050505]">
    //   {/* MAP ENGINE */}
    //   <div ref={mapContainer} className="w-full min-h-[80vh]" />

    //   {/* TACTICAL OVERLAY */}
    //   <div className="absolute top-6 left-6 pointer-events-none">
    //     <div className="bg-black/60 backdrop-blur-xl p-4 border-l-4 border-cyan-500 rounded-r-md">
    //       <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Satellite Link: Active</p>
    //       <h1 className="text-white font-bold text-xl tracking-tighter">MALAYSIA_SECTOR</h1>
    //     </div>
    //   </div>
    // </div>

    <div className="absolute inset-0 z-0">
      {/* the map itself fills the whole div */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* tactical overlay can stay relative to this full‑screen container */}
      <div className="absolute top-18 left-6 pointer-events-none">
         <div className="bg-black/60 backdrop-blur-xl p-4 border-l-4 border-cyan-500 rounded-r-md">
           <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-[0.3em] mb-1">Satellite Link: Active</p>
           <h1 className="text-white font-bold text-xl tracking-tighter">MALAYSIA_SECTOR</h1>
         </div>
      </div>
    </div>
  );
}