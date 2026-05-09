"use client";
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { PPS } from '@/app/actions';

interface MapProps {
  ppsData: PPS[];
}

export default function TestMap({ ppsData }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

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

        }, [ppsData]);


        return (
            <div className="fixed top-16 bottom-0 left-0 right-0 w-full">
                {/* Map container */}
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            </div>
        )
}
