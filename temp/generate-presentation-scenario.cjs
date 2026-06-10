const XLSX = require("xlsx");
const path = require("path");

const OUTPUT_FILE = path.join(
  __dirname,
  "emergency-os-presentation-scenario.xlsx"
);

const regions = [
  {
    state: "KELANTAN",
    disaster: "BANJIR",
    alertTitle: "Continuous Heavy Rain Warning",
    alertTitleBm: "Amaran Hujan Berterusan",
    districts: [
      ["TUMPAT", 6.1978, 102.1706],
      ["PASIR MAS", 6.0424, 102.1398],
      ["KOTA BHARU", 6.1254, 102.2381],
      ["KUALA KRAI", 5.5313, 102.2018],
      ["TANAH MERAH", 5.8110, 102.1470],
    ],
  },
  {
    state: "TERENGGANU",
    disaster: "BANJIR",
    alertTitle: "Severe Monsoon Rain Warning",
    alertTitleBm: "Amaran Hujan Monsun Buruk",
    districts: [
      ["BESUT", 5.8314, 102.5591],
      ["SETIU", 5.5345, 102.7450],
      ["KUALA NERUS", 5.3811, 103.0918],
      ["DUNGUN", 4.7567, 103.3990],
      ["KEMAMAN", 4.2323, 103.4177],
    ],
  },
  {
    state: "PAHANG",
    disaster: "TANAH RUNTUH",
    alertTitle: "Slope Failure and Heavy Rain Alert",
    alertTitleBm: "Amaran Kegagalan Cerun dan Hujan Lebat",
    districts: [
      ["CAMERON HIGHLANDS", 4.4721, 101.3760],
      ["RAUB", 3.7899, 101.8572],
      ["TEMERLOH", 3.4486, 102.4176],
      ["KUANTAN", 3.8077, 103.3260],
      ["JERANTUT", 3.9360, 102.3620],
    ],
  },
  {
    state: "JOHOR",
    disaster: "BANJIR",
    alertTitle: "River Flood Risk Warning",
    alertTitleBm: "Amaran Risiko Banjir Sungai",
    districts: [
      ["SEGAMAT", 2.5148, 102.8158],
      ["KLUANG", 2.0251, 103.3328],
      ["KOTA TINGGI", 1.7381, 103.8999],
      ["MERSING", 2.4312, 103.8405],
      ["BATU PAHAT", 1.8548, 102.9325],
    ],
  },
  {
    state: "PERAK",
    disaster: "RIBUT",
    alertTitle: "Severe Thunderstorm Warning",
    alertTitleBm: "Amaran Ribut Petir Buruk",
    districts: [
      ["KINTA", 4.5975, 101.0901],
      ["MANJUNG", 4.1860, 100.6630],
      ["HILIR PERAK", 4.0224, 101.0206],
      ["KUALA KANGSAR", 4.7735, 100.9420],
      ["LARUT MATANG SELAMA", 4.8500, 100.7400],
    ],
  },
  {
    state: "PULAU PINANG",
    disaster: "RIBUT",
    alertTitle: "Coastal Storm and Flash Flood Alert",
    alertTitleBm: "Amaran Ribut Pantai dan Banjir Kilat",
    districts: [
      ["TIMUR LAUT", 5.4141, 100.3288],
      ["BARAT DAYA", 5.3260, 100.2330],
      ["SEBERANG PERAI UTARA", 5.4700, 100.4400],
      ["SEBERANG PERAI TENGAH", 5.3600, 100.4100],
      ["SEBERANG PERAI SELATAN", 5.1800, 100.4900],
    ],
  },
  {
    state: "SABAH",
    disaster: "GEMPA BUMI",
    alertTitle: "Earthquake Readiness Advisory",
    alertTitleBm: "Nasihat Kesiapsiagaan Gempa Bumi",
    districts: [
      ["RANAU", 5.9536, 116.6641],
      ["KOTA BELUD", 6.3510, 116.4300],
      ["TUARAN", 6.1760, 116.2330],
      ["KOTA KINABALU", 5.9804, 116.0735],
      ["PAPAR", 5.7330, 115.9330],
    ],
  },
  {
    state: "SARAWAK",
    disaster: "KEBAKARAN",
    alertTitle: "Peat Fire and Haze Warning",
    alertTitleBm: "Amaran Kebakaran Tanah Gambut dan Jerebu",
    districts: [
      ["KUCHING", 1.5533, 110.3592],
      ["SAMARAHAN", 1.4590, 110.4980],
      ["SRI AMAN", 1.2370, 111.4620],
      ["SIBU", 2.2873, 111.8305],
      ["MIRI", 4.3995, 113.9914],
    ],
  },
];

