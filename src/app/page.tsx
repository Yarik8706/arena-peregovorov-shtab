"use client";

import { useEffect, useRef, useState } from "react";
import { PlayArena } from "@/components/PlayArena";
import type { Scenario } from "@/lib/scenarios/types";

export default function HomePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadScenarios() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scenarios");
      const data = await res.json();
      setScenarios(data);
    } catch {
      setError("Не удалось загрузить сценарии");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadScenarios();
  }, []);

  async function onUpload(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Scenario | Scenario[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list.length === 1 ? list[0] : list),
      });
      if (!res.ok) throw new Error("upload failed");
      await loadScenarios();
    } catch {
      setError("Некорректный JSON сценария");
    }
  }

  if (selected) {
    return (
      <PlayArena scenario={selected} onExit={() => setSelected(null)} />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Arena переговоров
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Выберите сценарий и проведите учебные переговоры с ИИ-оппонентом.
          Справа — внутренний советник и температура сделки. В конце —
          отчёт с рекомендациями к реальной встрече.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-[var(--card-border)] px-3 py-2 text-sm hover:bg-white/5"
        >
          Загрузить JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onUpload(f);
            e.target.value = "";
          }}
        />
        <a
          href="/admin"
          className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          Создать в админке
        </a>
      </div>

      {error && (
        <p className="text-sm text-[var(--bad)]">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Загрузка…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-left transition hover:border-[var(--accent)]"
            >
              <h2 className="font-medium">{s.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                {s.description}
              </p>
              <p className="mt-3 text-xs text-[var(--accent)]">
                {s.opponent.name} · {s.opponent.sphere}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
