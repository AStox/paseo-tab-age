import type { PluginClientContext } from "@getpaseo/plugin/client";
import { Platform } from "react-native";
import { installTabPips } from "./client/web";
import { reportHealRpc } from "./shared/rpc";

export default function contribute(client: PluginClientContext) {
  if (Platform.OS !== "web") return () => {};
  const report = (event: Record<string, unknown>) => {
    client.rpc(reportHealRpc, event).catch(() => {});
  };
  try {
    return installTabPips(report);
  } catch (error) {
    console.error("tab-age client failed", error);
    return () => {};
  }
}
