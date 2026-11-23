import type { PluginServerContext } from "@getpaseo/plugin/server";
import { refreshTabAges } from "./server/tick";
import { reportHealRpc } from "./shared/rpc";

export default function contribute(server: PluginServerContext) {
  let busy = false;
  const run = () => {
    if (busy) return;
    busy = true;
    void refreshTabAges()
      .catch((error) => {
        console.error("tab-age refresh failed", error);
      })
      .finally(() => {
        busy = false;
      });
  };

  run();
  const timer = setInterval(run, 15 * 1000);
  server.on("agent.created", run);
  server.on("agent.turn_started", run);
  server.on("agent.turn_ended", run);
  server.handle(reportHealRpc, (input) => {
    console.log("tab-age heal " + JSON.stringify(input));
    return { ok: true };
  });

  return () => {
    clearInterval(timer);
  };
}
