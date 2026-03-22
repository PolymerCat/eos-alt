"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import { getDistricts, saveLocation } from "@/app/profile/actions";
import { toast } from "sonner";

interface State {
  code: number;
  state_name: string;
}

interface District {
  id: number;
  district: string;
}

export default function LocationPicker({
  states,
  initialDistricts = [] }: {
    states: State[], initialDistricts?: District[]
  }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);

  const [currentDistricts, setCurrentDistricts] = useState<District[]>(initialDistricts);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const [selectedState, setSelectedState] = useState<number | "">("");
  const [selectedDistrict, setSelectedDistrict] = useState<number | "">("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Filter districts based on selected state
  // const availableDistricts = selectedState
  //   ? districts.filter(d => (d as any).state === selectedState)
  //   : [];

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [101.9758, 4.2105], // Center on Malaysia
      zoom: 5.5,
    });

    const geocoderApi = {
      forwardGeocode: async (config: any) => {
        const features = [];
        try {
          const request = `https://nominatim.openstreetmap.org/search?q=${config.query}&format=geojson&polygon_geojson=1&addressdetails=1`;
          const response = await fetch(request);
          const geojson = await response.json();
          for (const feature of geojson.features) {
            const center: [number, number] = [
              feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
              feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2,
            ];
            const point = {
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: center },
              place_name: feature.properties.display_name,
              properties: feature.properties,
              text: feature.properties.display_name,
              place_type: ["place"],
              center,
            };
            features.push(point);
          }
        } catch (e) {
          console.error(`Failed to forwardGeocode with error: ${e}`);
        }
        return { type: "FeatureCollection" as const, features };
      },
    };

    const geocoder = new MaplibreGeocoder(geocoderApi, {
      maplibregl: maplibregl as any,
      zoom: 14,
      placeholder: "Search Address...",
      marker: false,
    });

    map.current.addControl(geocoder as any, "top-left");

    // Listen for search results
    geocoder.on("result", (e: any) => {
      if (e.result && e.result.center) {
        const coords = e.result.center;
        updateMarker(coords[0], coords[1]);
        map.current?.flyTo({
          center: coords,
          zoom: 14,
          essential: true
        });
      }
    });

    // Listen for map clicks to drop a pin manually
    map.current.on("click", (e: any) => {
      updateMarker(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const updateMarker = (lng: number, lat: number) => {
    if (!map.current) return;

    setCoordinates({ lat, lng });

    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full bg-accent border-2 border-background shadow-md';

      marker.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  };

  const handleSave = async () => {
    if (!selectedState || !selectedDistrict || !coordinates) return;
    try {
      await saveLocation(
        Number(selectedState),
        Number(selectedDistrict),
        coordinates.lat,
        coordinates.lng
      );
      // Reset after save
      setSelectedState("");
      setSelectedDistrict("");
      setCoordinates(null);
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      toast.success("Location Saved", {
        description: "Your location has been saved."
      });
    } catch (err) {
      console.error(err);
      toast.error("Save Failed", {
        description: "Could not save location. Please try again."
      });
    }
  };

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value ? Number(e.target.value) : "";
    setSelectedState(stateCode);
    setSelectedDistrict(""); // Reset district

    if (stateCode) {
      setIsLoadingDistricts(true);
      try {
        // 2. Fetch districts for the specific state from the database
        const result = await getDistricts(stateCode);
        const normalized = Array.isArray(result) ? result : (result as any)?.data || [];
        setCurrentDistricts(normalized);
      } catch (err) {
        toast.error("Failed to load districts");
      } finally {
        setIsLoadingDistricts(false);
      }
    } else {
      setCurrentDistricts([]);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full min-h-[500px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground/70">State</label>
          <select
            className="rounded-md px-4 py-2 bg-background border border-border text-foreground font-medium focus:outline-none focus:border-accent"
            value={selectedState}
            onChange={handleStateChange} // 3. Use the new handler
          >
            <option value="">-- Select State --</option>
            {states.map((s) => (
              <option key={s.code} value={s.code}>{s.state_name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground/70">District</label>
          <select
            className="rounded-md px-4 py-2 bg-background border border-border text-foreground font-medium focus:outline-none focus:border-accent disabled:opacity-50"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(Number(e.target.value))}
            disabled={!selectedState}
          >
            <option value="">{isLoadingDistricts ? "Loading..." : "-- Select District --"}</option>
            {currentDistricts.map((d) => (
              <option key={d.id} value={d.id}>{d.district}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col justify-between items-start gap-1 border-l-2 border-accent pl-3">
        <p className="font-semibold text-foreground">Pinpoint Location</p>
        <p className="text-sm text-foreground/60">Search for an address or click directly on the map to set your location.</p>
      </div>

      <div className="relative w-full flex-grow border border-border bg-background rounded-lg overflow-hidden min-h-[300px]">
        <div ref={mapContainer} className="w-full h-full absolute inset-0" />

        {!coordinates && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
            <p className="text-foreground bg-panel px-4 py-2 border border-border rounded-md text-sm shadow-md font-medium">
              Select a location on the map
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center bg-panel border border-border p-4 rounded-xl shadow-sm">
        <div className="text-sm text-foreground/70 flex flex-col gap-1">
          <span>LAT: <span className="text-foreground font-semibold">{coordinates ? coordinates.lat.toFixed(6) : "---.------"}</span></span>
          <span>LNG: <span className="text-foreground font-semibold">{coordinates ? coordinates.lng.toFixed(6) : "---.------"}</span></span>
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedState || !selectedDistrict || !coordinates}
          className="bg-accent text-accent-foreground font-medium rounded-md py-2 px-6 text-sm hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Location
        </button>
      </div>
    </div>
  );
}
