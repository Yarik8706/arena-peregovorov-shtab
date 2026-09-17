import { promises as fs } from "fs";
import path from "path";
import { SEED_SCENARIO } from "./seed";
import type { Scenario } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "scenarios.json");

async function readAll(): Promise<Scenario[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Scenario[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [SEED_SCENARIO];
    }
    if (!parsed.some((s) => s.id === SEED_SCENARIO.id)) {
      return [SEED_SCENARIO, ...parsed];
    }
    return parsed;
  } catch {
    return [SEED_SCENARIO];
  }
}

async function writeAll(scenarios: Scenario[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(scenarios, null, 2), "utf8");
}

export async function listScenarios(): Promise<Scenario[]> {
  return readAll();
}

export async function getScenario(id: string): Promise<Scenario | null> {
  const all = await readAll();
  return all.find((s) => s.id === id) ?? null;
}

export async function saveScenario(scenario: Scenario): Promise<Scenario> {
  const all = await readAll();
  const idx = all.findIndex((s) => s.id === scenario.id);
  const next = { ...scenario, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = next;
  else all.push(next);
  await writeAll(all);
  return next;
}

export async function deleteScenario(id: string): Promise<boolean> {
  if (id === SEED_SCENARIO.id) return false;
  const all = await readAll();
  const filtered = all.filter((s) => s.id !== id);
  if (filtered.length === all.length) return false;
  await writeAll(filtered);
  return true;
}

export async function replaceAll(scenarios: Scenario[]): Promise<Scenario[]> {
  const hasSeed = scenarios.some((s) => s.id === SEED_SCENARIO.id);
  const next = hasSeed ? scenarios : [SEED_SCENARIO, ...scenarios];
  await writeAll(next);
  return next;
}
