import { useState, useCallback } from "react";
import { loadSettings, saveSettings } from "../utils/settings";

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = useCallback(patch => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return [settings, updateSettings];
}
