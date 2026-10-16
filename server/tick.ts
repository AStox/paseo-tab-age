import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { ageEmoji, applyEmoji } from "../shared/age";

const exec = promisify(execFile);

type AgentFile = {
  id: string;
  title: string | null;
  lastStatus?: string;
  lastUserMessageAt?: string | null;
  createdAt: string;
  archivedAt?: string | null;
  internal?: boolean;
};

async function paseoHome(): Promise<string> {
  if (process.env.PASEO_HOME) return process.env.PASEO_HOME;
  const { stdout } = await exec("paseo", ["daemon", "status", "--json"]);
  const status = JSON.parse(stdout) as { home?: string };
  if (!status.home) throw new Error("paseo home not found");
  return status.home;
}

async function agentFiles(home: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith(".json")) out.push(path);
    }
  }
  await walk(join(home, "agents"));
  return out;
}

export async function refreshTabAges(now = Date.now()): Promise<number> {
  const files = await agentFiles(await paseoHome());
  let changed = 0;
  for (const file of files) {
    const agent = JSON.parse(await readFile(file, "utf8")) as AgentFile;
    if (agent.archivedAt || agent.internal || !agent.title) continue;
    const stamp = Date.parse(agent.lastUserMessageAt || agent.createdAt);
    const emoji = ageEmoji(Number.isFinite(stamp) ? now - stamp : 0, agent.lastStatus === "running");
    const next = applyEmoji(agent.title, emoji);
    if (next === agent.title) continue;
    await exec("paseo", ["agent", "update", agent.id, "--name", next]);
    changed += 1;
  }
  return changed;
}
