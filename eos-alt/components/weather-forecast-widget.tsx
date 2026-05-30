import type { WeatherForecast } from "@/app/actions";

type LocationRelation = { state_name?: string | null; district?: string | null };

export type WeatherForecastLocation = {
  states?: LocationRelation | LocationRelation[] | null;
  districts?: LocationRelation | LocationRelation[] | null;
};

type WeatherForecastWidgetProps = {
  forecasts: WeatherForecast[];
  locations?: WeatherForecastLocation[];
  maxItems?: number;
  variant?: "card" | "overlay";
  className?: string;
};

// Function to map weather Icon to the relative weather forecast
export function getWeatherIcon(condition: string) {
  const text = condition.toLowerCase();

  if (text.includes("sunny")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/clear-day.svg";
  }
  if (text.includes("clear")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/clear-day.svg";
  }

  if (text.includes("fair")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/mostly-clear-day.svg";
  }

  if (text.includes("partly cloudy")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day.svg";
  }

  if (text.includes("cloudy")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/partly-cloudy-day-fog.svg";
  }

  if (text.includes("thunderstorms")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/extreme-thunderstorms-rain.svg";
  }

  if (text.includes("rain")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/rain.svg";
  }

  if (text.includes("light rain")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/drizzle.svg";
  }

  if (text.includes("heavy rain")) {
    return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/extreme-rain.svg";
  }

  return "https://cdn.meteocons.com/3.0.0-next.10/svg/fill/overcast.svg";
}

function firstRelationValue<T extends LocationRelation>(
  relation: T | T[] | null | undefined,
  key: keyof T
): string {
  const value = Array.isArray(relation) ? relation[0]?.[key] : relation?.[key];
  return typeof value === "string" ? value : "";
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^wp\s+/, "wilayah persekutuan ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isSamePlace(left: string, right: string): boolean {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);

  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function weatherTextFromIcon(iconPath: string): string {
  const iconName = iconPath.toLowerCase();

  if (iconName.includes("ribut") || iconName.includes("petir")) return "Thunderstorm";
  if (iconName.includes("hujan")) return "Rain";
  if (iconName.includes("mendung") || iconName.includes("berawan")) return "Cloudy";
  if (iconName.includes("kabus")) return "Fog";
  if (iconName.includes("jerebu")) return "Hazy";
  if (iconName.includes("cerah")) return "Clear";

  return "Weather update";
}

function summarizeRainfall(rainfall: Record<string, string>): string {
  const entries = Object.entries(rainfall);
  if (entries.length === 0) return "No interval data";

  const rainyIntervals = entries.filter(([, icon]) => weatherTextFromIcon(icon) === "Rain");
  if (rainyIntervals.length === 0) return "No rain expected in the shown intervals";
  if (rainyIntervals.length === entries.length) return "Rain across all shown intervals";

  const firstRainTime = rainyIntervals[0]?.[0];
  return firstRainTime ? `Rain possible from ${firstRainTime}` : "Rain possible";
}

function getMatchedForecasts(
  forecasts: WeatherForecast[],
  locations: WeatherForecastLocation[]
): WeatherForecast[] {
  if (locations.length === 0) return [];

  const savedStates = locations
    .map((location) => firstRelationValue(location.states, "state_name"))
    .filter(Boolean);
  const savedDistricts = locations
    .map((location) => firstRelationValue(location.districts, "district"))
    .filter(Boolean);

  return forecasts.filter((forecast) => {
    const stateMatches = savedStates.some((state) => isSamePlace(state, forecast.state));
    const stationMatches = savedDistricts.some((district) => isSamePlace(district, forecast.station));
    return stateMatches || stationMatches;
  });
}

export default function WeatherForecastWidget({
  forecasts,
  locations = [],
  maxItems = 3,
  variant = "card",
  className = "",
}: WeatherForecastWidgetProps) {
  const matchedForecasts = getMatchedForecasts(forecasts, locations).slice(0, maxItems);
  const isOverlay = variant === "overlay";

  return (
    <section
      className={[
        isOverlay
          ? "bg-panel/95 backdrop-blur border border-border rounded-lg shadow-lg p-4"
          : "bg-panel border border-border rounded-xl shadow-sm p-6",
        className,
      ].join(" ")}
    >
      <div className="border-b border-border pb-3">
        <h2 className="text-lg font-bold text-foreground/90">Weather Forecast</h2>
        <p className="text-xs text-foreground/50 mt-1">
          Matched to your saved locations.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="mt-4 bg-background border border-border/50 rounded-lg p-4 text-sm text-foreground/50">
          Save a location in your profile to see local forecast data.
        </div>
      ) : matchedForecasts.length === 0 ? (
        <div className="mt-4 bg-background border border-border/50 rounded-lg p-4 text-sm text-foreground/50">
          No MET Malaysia station forecast matched your saved locations.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {matchedForecasts.map((forecast) => (
            <article
              key={`${forecast.code}-${forecast.station}-${forecast.timestamp}`}
              className="bg-background border border-border/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {forecast.station}
                  </p>
                  <p className="text-xs text-foreground/50">{forecast.state}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">{forecast.temp}</p>
                  <p className="text-xs text-foreground/60">
                    {weatherTextFromIcon(forecast.icon)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-xs text-foreground/50">
                  <span>{summarizeRainfall(forecast.rainfall)}</span>
                  <span className="text-[10px] opacity-75">{forecast.timestamp || "Latest update"}</span>
                </div>
                <div className="shrink-0">
                  <img
                    src={getWeatherIcon(weatherTextFromIcon(forecast.icon))}
                    alt={weatherTextFromIcon(forecast.icon)}
                    width="48"
                    height="48"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
