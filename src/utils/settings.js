const KEY = "resaler:settings";

// enabledLocationIds: null means "no filter configured yet" — show every location.
// Once the user touches the Settings tab it becomes a concrete array (possibly empty).
const DEFAULTS = {
  enabledLocationIds: null,
  watchlistView: "card", // "card" | "list"
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
