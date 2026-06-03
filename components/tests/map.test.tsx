"use client";
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createRoot } from 'react-dom/client';
import { PPS, WeatherForecast } from '@/app/actions';
import SidebarTest from './sidebar.test';
import MapPopup from './MapPopup';
import Marker from './Marker.test';
import { useGeolocation } from '@/hooks/UserLocation';
import WeatherForecastWidget from '../weather-forecast-widget';
import { Navigation, CloudRain } from 'lucide-react';


interface MapProps {
  ppsData: PPS[];
  weatherData?: WeatherForecast[];
}

export default function TestMap({ ppsData, weatherData = [] }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPPS, setSelectedPPS] = useState<PPS | null>(null);
  const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ x: number, y: number, name: string, count: number } | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hoveredStateIdRef = useRef<number | null>(null);
  const initialCenterRef = useRef(false);
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
        const res = await fetch('/malaysia-states.geojson');
        const geojson = await res.json();

        // Count shelters per state
        const stateCounts: Record<string, number> = {};
        ppsData.forEach(pps => {
          const state = pps.negeri || '';
          const matched = geojson.features.find((f: any) =>
            f.properties?.name?.toLowerCase().includes(state.toLowerCase()) ||
            state.toLowerCase().includes(f.properties?.name?.toLowerCase())
          );
          if (matched) {
            const name = matched.properties.name;
            stateCounts[name] = (stateCounts[name] || 0) + 1;
          }
        });

        // Add shelterCount to features and an ID for hover states
        geojson.features = geojson.features.map((f: any, i: number) => ({
          ...f,
          id: i + 1,
          properties: { ...f.properties, shelterCount: stateCounts[f.properties.name] || 0 }
        }));

        map.current?.addSource('malaysia-source', { type: 'geojson', data: geojson });

        // Choropleth Layer
        map.current?.addLayer({
          id: 'malaysia-choropleth',
          type: 'fill',
          source: 'malaysia-source',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'shelterCount'],
              0, 'rgba(59, 130, 246, 0.05)',   // 0 shelters: subtle blue
              1, 'rgba(234, 179, 8, 0.4)',     // 1 shelter: yellow
              5, 'rgba(249, 115, 22, 0.5)',    // 5 shelters: orange
              15, 'rgba(239, 68, 68, 0.6)'     // 15+ shelters: red
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.8,
              1
            ]
          }
        });

        // Borders Layer
        map.current?.addLayer({
          id: 'malaysia-border',
          type: 'line',
          source: 'malaysia-source',
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#ffffff',
              '#00f2ff'
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              3,
              2
            ],
            'line-blur': 1,
          }
        });

        // Hover events
        map.current?.on('mousemove', 'malaysia-choropleth', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            if (hoveredStateIdRef.current !== null) {
              map.current?.setFeatureState({ source: 'malaysia-source', id: hoveredStateIdRef.current }, { hover: false });
            }
            hoveredStateIdRef.current = feature.id as number;
            map.current?.setFeatureState({ source: 'malaysia-source', id: hoveredStateIdRef.current }, { hover: true });

            const stateName = feature.properties?.name || '';
            const shelterCount = feature.properties?.shelterCount || 0;

            setHoveredStateName(stateName);
            setTooltipData({
              x: e.point.x,
              y: e.point.y,
              name: stateName,
              count: shelterCount
            });
          }
        });

        map.current?.on('mouseleave', 'malaysia-choropleth', () => {
          if (hoveredStateIdRef.current !== null) {
            map.current?.setFeatureState({ source: 'malaysia-source', id: hoveredStateIdRef.current }, { hover: false });
          }
          hoveredStateIdRef.current = null;
          setHoveredStateName(null);
          setTooltipData(null);
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
      if (!initialCenterRef.current) {
        map.current.flyTo({ center: [longitude, latitude], zoom: 12 });
        initialCenterRef.current = true;
      }
    }
  }, [location]);

  const handleCenterOnUser = () => {
    if (location && map.current) {
      const { latitude, longitude } = location.coords;
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 12,
        essential: true,
      });
    }
  };

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

      popup.on('close', () => {
        setSelectedPPS(prev => prev?.id === pps.id ? null : prev);
      });

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
      <style dangerouslySetInnerHTML={{
        __html: `
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
        .maplibregl-popup {
          z-index: 40 !important;
        }
      `}} />

      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Custom Tooltip */}
      {tooltipData && !selectedPPS && (
        <div
          className="absolute z-30 pointer-events-none bg-panel/95 backdrop-blur-md border border-border shadow-xl rounded-lg p-3 text-sm flex flex-col gap-1 transform -translate-x-1/2 -translate-y-[calc(100%+15px)]"
          style={{ left: tooltipData.x, top: tooltipData.y }}
        >
          <div className="font-bold text-foreground text-base border-b border-border/50 pb-1 mb-1">{tooltipData.name}</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-foreground/80">{tooltipData.count} active shelter{tooltipData.count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Weather Forecast Toggle and Card Panel */}
      <div className="absolute top-20 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none origin-top-right scale-[0.7] md:scale-100">
        <button
          onClick={() => setShowWeather(!showWeather)}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-panel/95 backdrop-blur-md border border-border text-xs font-semibold shadow-lg text-foreground transition-all hover:bg-background active:scale-95"
        >
          <CloudRain size={16} className="text-blue-500" />
          <span>{showWeather ? 'Hide Weather' : 'Show Weather'}</span>
        </button>
        
        {showWeather && (
          <div className="pointer-events-auto w-[340px] shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2">
            <WeatherForecastWidget
              forecasts={weatherData}
              variant="overlay"
              maxItems={2}
              locations={hoveredStateName ? [{ states: { state_name: hoveredStateName } }] : (selectedPPS ? [{ states: { state_name: selectedPPS.negeri } }] : [{ states: { state_name: 'Federal Territory of Kuala Lumpur' } }])}
            />
          </div>
        )}
      </div>

      {/* Center on user location panel */}
      <div className="absolute bottom-6 right-4 z-20 pointer-events-none origin-bottom-right scale-[0.7] md:scale-100">
        <div className="pointer-events-auto bg-panel/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-widest text-foreground/60">Your Position</span>
            <span className={`w-2 h-2 rounded-full ${location ? 'bg-emerald-500 animate-pulse' : error ? 'bg-red-500' : 'bg-amber-500'}`}></span>
          </div>
          <button
            onClick={handleCenterOnUser}
            disabled={!location}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/80 text-sm font-semibold transition-all duration-200 ${
              location 
                ? 'bg-background hover:bg-foreground/5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-foreground shadow-sm' 
                : 'bg-background/40 text-foreground/40 cursor-not-allowed'
            }`}
          >
            <Navigation size={15} className={`shrink-0 ${location ? 'text-blue-500 fill-blue-500/20' : 'text-foreground/30'} transform -rotate-45`} />
            <span>Recenter Map</span>
          </button>
          {error ? (
            <p className="text-[10px] text-red-500/90 text-center mt-0.5 max-w-[170px] leading-tight">
              {error}
            </p>
          ) : !location ? (
            <p className="text-[10px] text-foreground/40 text-center mt-0.5">
              Acquiring location signal...
            </p>
          ) : null}
        </div>
      </div>

      <SidebarTest ppsData={ppsData} onPPSSelect={handlePPSSelect} selectedPPS={selectedPPS} />
    </div>
  )
}