const shelterKinds = [
  "Sekolah Kebangsaan",
  "Dewan Komuniti",
  "Kompleks Sukan",
  "Sekolah Menengah Kebangsaan",
  "Balai Raya",
];

const forecastIcons = [
  "hujan_lebat",
  "ribut_petir",
  "hujan",
  "berawan",
  "cerah",
];

const shelterHeaders = [
  "id",
  "name",
  "latti",
  "longi",
  "negeri",
  "daerah",
  "mukim",
  "bencana",
  "disasterType",
  "status",
  "operationalStatus",
  "mangsa",
  "keluarga",
  "kapasiti",
  "lastUpdatedAt",
];

const weatherAlertHeaders = [
  "id",
  "source",
  "title",
  "titleBm",
  "description",
  "descriptionBm",
  "severity",
  "affectedArea",
  "issuedAt",
  "validFrom",
  "validTo",
];

const forecastHeaders = [
  "code",
  "station",
  "timestamp",
  "temp",
  "state",
  "rainfall",
  "icon",
];

const timelineHeaders = [
  "id",
  "eventType",
  "occurredAt",
  "endedAt",
  "shelterId",
  "weatherAlertId",
  "disasterType",
  "state",
  "district",
  "title",
  "description",
  "source",
  "metadata",
];

