import type { Metadata } from "next";
import OfflineEmergencyHub from "@/components/pwa/OfflineEmergencyHub";

export const metadata: Metadata = {
  title: "Offline Emergency Hub | Emergency OS",
  description: "Public cached emergency information for offline use.",
};

export default function OfflinePage() {
  return <OfflineEmergencyHub />;
}
