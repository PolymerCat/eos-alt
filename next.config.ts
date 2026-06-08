import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheStartUrl: false,
  reloadOnOnline: false,
  fallbacks: {
    document: "/offline",
  },
  // Large map/weather assets are cached only after use, not during install.
  publicExcludes: [
    "!malaysia-states.geojson",
    "!MY-box.geojson",
    "!newfilter.geojson",
    "!weather-icons/**/*",
  ],
  workboxOptions: {
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        // Standard pages remain network-first. If navigation fails completely,
        // Workbox serves the precached /offline document fallback.
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkOnly",
      },
      {
        // Public static emergency assets are safe to retain after first use.
        urlPattern: /\/(?:malaysia-states|MY-box|newfilter)\.geojson$/,
        handler: "CacheFirst",
        options: {
          cacheName: "emergency-os-map-boundaries",
          expiration: {
            maxEntries: 3,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\/weather-icons\/.*$/,
        handler: "CacheFirst",
        options: {
          cacheName: "emergency-os-weather-icons",
          expiration: {
            maxEntries: 80,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        // Never cache authenticated Supabase/API traffic in the service worker.
        // Public emergency snapshot caching is handled explicitly in IndexedDB.
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https:\/\/(?:api\.data\.gov\.my|infobencanajkmv2\.jkm\.gov\.my|www\.met\.gov\.my)\/.*$/,
        handler: "NetworkOnly",
      },
      {
        // Offline maps are intentionally omitted from this deployment scope.
        urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*$/,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withPWA(nextConfig);
