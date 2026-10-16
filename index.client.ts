import type { PluginClientContext } from "@getpaseo/plugin/client";
import { Platform } from "react-native";
import { installTabPips } from "./client/web";

export default function contribute(_client: PluginClientContext) {
  if (Platform.OS !== "web") return () => {};
  try {
    return installTabPips();
  } catch (error) {
    console.error("tab-age client failed", error);
    return () => {};
  }
}
