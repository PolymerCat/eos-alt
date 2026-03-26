"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mask from '@turf/mask';
import rewind from '@turf/rewind';
import { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { PPS } from '@/app/actions';

export default function Map({ alerts = [] }: { alerts?: PPS[] }) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (map.current) return;

        // bounds roughly covering Malaysia
        const malaysiaBounds: [number, number][] = [
            [98.5, 0.5], // Southwest [lng, lat]
            [120.5, 8.0]  // Northeast [lng, lat]
        ];

        // 1. Initialize with OpenFreeMap (Truly Free, No API Key)
        map.current = new maplibregl.Map({
            container: mapContainer.current!,
            // OpenFreeMap Liberty style is a great open-source default
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: [101.9758, 4.2105],
            zoom: 5.5,
            maxBounds: malaysiaBounds as [maplibregl.LngLatLike, maplibregl.LngLatLike],
        });

        map.current.on('load', async () => {
            // 1. Fetch Local QGIS-Clipped GeoJSON for Map Borders
            const response = await fetch('/MY-box.geojson');
            const data = await response.json();


            // 1. Add Background/Borders & Fog of War
            try {
                map.current?.addSource('malaysia-source', { type: 'geojson', data });



                // Transform the default black base map borders into glowing lines
                const layers = map.current?.getStyle().layers;
                if (layers) {
                    layers.forEach((layer) => {
                        // OpenFreeMap Liberty style uses 'boundary' in the ID of its border layers
                        if (layer.type === 'line' && layer.id.includes('boundary')) {
                            // Dotted/dashed lines (like states, territories, or disputed borders) usually have a 'line-dasharray' paint property
                            const isDotted = layer.paint && 'line-dasharray' in layer.paint;

                            // Only apply our thick, glowing colors to solid boundaries
                            if (!isDotted) {
                                try {
                                    map.current?.setPaintProperty(layer.id, 'line-color', '#eb2556ff');
                                    map.current?.setPaintProperty(layer.id, 'line-width', 3);
                                    map.current?.setPaintProperty(layer.id, 'line-blur', 2);
                                } catch (e) {
                                    // Safely ignore properties that might not be dynamically settable on specific sub-layers
                                }
                            }
                        }
                    });
                }


            } catch (err) {
                console.error("Map boundaries rendering error:", err);
            }

            const initMask = async () => {
                try {
                    const response = await fetch('newfilter.geojson');
                    if (!response.ok) throw new Error("Failed to fetch Malaysia GeoJSON");

                    const data = await response.json();
                    // --- 1. THE BLURRY SVG PATTERN ---
                    // This SVG is opaque black (1) at the far edges and blurry black (0) at the center.
                    const svgString = `
                        <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="blurGradient" cx="128" cy="128" r="128" gradientUnits="userSpaceOnUse">
                            <stop offset="0.75" stop-color="black" stop-opacity="0.1"/> // The very edge is soft
                            <stop offset="1" stop-color="black" stop-opacity="1"/>     // The outside is fully dark
                            </radialGradient>
                        </defs>
                        <rect width="256" height="256" fill="url(#blurGradient)"/>
                        </svg>
                    `;

                    // Load the SVG string into an Image object
                    const svgImage = new Image(256, 256);
                    svgImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

                    // Add the image to the map's style once it's loaded
                    svgImage.onload = () => {
                        if (map.current && !map.current.hasImage('blurry-mask-pattern')) {
                            map.current.addImage('blurry-mask-pattern', svgImage);
                        }
                    };

                    // Rewind is essential to ensure the "hole" is transparent
                    const fixedData = rewind(data, { reverse: true }) as FeatureCollection<Polygon | MultiPolygon>;
                    const maskedData = mask(fixedData);

                    map.current?.addSource('malaysia-mask-source', {
                        type: 'geojson',
                        data: maskedData
                    });

                    // Add the mask layer
                    map.current?.addLayer({
                        id: 'malaysia-mask-layer',
                        type: 'fill',
                        source: 'malaysia-mask-source',
                        paint: {
                            'fill-color': '#000000',
                            'fill-opacity': 0.3
                        }
                    });
                    // 2. Add the "Feathered" Edges
                    // We loop to create 6 layers of lines, each wider and fainter than the last
                    const steps = 6;
                    for (let i = 1; i <= steps; i++) {
                        map.current?.addLayer({
                            id: `malaysia-mask-blur-${i}`,
                            type: 'line',
                            source: 'malaysia-mask-source',
                            paint: {
                                'line-color': '#000000',
                                // Increase width exponentially, decrease opacity
                                'line-width': i * i * 2,
                                'line-opacity': 0.05 / i,
                                // 'line-blur' helps smoothen the transition between the lines
                                'line-blur': i * 6
                            }
                        });
                    }

                    // Add the white border line
                    map.current?.addLayer({
                        id: 'malaysia-border-line',
                        type: 'line',
                        source: 'malaysia-mask-source',
                        paint: {
                            'line-color': '#ffffff',
                            'line-width': 1.5,
                            'line-opacity': 0.8
                        }
                    });
                } catch (err) {
                    console.error("Mask initialization error:", err);
                }
            };

            // EXECUTE the mask function
            //await initMask();

            // 2. Add Actual PPS Data Points ON TOP
            try {
                const features = alerts.map(alert => ({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [parseFloat(alert.longi), parseFloat(alert.latti)]
                    },
                    properties: {
                        title: alert.name,
                        daerah: alert.daerah,
                        mangsa: alert.mangsa,
                        kapasiti: alert.kapasiti
                    }
                }));

                map.current?.addSource('pps-data', {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": features as any
                    }
                });

                const size = 100;
                const pulsingDot: any = {
                    width: size,
                    height: size,
                    data: new Uint8Array(size * size * 4),

                    onAdd: function () {
                        const canvas = document.createElement('canvas');
                        canvas.width = this.width;
                        canvas.height = this.height;
                        this.context = canvas.getContext('2d', { willReadFrequently: true });
                    },

                    render: function () {
                        const duration = 1500;
                        const t = (performance.now() % duration) / duration;

                        const radius = (size / 2) * 0.15;
                        const outerRadius = (size / 2) * 0.5 * t + radius;
                        const context = this.context;

                        context.clearRect(0, 0, this.width, this.height);
                        
                        // draw outer circle
                        context.beginPath();
                        context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
                        context.fillStyle = `rgba(239, 68, 68, ${1 - t})`; // fading red
                        context.fill();

                        // draw inner circle
                        context.beginPath();
                        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
                        context.fillStyle = 'rgba(239, 68, 68, 1)';
                        context.strokeStyle = 'white';
                        context.lineWidth = 2 + 1 * (1 - t);
                        context.fill();
                        context.stroke();

                        this.data = context.getImageData(0, 0, this.width, this.height).data;
                        map.current?.triggerRepaint();

                        return true;
                    }
                };

                if (!map.current?.hasImage('pulsing-dot')) {
                    map.current?.addImage('pulsing-dot', pulsingDot as any, { pixelRatio: 2 });
                }

                map.current?.addLayer({
                    'id': 'pps-layer',
                    'type': 'symbol',
                    'source': 'pps-data',
                    'layout': {
                        'icon-image': 'pulsing-dot',
                        'icon-allow-overlap': true
                    }
                });

                // Create a popup, but don't add it to the map yet.
                const popup = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: true
                });

                const buildPopupHTML = (props: any) => `
                    <div style="padding: 4px; max-width: 250px;">
                        <h3 style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1e293b;">${props?.title}</h3>
                        <p style="font-size: 12px; margin: 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">Daerah: ${props?.daerah}</p>
                        <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: #dc2626; display: flex; gap: 16px;">
                            <span>Mangsa: ${props?.mangsa}</span>
                            <span>Kapasiti: ${props?.kapasiti}</span>
                        </div>
                    </div>
                `;

                // Desktop hover interaction
                map.current?.on('mouseenter', 'pps-layer', (e) => {
                    if (!e.features || e.features.length === 0) return;
                    map.current!.getCanvas().style.cursor = 'pointer';
                    
                    const coordinates = (e.features[0].geometry as any).coordinates.slice();
                    const description = buildPopupHTML(e.features[0].properties);

                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    popup.setLngLat(coordinates as [number, number])
                        .setHTML(description)
                        .addTo(map.current!);
                });

                map.current?.on('mouseleave', 'pps-layer', () => {
                    map.current!.getCanvas().style.cursor = '';
                    popup.remove();
                });

                // Tap interactions for mobile/clicking edge case
                map.current?.on('click', 'pps-layer', (e) => {
                    if (!e.features || e.features.length === 0) return;
                    const coordinates = (e.features[0].geometry as any).coordinates.slice();
                    const description = buildPopupHTML(e.features[0].properties);

                    popup.setLngLat(coordinates as [number, number])
                        .setHTML(description)
                        .addTo(map.current!);
                });

            } catch (err) {
                console.error("PPS data layer error:", err);
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

            {/* clean overlay relative to the map component */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-panel/90 backdrop-blur-md p-3 rounded-lg border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground">
                        Interactive Map
                    </p>
                </div>
            </div>
        </div>
    );
}