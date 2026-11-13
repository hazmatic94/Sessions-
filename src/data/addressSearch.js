// Open address search (Photon / OpenStreetMap). Later this can be Google Places.

export function searchQuery(raw) {
  const trimmed = String(raw || "").trim().replace(/\s+/g, " ");
  const match = trimmed.match(/^(\d+\s*\/\s*)(\d.*)$/);
  if (!match) return { unit: "", query: trimmed };
  return { unit: match[1].replace(/\s+/g, ""), query: match[2].trim() };
}

export function formatAddressFeature(feature) {
  const props = feature?.properties || {};
  const street = [props.housenumber, props.street].filter(Boolean).join(" ");
  const locality = props.city || props.town || props.village || props.district || "";
  const region = [props.state, props.postcode].filter(Boolean).join(" ");
  const head = street || props.name || "";
  const label = [head, locality, region].filter(Boolean).join(", ");
  const [lon, lat] = feature?.geometry?.coordinates || [];
  if (!label) return null;
  return {
    label,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
  };
}

function withUnit(unit, query, label) {
  if (!unit) return label;
  const number = query.match(/^(\d+)\b/)?.[1];
  if (!number) return label;
  if (label.startsWith(`${number} `) || label.startsWith(`${number},`)) return `${unit}${label}`;
  return label;
}

export function addressSuggestions(raw, geojson) {
  const { unit, query } = searchQuery(raw);
  if (query.length < 3) return [];
  const seen = new Set();
  const suggestions = [];
  for (const feature of geojson?.features || []) {
    const formatted = formatAddressFeature(feature);
    if (!formatted) continue;
    const label = withUnit(unit, query, formatted.label);
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push({ label, lat: formatted.lat, lon: formatted.lon });
    if (suggestions.length === 5) break;
  }
  return suggestions;
}

export function addressSearchSelfCheck() {
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  const parsed = searchQuery("1 / 51 Old Burleigh Road");
  assert(parsed.unit === "1/" && parsed.query === "51 Old Burleigh Road", "unit");
  const suggestions = addressSuggestions("1/51 Old Burleigh Road", {
    features: [
      {
        geometry: { coordinates: [153.43, -28.08] },
        properties: {
          housenumber: "51",
          street: "Old Burleigh Road",
          city: "Surfers Paradise",
          state: "Queensland",
          postcode: "4217",
        },
      },
      {
        geometry: { coordinates: [153.43, -28.08] },
        properties: {
          housenumber: "51",
          street: "Old Burleigh Road",
          city: "Surfers Paradise",
          state: "Queensland",
          postcode: "4217",
        },
      },
    ],
  });
  assert(suggestions.length === 1, "dedupe");
  assert(suggestions[0].label.startsWith("1/51 Old Burleigh Road"), "label");
  const road = addressSuggestions("1/51 Old Burleigh Road", {
    features: [{
      geometry: { coordinates: [153.43, -28.03] },
      properties: { street: "Old Burleigh Road", city: "Gold Coast", state: "Queensland", postcode: "4218" },
    }],
  });
  assert(road[0].label.startsWith("Old Burleigh Road"), "road only");
  assert(suggestions[0].lat === -28.08 && suggestions[0].lon === 153.43, "point");
  assert(addressSuggestions("ab", { features: [] }).length === 0, "short");
}
