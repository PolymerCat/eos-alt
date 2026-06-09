import { createClient } from "@/utils/supabase/server";
import { getWeatherForecasts } from "@/app/actions";
import { getUserLocations } from "@/app/profile/actions";
import type {
  AlertPreference,
  EmergencyContact,
  EmergencyDataSnapshot,
  NotificationRecord,
  SavedLocation,
  SosRequest,
  WeatherAlert,
} from "@/types/emergency";
import type { PPS } from "@/app/actions";

// ── Supabase row types ─────────────────────────────────────────

type JoinedUserLocation = {
  id: number;
  latitude: number;
  longitude: number;
  state?: number | null;
  district?: number | null;
  label?: string | null;
  description?: string | null;
  created_at?: string | null;
  states?: { state_name?: string } | Array<{ state_name?: string }> | null;
  districts?: { district?: string } | Array<{ district?: string }> | null;
};

type ShelterSnapshotRow = {
  shelter_id: string;
  disaster_type: string | null;
  capacity: string | null;
  victims: string | null;
  families: string | null;
  captured_at: string;
  shelters: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    mukim: string | null;
    disaster_type: string | null;
  } | {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    state: string;
    district: string;
    mukim: string | null;
    disaster_type: string | null;
  }[] | null;
};

type ShelterRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  district: string;
  mukim: string | null;
  disaster_type: string | null;
};

type WeatherAlertRow = {
  id: string;
  source: string;
  title: string;
  title_bm: string | null;
  description: string | null;
  description_bm: string | null;
  severity: string | null;
  affected_area: string | null;
  valid_from: string | null;
  valid_to: string | null;
  issued_at: string;
};

type AlertPrefRow = {
  id: string;
  user_id: string;
  alert_type: string;
  is_enabled: boolean;
  delivery_methods: string[] | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  weather_alert_id: string | null;
  title: string;
  message: string;
  delivery_method: string;
  status: string;
  created_at: string;
};

type SosRow = {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  message: string;
  status: string;
  created_at: string;
};

type ContactRow = {
  id: string;
  name: string;
  role: string | null;
  phone_number: string;
  delivery_method: string | null;
  is_primary: boolean;
};

// ── Mappers ───────────────────────────────────────────────────

function firstRelationValue<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function mapUserLocations(rows: JoinedUserLocation[]): SavedLocation[] {
  return rows.map((row) => {
    const state = firstRelationValue(row.states);
    const district = firstRelationValue(row.districts);
    return {
      id: row.id,
      userId: "current-user",
      stateCode: row.state ?? 0,
      stateName: state?.state_name ?? "Unknown state",
      districtId: row.district ?? 0,
      districtName: district?.district ?? "Unknown district",
      label: row.label ?? district?.district ?? "Saved Location",
      description: row.description ?? undefined,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.created_at ?? new Date().toISOString(),
    };
  });
}

function mapSnapshotToShelter(row: ShelterSnapshotRow): PPS | null {
  const s = Array.isArray(row.shelters) ? row.shelters[0] : row.shelters;
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    latti: String(s.latitude),
    longi: String(s.longitude),
    negeri: s.state,
    daerah: s.district,
    mukim: s.mukim ?? "",
    bencana: row.disaster_type ?? s.disaster_type ?? "",
    disasterType: row.disaster_type ?? s.disaster_type ?? null,
    mangsa: row.victims ?? "0",
    keluarga: row.families ?? "0",
    kapasiti: row.capacity ?? "0.00%",
    status: "online",
    operationalStatus: "active",
    lastUpdatedAt: row.captured_at,
  };
}

function mapShelterRowToOfflineShelter(row: ShelterRow): PPS {
  return {
    id: row.id,
    name: row.name,
    latti: String(row.latitude),
    longi: String(row.longitude),
    negeri: row.state,
    daerah: row.district,
    mukim: row.mukim ?? "",
    // A permanent shelter row may retain a legacy disaster value. Inactive
    // shelters must not present that historical emergency as current.
    bencana: "",
    disasterType: null,
    mangsa: "0",
    keluarga: "0",
    kapasiti: "0.00%",
    status: "offline",
    operationalStatus: "inactive",
  };
}

