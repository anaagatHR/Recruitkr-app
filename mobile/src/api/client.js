import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Backend address.
 *
 * 1) Built APK / production: "extra.apiUrl" in app.json is your DEPLOYED backend
 *    (e.g. https://recruitkr-api.onrender.com/api). When present it always wins.
 *
 * 2) Local development fallback per platform:
 *    - Web preview (browser):   http://localhost:5000/api
 *    - Android emulator:        http://10.0.2.2:5000/api
 *    To test on a real phone in Expo Go against a LOCAL backend, set
 *    EXPO_PUBLIC_API_URL (see .env) to http://<your-PC-LAN-IP>:5000/api.
 */
const configuredUrl =
  Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  configuredUrl && configuredUrl.length > 0
    ? configuredUrl
    : Platform.OS === "web"
    ? "http://localhost:5000/api"
    : "http://10.0.2.2:5000/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  // 60s: a free Render server may "sleep" and take ~30-50s to wake on the first
  // request after inactivity. A short timeout would wrongly show an error.
  timeout: 60000,
});

/* ---- Token cache (avoids an AsyncStorage disk read on every request) ---- */
let tokenCache = null;
let tokenLoaded = false;

export async function setToken(token) {
  tokenCache = token || null;
  tokenLoaded = true;
  if (token) await AsyncStorage.setItem("token", token);
  else await AsyncStorage.removeItem("token");
}

async function getToken() {
  if (!tokenLoaded) {
    tokenCache = await AsyncStorage.getItem("token");
    tokenLoaded = true;
  }
  return tokenCache;
}

/* ---- 401 handler: set by AuthContext so an expired token logs the user out --- */
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Attach the saved token to every request (from the in-memory cache).
client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors + handle session expiry.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;

    // Expired / invalid token → drop the session (AuthContext returns to login).
    if (status === 401 && onUnauthorized) {
      tokenCache = null;
      onUnauthorized();
    }

    // Timeout / no network: usually the free server is waking up.
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      const e = new Error(
        "Server is waking up — please wait a few seconds and try again."
      );
      e.isNetwork = true;
      return Promise.reject(e);
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    const e = new Error(message);
    e.status = status;
    return Promise.reject(e);
  }
);

export default client;
