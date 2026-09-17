"use client";

import { useEffect, useState } from "react";
import type { OpponentCharacter, Scenario } from "@/lib/scenarios/types";

export default function AdminPage() {
  const [role, setRole] = useState("Директор по закупкам");
  const [sphere, setSphere] = useState("IT / SaaS");
  const [tone, setTone] = useState("жёсткий, деловой");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [playerBrief, setPlayerBrief] = useState("");
  const [opponent, setOpponent] = useState<OpponentCharacter | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [list, setList] = useState<Scenario[]>([]);
  const [mockFlag, setMockFlag] = useState<boolean | null>(null);

  async function refreshList() {
    const res = await fetch("/api/scenarios");
    setList(await res.json());
  }

  useEffect(() => {
    void refreshList();
  }, []);

  async function generateCharacter() {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, sphere, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка генерации");
      setOpponent(data.opponent);
      setMockFlag(!!data.mock);
      if (!title) {
        setTitle(`Переговоры с ${data.opponent.name}`);
      }
      if (!description) {
        setDescription(
          `Учебный сценарий: ${role} в сфере «${sphere}», тон — ${tone}.`
        );
      }
      if (!playerBrief) {
        setPlayerBrief(
          "Вы — продавец/переговорщик. Цель — договориться о приемлемых условиях, не нарушая маржу и сроки."
        );
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setGenerating(false);
    }
  }

  async function saveScenario() {
    if (!opponent) {
      setMessage("Сначала сгенерируйте персонажа");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const scenario: Scenario = {
        id: `sc-${Date.now()}`,
        title: title || `Сценарий: ${opponent.name}`,
        description: description || "Без описания",
        playerBrief: playerBrief || "Бриф не задан",
        opponent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });
      if (!res.ok) throw new Error("Не удалось сохранить");
      setMessage("Сценарий сохранён. Можно играть на главной.");
      await refreshList();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  function downloadScenario() {
    if (!opponent) return;
    const scenario: Scenario = {
      id: `sc-export-${Date.now()}`,
      title: title || `Сценарий: ${opponent.name}`,
      description,
      playerBrief,
      opponent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(scenario, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scenario.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove(id: string) {
    await fetch(`/api/scenarios?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refreshList();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Админ-контур</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Задайте роль, сферу и тон → сгенерируйте оппонента (LLM или mock) →
          сохраните сценарий локально или скачайте JSON.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
          <h2 className="font-medium">Параметры персонажа</h2>
          <label className="block text-xs text-[var(--muted)]">
            Роль
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            Сфера
            <input
              value={sphere}
              onChange={(e) => setSphere(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            Тон
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void generateCharacter()}
            disabled={generating}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {generating ? "Генерация…" : "Сгенерировать оппонента"}
          </button>
          {mockFlag !== null && (
            <p className="text-xs text-[var(--muted)]">
              Режим LLM: {mockFlag ? "mock" : "SourceCraft"}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4">
          <h2 className="font-medium">Сценарий</h2>
          <label className="block text-xs text-[var(--muted)]">
            Название
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            Описание
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--muted)]">
            Бриф игрока
            <textarea
              value={playerBrief}
              onChange={(e) => setPlayerBrief(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm"
            />
          </label>

          {opponent && (
            <div className="rounded-xl bg-black/25 p-3 text-xs leading-relaxed">
              <p className="font-medium text-sm">{opponent.name}</p>
              <p className="text-[var(--muted)]">{opponent.personality}</p>
              <p className="mt-2">
                <span className="text-[var(--accent)]">Цели:</span>{" "}
                {opponent.goals.join("; ")}
              </p>
              <p>
                <span className="text-[var(--warn)]">Красные линии:</span>{" "}
                {opponent.redLines.join("; ")}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveScenario()}
              disabled={saving || !opponent}
              className="rounded-xl bg-[var(--good)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? "Сохраняю…" : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={downloadScenario}
              disabled={!opponent}
              className="rounded-xl border border-[var(--card-border)] px-4 py-2 text-sm disabled:opacity-50"
            >
              Скачать JSON
            </button>
          </div>
          {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-medium">Сохранённые сценарии</h2>
        <ul className="space-y-2">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-[var(--muted)]">{s.id}</div>
              </div>
              <button
                type="button"
                onClick={() => void remove(s.id)}
                disabled={s.id === "seed-b2b-saas"}
                className="text-xs text-[var(--bad)] disabled:opacity-30"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
