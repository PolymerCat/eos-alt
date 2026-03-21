"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mask from '@turf/mask';
import rewind from '@turf/rewind';
import { FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export default function Map() {
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
            // 1. Fetch Malaysia GeoJSON (ISO code 'MYS')
            // This is a reliable source for country boundaries
            const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
            const data = await response.json();


            // 1. Add Background/Borders & Fog of War
            try {
                // Create the Box Polygon for borders
                const boxGeoJSON: any = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [malaysiaBounds[0][0], malaysiaBounds[0][1]], // SW
                            [malaysiaBounds[1][0], malaysiaBounds[0][1]], // SE
                            [malaysiaBounds[1][0], malaysiaBounds[1][1]], // NE
                            [malaysiaBounds[0][0], malaysiaBounds[1][1]], // NW
                            [malaysiaBounds[0][0], malaysiaBounds[0][1]]  // SW
                        ]]
                    }
                };

                map.current?.addSource('malaysia-source', { type: 'geojson', data: boxGeoJSON });



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

                // // Add bounding box borders
                // map.current?.addLayer({
                //     id: 'malaysia-border',
                //     type: 'line',
                //     source: 'malaysia-source',
                //     paint: {
                //         'line-color': '#2563eb', // Corporate Blue
                //         'line-width': 2,
                //         'line-blur': 1,
                //         'line-dasharray': [2, 2],
                //     }
                // });

                // map.current?.addLayer({
                //     id: 'malaysia-border-glow',
                //     type: 'line',
                //     source: 'malaysia-source',
                //     paint: {
                //         'line-color': '#2563eb',
                //         'line-width': 8,
                //         'line-blur': 10,
                //         'line-opacity': 0.4
                //     }
                // });

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

            // 2. Add Test Data Points ON TOP (Execution order ensures z-index)
            try {
                map.current?.addSource('test-data', {
                    "type": "geojson",
                    "data": {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [101.76053791172866, 3.150091295838452]
                        },
                        "properties": {
                            "title": "Ampang LRT Station",
                            "marker-symbol": "monument"
                        }
                    }
                });

                // test adding own point
                map.current?.addLayer({
                    'id': 'test-data-point',
                    'type': 'circle',
                    'source': 'test-data',
                    'paint': {
                        'circle-radius': 8,
                        'circle-color': '#ef4444', // Red marker
                        'circle-stroke-width': 4,
                        'circle-stroke-color': '#ffffff'
                    }
                });

                // Adding text label separate from the icon
                map.current?.addLayer({
                    'id': 'test-data-label',
                    'type': 'symbol',
                    'source': 'test-data',
                    'layout': {
                        'text-field': ['get', 'title'],
                        // Removed text-font to use default.
                        'text-offset': [0, 1.5],
                        'text-anchor': 'top'
                    },
                    'paint': {
                        'text-color': '#1e293b',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2
                    }
                });
            } catch (err) {
                console.error("Test data layer error:", err);
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