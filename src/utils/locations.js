export const getLocationName = loc => loc.name ?? loc.location_name ?? `Location ${loc.id}`;

export const sortLocationsByName = locs =>
  [...locs].sort((a, b) => getLocationName(a).localeCompare(getLocationName(b)));

// city_state comes back from Mac.bid formatted like "Indianapolis, IN"
export function getLocationState(loc) {
  const match = /,\s*([A-Za-z]{2})\s*$/.exec(loc.city_state ?? "");
  return match ? match[1].toUpperCase() : "Other";
}

// Groups + sorts locations by state, with unrecognized city_state values in "Other" last.
export function groupLocationsByState(locs) {
  const groups = new Map();
  for (const loc of sortLocationsByName(locs)) {
    const state = getLocationState(loc);
    if (!groups.has(state)) groups.set(state, []);
    groups.get(state).push(loc);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)))
    .map(([state, locations]) => ({ state, locations }));
}
