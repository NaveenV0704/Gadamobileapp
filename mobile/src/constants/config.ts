import { Platform } from "react-native";

const API_URL_LOCAL = Platform.select({
  android: "http://10.0.2.2:8085",
  ios: "http://localhost:8085",
  default: "http://localhost:8085",
});

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || API_URL_LOCAL;
