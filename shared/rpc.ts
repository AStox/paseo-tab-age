import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const reportHealRpc = defineRpc({
  name: "tab-age.report-heal",
  input: z.object({}).passthrough(),
  output: z.object({ ok: z.boolean() }),
});