function iso(day, hour, minute = 0) {
  return `2026-06-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`;
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function makeShelters() {
  const shelters = [];
  let sequence = 1;

  regions.forEach((region, regionIndex) => {
    region.districts.forEach(([district, latitude, longitude], districtIndex) => {
      const inactive = districtIndex === 4;
      const highOccupancy = districtIndex === 1 || districtIndex === 3;
      const victims = inactive ? 0 : 74 + regionIndex * 31 + districtIndex * 68;
      const families = inactive ? 0 : Math.max(18, Math.round(victims / 3.5));
      const capacity = inactive
        ? "0.00%"
        : `${highOccupancy ? 82 + regionIndex : 42 + regionIndex * 3 + districtIndex * 6}.00%`;

      shelters.push({
        id: `PRES-PPS-${String(sequence).padStart(3, "0")}`,
        name: `${shelterKinds[districtIndex]} ${titleCase(district)}`,
        latti: (latitude + districtIndex * 0.006).toFixed(6),
        longi: (longitude - districtIndex * 0.005).toFixed(6),
        negeri: region.state,
        daerah: district,
        mukim: titleCase(district),
        bencana: inactive ? "" : region.disaster,
        disasterType: inactive ? "" : region.disaster,
        status: inactive ? "offline" : "online",
        operationalStatus: inactive ? "inactive" : "active",
        mangsa: String(victims),
        keluarga: String(families),
        kapasiti: capacity,
        lastUpdatedAt: iso(11, 15, regionIndex * 5 + districtIndex),
      });
      sequence += 1;
    });
  });

  return shelters;
}

function makeAlerts() {
  const alerts = [];

  regions.forEach((region, index) => {
    const affectedArea = region.districts.map(([district]) => district).join(", ");
    const critical = index < 4;

    alerts.push({
      id: `PRES-ALERT-${String(index * 2 + 1).padStart(3, "0")}`,
      source: index % 3 === 0 ? "NADMA" : "METMalaysia",
      title: region.alertTitle,
      titleBm: region.alertTitleBm,
      description: `Emergency conditions are affecting ${affectedArea}. Residents should monitor official instructions and prepare for evacuation.`,
      descriptionBm: `Keadaan kecemasan menjejaskan ${affectedArea}. Penduduk perlu memantau arahan rasmi dan bersedia untuk berpindah.`,
      severity: critical ? "critical" : "warning",
      affectedArea,
      issuedAt: iso(5 + (index % 3), 7 + index),
      validFrom: iso(5 + (index % 3), 8 + index),
      validTo: index < 4 ? iso(11, 8 + index * 2) : iso(13 + (index % 2), 18),
    });

    alerts.push({
      id: `PRES-ALERT-${String(index * 2 + 2).padStart(3, "0")}`,
      source: "simulation",
      title: `${titleCase(region.state)} Emergency Preparedness Advisory`,
      titleBm: `Nasihat Kesiapsiagaan Kecemasan ${titleCase(region.state)}`,
      description: `District operation rooms in ${region.state} have raised readiness levels and activated community response teams.`,
      descriptionBm: `Bilik gerakan daerah di ${region.state} telah meningkatkan tahap kesiapsiagaan dan mengaktifkan pasukan tindak balas komuniti.`,
      severity: index % 2 === 0 ? "watch" : "advisory",
      affectedArea,
      issuedAt: iso(6 + (index % 2), 10 + index),
      validFrom: iso(6 + (index % 2), 10 + index),
      validTo: index < 4 ? iso(11, 9 + index * 2) : iso(12, 20),
    });
  });

  return alerts;
}

function makeForecasts() {
  const forecasts = [];

  regions.forEach((region, regionIndex) => {
    region.districts.slice(0, 3).forEach(([district], districtIndex) => {
      const icon = forecastIcons[(regionIndex + districtIndex) % forecastIcons.length];
      forecasts.push({
        code: `PRES-FC-${String(regionIndex * 3 + districtIndex + 1).padStart(3, "0")}`,
        station: titleCase(district),
        timestamp: "03:00 PM",
        temp: `${25 + ((regionIndex + districtIndex) % 7)} C`,
        state: titleCase(region.state),
        rainfall: JSON.stringify({
          "09:00 AM": forecastIcons[(regionIndex + districtIndex + 3) % forecastIcons.length],
          "12:00 PM": forecastIcons[(regionIndex + districtIndex + 1) % forecastIcons.length],
          "03:00 PM": icon,
          "06:00 PM": forecastIcons[(regionIndex + districtIndex + 2) % forecastIcons.length],
        }),
        icon,
      });
    });
  });

  return forecasts;
}

function makeTimelineEvents(shelters, alerts) {
  const events = [];
  let sequence = 1;

  alerts.forEach((alert, index) => {
    const region = regions[Math.floor(index / 2)];
    events.push({
      id: `PRES-EVENT-${String(sequence++).padStart(3, "0")}`,
      eventType: "weather_alert_issued",
      occurredAt: alert.issuedAt,
      endedAt: "",
      shelterId: "",
      weatherAlertId: alert.id,
      disasterType: region.disaster,
      state: region.state,
      district: "",
      title: `${alert.title} issued`,
      description: alert.description,
      source: "simulation",
      metadata: JSON.stringify({
        severity: alert.severity,
        affectedArea: alert.affectedArea,
      }),
    });
  });

  shelters.forEach((shelter, index) => {
    const regionIndex = Math.floor(index / 5);
    const districtIndex = index % 5;
    const openedDay = 5 + ((regionIndex + districtIndex) % 4);
    const openedHour = 8 + ((regionIndex * 2 + districtIndex) % 10);

    events.push({
      id: `PRES-EVENT-${String(sequence++).padStart(3, "0")}`,
      eventType: "shelter_opened",
      occurredAt: iso(openedDay, openedHour, districtIndex * 7),
      endedAt: "",
      shelterId: shelter.id,
      weatherAlertId: "",
      disasterType: shelter.operationalStatus === "inactive"
        ? regions[regionIndex].disaster
        : shelter.disasterType,
      state: shelter.negeri,
      district: shelter.daerah,
      title: `${shelter.name} opened`,
      description: `Temporary evacuation shelter activated in ${shelter.daerah} for ${regions[regionIndex].disaster}.`,
      source: "simulation",
      metadata: JSON.stringify({
        victimsAtOpening: Math.max(12, Number(shelter.mangsa) - 45),
        capacityAtOpening: shelter.operationalStatus === "inactive" ? "21.00%" : shelter.kapasiti,
      }),
    });

    if (shelter.operationalStatus === "inactive") {
      events.push({
        id: `PRES-EVENT-${String(sequence++).padStart(3, "0")}`,
        eventType: "shelter_closed",
        occurredAt: iso(10, 9 + regionIndex, districtIndex * 3),
        endedAt: "",
        shelterId: shelter.id,
        weatherAlertId: "",
        disasterType: regions[regionIndex].disaster,
        state: shelter.negeri,
        district: shelter.daerah,
        title: `${shelter.name} closed`,
        description: "Evacuees returned home after local conditions stabilized.",
        source: "simulation",
        metadata: JSON.stringify({
          finalVictims: 0,
          closureReason: "Local conditions stabilized",
        }),
      });
    } else if (districtIndex === 1 || districtIndex === 3) {
      events.push({
        id: `PRES-EVENT-${String(sequence++).padStart(3, "0")}`,
        eventType: "shelter_capacity_changed",
        occurredAt: iso(10, 11 + regionIndex, districtIndex * 4),
        endedAt: "",
        shelterId: shelter.id,
        weatherAlertId: "",
        disasterType: shelter.disasterType,
        state: shelter.negeri,
        district: shelter.daerah,
        title: `${shelter.name} occupancy increased`,
        description: `Shelter occupancy rose to ${shelter.kapasiti} as additional evacuees arrived.`,
        source: "simulation",
        metadata: JSON.stringify({
          previousCapacity: districtIndex === 1 ? "61.00%" : "68.00%",
          newCapacity: shelter.kapasiti,
          victims: shelter.mangsa,
        }),
      });
    }
  });

  alerts.slice(0, 8).forEach((alert, index) => {
    const region = regions[Math.floor(index / 2)];
    events.push({
      id: `PRES-EVENT-${String(sequence++).padStart(3, "0")}`,
      eventType: "weather_alert_expired",
      occurredAt: alert.validTo,
      endedAt: alert.validTo,
      shelterId: "",
      weatherAlertId: alert.id,
      disasterType: region.disaster,
      state: region.state,
      district: "",
      title: `${alert.title} expired`,
      description: "The warning period ended after the scheduled reassessment.",
      source: "simulation",
      metadata: JSON.stringify({
        severity: alert.severity,
        status: "expired",
      }),
    });
  });

  return events.sort(
    (left, right) => new Date(left.occurredAt) - new Date(right.occurredAt)
  );
}

function rows(records, headers) {
  return records.map((record) => headers.map((header) => record[header] ?? ""));
}

function styleSheet(sheet, headers, widths) {
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  sheet["!cols"] = headers.map((header) => ({
    wch: widths[header] || Math.max(14, header.length + 2),
  }));
}

function appendSheet(workbook, name, headers, records, widths = {}) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows(records, headers)]);
  styleSheet(sheet, headers, widths);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