function mapWeatherAlert(row: WeatherAlertRow): WeatherAlert {
  return {
    id: row.id,
    source: (row.source as WeatherAlert["source"]) ?? "METMalaysia",
    title: row.title,
    titleBm: row.title_bm ?? undefined,
    description: row.description ?? "",
    descriptionBm: row.description_bm ?? undefined,
    severity: (row.severity as WeatherAlert["severity"]) ?? "advisory",
    affectedArea: row.affected_area ?? "",
    issuedAt: row.issued_at,
    validFrom: row.valid_from ?? undefined,
    validTo: row.valid_to ?? undefined,
  };
}

function mapAlertPreference(row: AlertPrefRow, userId: string): AlertPreference {
  return {
    id: row.id,
    userId,
    alertType: row.alert_type as AlertPreference["alertType"],
    isEnabled: row.is_enabled,
    deliveryMethods: (row.delivery_methods ?? ["in_app"]) as AlertPreference["deliveryMethods"],
  };
}

function mapNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    weatherAlertId: row.weather_alert_id ?? undefined,
    title: row.title,
    message: row.message,
    deliveryMethod: row.delivery_method as NotificationRecord["deliveryMethod"],
    status: row.status as NotificationRecord["status"],
    createdAt: row.created_at,
  };
}

function mapSosRequest(row: SosRow): SosRequest {
  return {
    id: row.id,
    userId: row.user_id,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    message: row.message,
    status: row.status as SosRequest["status"],
    createdAt: row.created_at,
  };
}

function mapContactDeliveryMethod(value: string | null): EmergencyContact["deliveryMethod"] {
  if (value === "Email" || value === "email") return "Email";
  if (value === "SMS" || value === "sms") return "SMS";
  return "App Notification";
}

function mapContact(row: ContactRow): EmergencyContact {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? "",
    phoneNumber: row.phone_number,
    deliveryMethod: mapContactDeliveryMethod(row.delivery_method),
    isPrimary: row.is_primary,
  };
}

// ── Main provider ─────────────────────────────────────────────

