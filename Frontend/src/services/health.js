import { API_BASE_URL } from "../utils/constants";

let cachedHealth = null;

export const checkApiHealth = async () => {
  if (cachedHealth) return cachedHealth;
  try {
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    cachedHealth = {
      ok: res.ok,
      version: data.version || "1.0.0",
      isV2: data.version === "2.0.0" || data.features?.length > 0,
      features: data.features || [],
    };
  } catch {
    cachedHealth = { ok: false, version: "unknown", isV2: false, features: [] };
  }
  return cachedHealth;
};

export const clearHealthCache = () => {
  cachedHealth = null;
};