const shelters = makeShelters();
const alerts = makeAlerts();
const forecasts = makeForecasts();
const timelineEvents = makeTimelineEvents(shelters, alerts);

const guideRows = [
  ["Scenario", "Nationwide Multi-Hazard Emergency Response Exercise"],
  ["Presentation period", "5 June 2026 to 11 June 2026"],
  ["Shelters", shelters.length],
  ["Active shelters", shelters.filter((item) => item.operationalStatus === "active").length],
  ["Closed shelters", shelters.filter((item) => item.operationalStatus === "inactive").length],
  ["Weather alerts", alerts.length],
  ["Forecast stations", forecasts.length],
  ["Timeline events", timelineEvents.length],
  ["States represented", regions.map((region) => region.state).join(", ")],
  ["Upload instructions", "Open /simulation, enter a scenario name, select this workbook, then choose Upload & Activate."],
  ["Suggested scenario name", "Nationwide Multi-Hazard Presentation Exercise"],
  ["Suggested presentation flow", "Dashboard -> Shelters -> Map -> Alerts -> Timeline"],
  ["Data note", "All records are fictional and intended only for system demonstration."],
];

const workbook = XLSX.utils.book_new();
const guide = XLSX.utils.aoa_to_sheet([["Field", "Value"], ...guideRows]);
guide["!cols"] = [{ wch: 28 }, { wch: 120 }];
guide["!freeze"] = { xSplit: 0, ySplit: 1 };
XLSX.utils.book_append_sheet(workbook, guide, "ScenarioGuide");

appendSheet(workbook, "Shelters", shelterHeaders, shelters, {
  name: 42,
  negeri: 22,
  daerah: 28,
  mukim: 28,
  lastUpdatedAt: 28,
});
appendSheet(workbook, "WeatherAlerts", weatherAlertHeaders, alerts, {
  title: 42,
  titleBm: 46,
  description: 95,
  descriptionBm: 95,
  affectedArea: 95,
  issuedAt: 28,
  validFrom: 28,
  validTo: 28,
});
appendSheet(workbook, "Forecasts", forecastHeaders, forecasts, {
  station: 30,
  state: 24,
  rainfall: 100,
});
appendSheet(workbook, "TimelineEvents", timelineHeaders, timelineEvents, {
  occurredAt: 28,
  endedAt: 28,
  title: 55,
  description: 95,
  state: 22,
  district: 28,
  metadata: 90,
});

XLSX.writeFile(workbook, OUTPUT_FILE);

console.log(JSON.stringify({
  output: OUTPUT_FILE,
  shelters: shelters.length,
  activeShelters: shelters.filter((item) => item.operationalStatus === "active").length,
  alerts: alerts.length,
  forecasts: forecasts.length,
  timelineEvents: timelineEvents.length,
}, null, 2));