export async function getLiveEmergencyData(): Promise<EmergencyDataSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Parallel queries ────────────────────────────────────────
  const [
    shelterResult,
    snapshotResult,
    weatherAlertResult,
    weatherForecasts,
    userLocations,
    alertPrefResult,
    notificationResult,
    sosResult,
    contactResult,
  ] = await Promise.all([
    // All saved shelters remain visible; active JKM snapshots mark which are online.
    supabase
      .from("shelters")
      .select("id, name, latitude, longitude, state, district, mukim, disaster_type")
      .order("name")
      .limit(1000),

    // Latest snapshot per shelter (DISTINCT ON via order + group workaround)
    supabase
      .from("shelter_snapshots")
      .select(`
        shelter_id,
        disaster_type,
        capacity,
        victims,
        families,
        captured_at,
        shelters (
          id, name, latitude, longitude,
          state, district, mukim, disaster_type
        )
      `)
      .eq("status", "active")
      .order("captured_at", { ascending: false })
      .limit(300),

    // Active weather alerts (not yet expired)
    supabase
      .from("weather_alerts")
      .select("id, source, title, title_bm, description, description_bm, severity, affected_area, valid_from, valid_to, issued_at")
      .or("valid_to.is.null,valid_to.gte." + new Date().toISOString())
      .order("issued_at", { ascending: false })
      .limit(50),

    // Weather forecasts from live API
    getWeatherForecasts(),

    // User locations (Supabase)
    user ? (getUserLocations() as Promise<JoinedUserLocation[]>) : Promise.resolve([] as JoinedUserLocation[]),

    // Alert preferences for current user
    user
      ? supabase.from("alert_preferences").select("*").eq("user_id", user.id)
      : Promise.resolve({ data: [], error: null }),

    // Recent notifications for current user (last 50)
    user
      ? supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [], error: null }),

    // SOS requests for current user
    user
      ? supabase.from("sos_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      : Promise.resolve({ data: [], error: null }),

    // Emergency contacts for current user
    user
      ? supabase.from("emergency_contacts").select("*").eq("user_id", user.id).order("is_primary", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  // ── Deduplicate shelters (latest snapshot per shelter_id) ────
  const seenShelterIds = new Set<string>();
  const sheltersById = new Map<string, PPS>();
  for (const row of (shelterResult.data ?? []) as ShelterRow[]) {
    sheltersById.set(row.id, mapShelterRowToOfflineShelter(row));
  }

  for (const row of (snapshotResult.data ?? []) as ShelterSnapshotRow[]) {
    if (seenShelterIds.has(row.shelter_id)) continue;
    seenShelterIds.add(row.shelter_id);
    const mapped = mapSnapshotToShelter(row);
    if (mapped) sheltersById.set(mapped.id, mapped);
  }
  const shelters: PPS[] = Array.from(sheltersById.values());

  const weatherAlerts: WeatherAlert[] = (weatherAlertResult.data ?? []).map(
    (row) => mapWeatherAlert(row as WeatherAlertRow),
  );

  const savedLocations = mapUserLocations(userLocations);

  const alertPreferences: AlertPreference[] = user
    ? ((alertPrefResult as { data: AlertPrefRow[] | null }).data ?? []).map(
        (row) => mapAlertPreference(row, user.id),
      )
    : [];

  const notifications: NotificationRecord[] = user
    ? ((notificationResult as { data: NotificationRow[] | null }).data ?? []).map(mapNotification)
    : [];

  const sosRequests: SosRequest[] = user
    ? ((sosResult as { data: SosRow[] | null }).data ?? []).map(mapSosRequest)
    : [];

  const emergencyContacts: EmergencyContact[] = user
    ? ((contactResult as { data: ContactRow[] | null }).data ?? []).map(mapContact)
    : [];

  // ── Data source statuses ─────────────────────────────────────
  const shelterStatus = shelterResult.error || snapshotResult.error
    ? "degraded"
    : shelters.length > 0
      ? "online"
      : "degraded";

  const weatherStatus = weatherAlertResult.error
    ? "degraded"
    : weatherAlerts.length > 0
      ? "online"
      : "degraded";

  return {
    mode: "live",
    shelters,
    weatherForecasts,
    weatherAlerts,
    savedLocations,
    alertPreferences,
    notifications,
    sosRequests,
    emergencyContacts,
    governmentNotices: [],
    reports: [],
    dataSources: [
      {
        id: "live-jkm",
        name: "JKM Shelter Database",
        type: "database",
        status: shelterStatus,
        lastCheckedAt: new Date().toISOString(),
        notes:
          shelterStatus === "online"
            ? `${seenShelterIds.size} online shelter(s), ${shelters.length - seenShelterIds.size} offline saved shelter(s).`
            : shelterResult.error
              ? `DB error: ${shelterResult.error.message}`
              : snapshotResult.error
              ? `DB error: ${snapshotResult.error.message}`
              : "No active shelters in database. Click Refresh to sync latest data.",
      },
      {
        id: "live-metmalaysia",
        name: "METMalaysia Weather Alert Database",
        type: "database",
        status: weatherStatus,
        lastCheckedAt: new Date().toISOString(),
        notes:
          weatherStatus === "online"
            ? `${weatherAlerts.length} active weather alert(s) from latest sync.`
            : weatherAlertResult.error
              ? `DB error: ${weatherAlertResult.error.message}`
              : "No active alerts in database. Click Refresh to sync latest data.",
      },
      {
        id: "live-supabase-user",
        name: "Supabase User Data",
        type: "database",
        status: "online",
        lastCheckedAt: new Date().toISOString(),
        notes: user
          ? `Loaded profile data for authenticated user.`
          : "No authenticated user. User-specific data not loaded.",
      },
    ],
  };
}
