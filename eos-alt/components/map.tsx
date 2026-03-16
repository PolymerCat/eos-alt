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
                                    return [feature.geometry.coordinates[0]];
                                } else if (feature.geometry.type === 'MultiPolygon') {
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
                        'fill-color': '#09090b', // Match dark background
                        'fill-opacity': 0.85
                    }
                });

                // Hide unnecessary labels globally
                const layers = map.current?.getStyle().layers;
                if (layers) {
                    layers.forEach((layer) => {
                        if (layer.type === 'symbol') {
                            map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
                        }
                    });
                }

                // 6. Layer: Tactical Amber Border (Helldivers 2 inspired)
                map.current?.addLayer({
                    id: 'malaysia-border',
                    type: 'line',
                    source: 'malaysia-source',
                    paint: {
                        'line-color': '#facc15', // Tactical Yellow/Amber
                        'line-width': 2,
                        'line-blur': 1,
                        'line-dasharray': [2, 2], // Adds a dashed, radar-like look
                        'fill-opacity': 0.05 // Faint yellow tint inside
                    }
                });

                // Add a glowing effect layer
                map.current?.addLayer({
                    id: 'malaysia-border-glow',
                    type: 'line',
                    source: 'malaysia-source',
                    paint: {
                        'line-color': '#facc15', // Tactical Yellow/Amber
                        'line-width': 8,
                        'line-blur': 10,
                        'line-opacity': 0.4
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
        <div className="relative w-full h-full flex-grow overflow-hidden border border-border bg-background">
            {/* the map itself fills the whole div */}
            <div ref={mapContainer} className="w-full h-full" />

            {/* tactical overlay relative to the map component */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-panel/90 backdrop-blur-md p-4 border-l-4 border-accent shadow-lg shadow-accent/10">
                    <p className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                        Satellite Link: Active
                    </p>
                    <h1 className="text-foreground font-bold text-xl tracking-tighter uppercase">MALAYSIA_SECTOR</h1>
                </div>
            </div>

            {/* crosshair overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30 mix-blend-screen flex items-center justify-center">
                <div className="w-[1px] h-10 bg-accent absolute"></div>
                <div className="w-10 h-[1px] bg-accent absolute"></div>
                <div className="w-16 h-16 border border-accent rounded-full absolute border-opacity-40 border-dashed animate-spin-slow"></div>
            </div>
        </div>
    );
}