import type { EmergencyScenario } from "@/types/emergency";

const now = "2026-05-24T10:30:00+08:00";

export const simulationScenarios: EmergencyScenario[] = [
  {
    id: "kelantan-severe-flood",
    name: "Severe Flood - Kelantan",
    description:
      "A high-pressure scenario with active shelters, critical capacity, matched alerts, and SOS readiness.",
    shelters: [
      {
        id: "sim-pps-001",
        name: "SK Sri Wakaf Bharu",
        latti: "6.118300",
        longi: "102.198900",
        negeri: "KELANTAN",
        daerah: "TUMPAT",
        mukim: "WAKAF BHARU",
        bencana: "BANJIR",
        mangsa: "248",
        keluarga: "67",
        kapasiti: "82.00%",
      },
      {
        id: "sim-pps-002",
        name: "Dewan Orang Ramai Pasir Mas",
        latti: "6.049700",
        longi: "102.139200",
        negeri: "KELANTAN",
        daerah: "PASIR MAS",
        mukim: "PASIR MAS",
        bencana: "BANJIR",
        mangsa: "394",
        keluarga: "108",
        kapasiti: "94.00%",
      },
      {
        id: "sim-pps-003",
        name: "SMK Kota Bharu",
        latti: "6.125400",
        longi: "102.238100",
        negeri: "KELANTAN",
        daerah: "KOTA BHARU",
        mukim: "BANDAR",
        bencana: "BANJIR",
        mangsa: "121",
        keluarga: "34",
        kapasiti: "46.00%",
      },
    ],
    weatherWarnings: [
      {
        warning_issue: {
          title_bm: "Amaran Hujan Berterusan Bahaya",
          title_en: "Danger Continuous Rain Warning",
        },
        valid_from: "2026-05-24T08:00:00+08:00",
        valid_to: "2026-05-25T18:00:00+08:00",
        text_bm:
          "Hujan sangat lebat berterusan dijangka berlaku di Kelantan melibatkan Tumpat, Pasir Mas dan Kota Bharu.",
        text_en:
          "Continuous very heavy rain is expected in Kelantan involving Tumpat, Pasir Mas and Kota Bharu.",
        heading_bm: "Amaran Cuaca",
        heading_en: "Weather Warning",
      },
    ],
    weatherAlerts: [
      {
        id: "wa-sim-001",
        source: "METMalaysia",
        title: "Continuous Heavy Rain Warning",
        description:
          "High-risk rainfall pattern detected for selected districts in Kelantan.",
        severity: "critical",
        affectedArea: "Tumpat, Pasir Mas, Kota Bharu",
        issuedAt: now,
        validFrom: "2026-05-24T08:00:00+08:00",
        validTo: "2026-05-25T18:00:00+08:00",
      },
      {
        id: "wa-sim-002",
        source: "METMalaysia",
        title: "Intense Heat",
        description:
          "High intenisity heat signature detected for selected districts in Pulau Pinang.",
        severity: "critical",
        affectedArea: "Tasek Gelugor, Kepala Batas, Seberang Perai Utara",
        issuedAt: now,
        validFrom: "2026-05-24T08:00:00+08:00",
        validTo: "2026-05-25T18:00:00+08:00",
      },

    ],
    savedLocations: [
      {
        id: 1,
        userId: "simulation-user",
        stateCode: 3,
        stateName: "Kelantan",
        districtId: 11,
        districtName: "Tumpat",
        label: "Family Home",
        description: "Primary watched location for flood alerts.",
        latitude: 6.125,
        longitude: 102.19,
        createdAt: "2026-05-01T09:00:00+08:00",
      },
    ],
    alertPreferences: [
      {
        id: "pref-sim-001",
        userId: "simulation-user",
        alertType: "weather",
        isEnabled: true,
        deliveryMethods: ["App Notification", "whatsapp"],
      },
      {
        id: "pref-sim-002",
        userId: "simulation-user",
        alertType: "shelter",
        isEnabled: true,
        deliveryMethods: ["App Notification"],
      },
    ],
    notifications: [
      {
        id: "noti-sim-001",
        userId: "simulation-user",
        weatherAlertId: "wa-sim-001",
        title: "Critical rain warning near Family Home",
        message:
          "Tumpat is inside the affected area. Review nearest shelter options and keep emergency contacts ready.",
        deliveryMethod: "App Notification",
        status: "sent",
        createdAt: now,
      },
      {
        id: "noti-sim-002",
        userId: "simulation-user",
        weatherAlertId: "wa-sim-002",
        title: "Critical rain warning near Abah's House",
        message:
          "Kota Bharu is inside the affected area. Review nearest shelter options and keep emergency contacts ready.",
        deliveryMethod: "App Notification",
        status: "pending",
        createdAt: now,
      },
    ],
    sosRequests: [
      {
        id: "sos-sim-001",
        userId: "simulation-user",
        latitude: 6.125,
        longitude: 102.19,
        message:
          "Simulation SOS: family requires evacuation assistance near Wakaf Bharu.",
        status: "draft",
        contactId: "contact-sim-001",
        createdAt: now,
      },
    ],
    emergencyContacts: [
      {
        id: "contact-sim-001",
        name: "District Operation Room",
        role: "Local emergency coordination",
        phoneNumber: "+6090000001",
        deliveryMethod: "whatsapp",
        isPrimary: true,
      },
      {
        id: "contact-sim-002",
        name: "Family Contact",
        role: "Personal emergency contact",
        phoneNumber: "+60120000001",
        deliveryMethod: "SMS",
        isPrimary: false,
      },
    ],
    governmentNotices: [
      {
        id: "notice-sim-001",
        agency: "NADMA",
        title: "Temporary evacuation advised",
        body:
          "Residents in low-lying areas should prepare documents, medication, and essential supplies.",
        publishedAt: now,
        affectedArea: "Kelantan",
      },
    ],
    reports: [
      {
        id: "report-sim-001",
        title: "Kelantan Flood Situation Brief",
        summary:
          "Three active shelters are open in the simulated Kelantan scenario, with one shelter above 90% capacity.",
        generatedAt: now,
        sections: [
          {
            heading: "Shelter Status",
            body: "Pasir Mas is near capacity. Kota Bharu remains the best candidate for lower occupancy.",
          },
          {
            heading: "Recommended Action",
            body: "Notify saved-location users and show nearest available shelters.",
          },
        ],
      },
    ],
    dataSources: [
      {
        id: "source-sim-001",
        name: "JKM Shelter Feed",
        type: "simulation",
        status: "simulated",
        lastCheckedAt: now,
        notes: "Using scenario shelter records for demo and testing.",
      },
      {
        id: "source-sim-002",
        name: "METMalaysia Weather Warning",
        type: "simulation",
        status: "simulated",
        lastCheckedAt: now,
        notes: "Using simulated weather warning data.",
      },
      {
        id: "source-sim-003",
        name: "Supabase User Locations",
        type: "database",
        status: "online",
        lastCheckedAt: now,
        notes: "Mocked shape follows current user_locations schema.",
      },
    ],
  },
];

export const defaultScenario = simulationScenarios[0];
