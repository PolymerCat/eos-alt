"use client";

import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { PPS } from '@/app/actions';
import { getShelterDisasterPresentation } from "@/lib/shelters/disaster";

interface MapMarkersLayerProps {
  map: maplibregl.Map;
  ppsData: PPS[];
}

export default function MapMarkersLayer({ map, ppsData }: MapMarkersLayerProps) {
  useEffect(() => {
    if (!map) return;

    try {
      const features = ppsData.map(alert => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(alert.longi), parseFloat(alert.latti)]
        },
        properties: {
          title: alert.name,
          daerah: alert.daerah,
          mangsa: alert.mangsa,
          kapasiti: alert.kapasiti,
          disasterLabel: getShelterDisasterPresentation(alert).label,
          latti: alert.latti,
          longi: alert.longi
        }
      }));

      // If source exists, update data
      const source = map.getSource('pps-data') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: features as any
        });
      } else {
        map.addSource('pps-data', {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": features as any
          }
        });
      }

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
          map.triggerRepaint();

          return true;
        }
      };

      if (!map.hasImage('pulsing-dot')) {
        map.addImage('pulsing-dot', pulsingDot as any, { pixelRatio: 2 });
      }

      if (!map.getLayer('pps-layer')) {
        map.addLayer({
          'id': 'pps-layer',
          'type': 'symbol',
          'source': 'pps-data',
          'layout': {
            'icon-image': 'pulsing-dot',
            'icon-allow-overlap': true
          }
        });
      }
      // if (map.isStyleLoaded()) {
      //   setupMap();
      // } else {
      //   map.once('style.load', setupMap);
      // }


      // Create a popup
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 25
      });

      const buildPopupHTML = (props: any) => `
        <div class="p-1 flex flex-col gap-2 min-w-[220px]">
          <div>
            <h3 class="font-bold text-slate-900 text-sm leading-tight">${props?.title}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${props?.daerah}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs mt-1">
            <div class="flex flex-col bg-slate-100 p-1.5 rounded border border-slate-200">
              <span class="text-slate-500 text-[10px] uppercase tracking-wider">Victims</span>
              <span class="font-bold text-slate-900">${props?.mangsa}</span>
            </div>
            <div class="flex flex-col bg-slate-100 p-1.5 rounded border border-slate-200">
              <span class="text-slate-500 text-[10px] uppercase tracking-wider">Capacity</span>
              <span class="font-bold text-slate-900">${props?.kapasiti}</span>
            </div>
          </div>
          
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[10px] font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200">
              ${props?.disasterLabel}
            </span>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${props?.latti},${props?.longi}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[10px] font-medium bg-slate-900 text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              Directions
            </a>
          </div>
        </div>
      `;

      const onMouseEnter = (e: any) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const description = buildPopupHTML(e.features[0].properties);

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates as [number, number])
          .setHTML(description)
          .addTo(map);
      };

      const onMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      const onClick = (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const coordinates = (e.features[0].geometry as any).coordinates.slice();
        const description = buildPopupHTML(e.features[0].properties);

        popup.setLngLat(coordinates as [number, number])
          .setHTML(description)
          .addTo(map);
      };

      map.on('mouseenter', 'pps-layer', onMouseEnter);
      map.on('mouseleave', 'pps-layer', onMouseLeave);
      map.on('click', 'pps-layer', onClick);

      return () => {
        map.off('mouseenter', 'pps-layer', onMouseEnter);
        map.off('mouseleave', 'pps-layer', onMouseLeave);
        map.off('click', 'pps-layer', onClick);
      };

    } catch (err) {
      console.error("PPS data layer error:", err);
    }
  }, [map, ppsData]);

  return null;
}
