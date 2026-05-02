import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const normalizeBaseUrl = (url) => String(url || "").replace(/\/+$/, "");
const DEFAULT_PORT = String(process.env.EXPO_PUBLIC_API_PORT || 5000);

const ensureApiPrefix = (url) => {
  const normalized = normalizeBaseUrl(url);
  if (normalized.endsWith("/api")) {
    return normalized;
  }
  return `${normalized}/api`;
};

const resolveBaseUrl = () => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_URL;
  const hostname =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : null;

  if (Platform.OS === "web" || hostname) {
    const isLocalWebHost = !hostname || hostname === "localhost" || hostname === "127.0.0.1";
    if (envBaseUrl && !isLocalWebHost) {
      return ensureApiPrefix(envBaseUrl);
    }

    // For local web dev, follow the browser host so the app still works when the laptop IP changes.
    const protocol = typeof window !== "undefined" && window.location?.protocol ? window.location.protocol : "http:";
    const host = hostname || "localhost";
    return ensureApiPrefix(`${protocol}//${host}:${DEFAULT_PORT}`);
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const host = String(hostUri).split(":")[0];
    return ensureApiPrefix(`http://${host}:${DEFAULT_PORT}`);
  }

  if (envBaseUrl) {
    return ensureApiPrefix(envBaseUrl);
  }

  if (Platform.OS === "android") {
    return ensureApiPrefix(`http://10.0.2.2:${DEFAULT_PORT}`);
  }

  return ensureApiPrefix(`http://localhost:${DEFAULT_PORT}`);
};

export const BASE_URL = resolveBaseUrl();
const DEBUG_PREFIX = "[ParkX FE]";

console.log(`${DEBUG_PREFIX} API base URL resolved:`, BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    `${DEBUG_PREFIX} Request:`,
    {
      method: String(config.method || "GET").toUpperCase(),
      url: `${config.baseURL || ""}${config.url || ""}`,
      hasToken: Boolean(token),
      data: config.data || null,
      params: config.params || null,
    }
  );
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`${DEBUG_PREFIX} Response:`, {
      status: response.status,
      url: `${response.config?.baseURL || ""}${response.config?.url || ""}`,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error(`${DEBUG_PREFIX} Response error:`, {
      status: error?.response?.status || null,
      url: `${error?.config?.baseURL || ""}${error?.config?.url || ""}`,
      message: error?.response?.data?.message || error?.message,
      data: error?.response?.data || null,
    });
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallbackMessage = "Request failed") => {
  const message = (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
  console.error(`${DEBUG_PREFIX} API error resolved:`, message);
  return message;
};

export default api;
