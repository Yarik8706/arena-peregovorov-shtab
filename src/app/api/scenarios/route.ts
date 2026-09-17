import { NextRequest, NextResponse } from "next/server";
import {
  deleteScenario,
  getScenario,
  listScenarios,
  replaceAll,
  saveScenario,
} from "@/lib/scenarios/store";
import type { Scenario } from "@/lib/scenarios/types";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const s = await getScenario(id);
    if (!s) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(s);
  }
  return NextResponse.json(await listScenarios());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (Array.isArray(body)) {
    const all = await replaceAll(body as Scenario[]);
    return NextResponse.json(all);
  }
  const scenario = body as Scenario;
  if (!scenario.id || !scenario.title || !scenario.opponent) {
    return NextResponse.json({ error: "Некорректный сценарий" }, { status: 400 });
  }
  const saved = await saveScenario({
    ...scenario,
    createdAt: scenario.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json(saved);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await deleteScenario(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Нельзя удалить или не найдено" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
