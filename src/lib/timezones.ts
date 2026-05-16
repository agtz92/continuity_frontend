const FALLBACK_TIMEZONES: readonly string[] = [
  "UTC",
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "Africa/Casablanca", "Africa/Algiers",
  "America/Mexico_City", "America/Monterrey", "America/Cancun",
  "America/Tijuana", "America/Hermosillo", "America/Chihuahua",
  "America/Guatemala", "America/El_Salvador", "America/Tegucigalpa",
  "America/Managua", "America/Costa_Rica", "America/Panama",
  "America/Bogota", "America/Lima", "America/Caracas", "America/La_Paz",
  "America/Santiago", "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo", "America/Recife", "America/Manaus",
  "America/Montevideo", "America/Asuncion", "America/Guayaquil",
  "America/Havana", "America/Santo_Domingo",
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Phoenix", "America/Los_Angeles", "America/Anchorage",
  "America/Honolulu", "America/Toronto", "America/Vancouver",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore",
  "Asia/Seoul", "Asia/Taipei", "Asia/Bangkok", "Asia/Jakarta",
  "Asia/Manila", "Asia/Kolkata", "Asia/Karachi", "Asia/Dhaka",
  "Asia/Dubai", "Asia/Tehran", "Asia/Jerusalem", "Asia/Riyadh",
  "Asia/Istanbul",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane",
  "Australia/Perth", "Pacific/Auckland", "Pacific/Fiji",
  "Europe/London", "Europe/Dublin", "Europe/Madrid", "Europe/Paris",
  "Europe/Amsterdam", "Europe/Berlin", "Europe/Rome", "Europe/Zurich",
  "Europe/Vienna", "Europe/Warsaw", "Europe/Stockholm", "Europe/Athens",
  "Europe/Bucharest", "Europe/Kyiv", "Europe/Moscow",
] as const;

export type TimezoneOption = { value: string; label: string };
export type TimezoneGroup = { region: string; zones: TimezoneOption[] };

function getRegion(tz: string): string {
  if (tz === "UTC") return "UTC";
  const slash = tz.indexOf("/");
  return slash === -1 ? "Other" : tz.slice(0, slash);
}

function getOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

function getAllZones(): readonly string[] {
  const intlAny = Intl as unknown as {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intlAny.supportedValuesOf === "function") {
    try {
      return intlAny.supportedValuesOf("timeZone");
    } catch {
      // fall through to fallback list
    }
  }
  return FALLBACK_TIMEZONES;
}

export function detectBrowserTimezone(): string {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isKnownTimezone(tz: string): boolean {
  return getAllZones().includes(tz);
}

export function getTimezoneGroups(): TimezoneGroup[] {
  const zones = getAllZones();
  const byRegion = new Map<string, TimezoneOption[]>();

  for (const tz of zones) {
    const region = getRegion(tz);
    const offset = getOffsetLabel(tz);
    const city =
      tz === "UTC"
        ? "UTC"
        : tz.slice(tz.indexOf("/") + 1).replace(/_/g, " ");
    const label = offset ? `${city} (${offset})` : city;
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push({ value: tz, label });
  }

  const order = [
    "Africa", "America", "Antarctica", "Arctic", "Asia",
    "Atlantic", "Australia", "Europe", "Indian", "Pacific", "UTC", "Other",
  ];
  return order
    .filter((r) => byRegion.has(r))
    .map((region) => ({
      region,
      zones: byRegion.get(region)!.sort((a, b) => a.label.localeCompare(b.label)),
    }));
}
