"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdvisorSidebar } from "@/components/AdvisorSidebar";
import { FinalReportView } from "@/components/FinalReport";
import { TemperatureMeter } from "@/components/TemperatureMeter";
import type {
  ChatMessage,
  FinalReport,
  Scenario,
} from "@/lib/scenarios/types";

type Props = {
  scenario: Scenario;
  onExit: () => void;
};

export function PlayArena({ scenario, onExit }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [tempScore, setTempScore] = useState<number | null>(null);
  const [tempReason, setTempReason] = useState<string | null>(null);
  const [tempLoading, setTempLoading] = useState(false);
  const [report, setReport] = useState<FinalReport | null>(null);
  const [ending, setEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchTemperature = useCallback(async (msgs: ChatMessage[]) => {
    setTempLoading(true);
    try {
      const res = await fetch("/api/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      const data = await res.json();
      setTempScore(data.score);
      setTempReason(data.reason);
    } catch {
      setTempReason("Не удалось оценить температуру.");
    } finally {
      setTempLoading(false);
    }
  }, []);

  const fetchAdvice = useCallback(async (msgs: ChatMessage[]) => {
    setAdviceLoading(true);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, messages: msgs }),
      });
      const data = await res.json();
      setAdvice(data.advice ?? data.error);
    } catch {
      setAdvice("Ошибка запроса советника.");
    } finally {
      setAdviceLoading(false);
    }
  }, [scenario.id]);

  useEffect(() => {
    void fetchAdvice([]);
  }, [fetchAdvice]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка чата");
      const withReply = [...next, data.message as ChatMessage];
      setMessages(withReply);
      void fetchTemperature(withReply);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠ ${err instanceof Error ? err.message : "Ошибка"}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function endNegotiation() {
    setEnding(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, messages }),
      });
      const data = await res.json();
      setReport(data.report);
    } catch {
      setReport({
        strengths: [],
        weaknesses: ["Не удалось сформировать отчёт"],
        recommendation: "Попробуйте ещё раз.",
        summary: "Ошибка генерации отчёта.",
      });
    } finally {
      setEnding(false);
    }
  }

  function restart() {
    setMessages([]);
    setReport(null);
    setTempScore(null);
    setTempReason(null);
    setAdvice(null);
    void fetchAdvice([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{scenario.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Оппонент: {scenario.opponent.name} · {scenario.opponent.role}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-[var(--card-border)] px-3 py-2 text-sm hover:bg-white/5"
          >
            К сценариям
          </button>
          <button
            type="button"
            onClick={() => void endNegotiation()}
            disabled={ending}
            className="rounded-xl bg-[var(--warn)]/90 px-3 py-2 text-sm font-medium text-black hover:brightness-110 disabled:opacity-50"
          >
            {ending ? "Формирую…" : "Завершить переговоры"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--accent-soft)]/40 p-3 text-sm">
        <strong className="text-[var(--accent)]">Ваш бриф:</strong>{" "}
        {scenario.playerBrief}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex min-h-[420px] flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-[var(--muted)]">
                Напишите первое сообщение оппоненту, чтобы начать переговоры.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[var(--accent)] text-white"
                    : "bg-black/30 text-[var(--foreground)]"
                }`}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
                  {m.role === "user" ? "Вы" : scenario.opponent.name}
                </div>
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-[var(--card-border)] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ваша реплика…"
              disabled={busy}
              className="flex-1 rounded-xl border border-[var(--card-border)] bg-black/30 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "…" : "Отправить"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <TemperatureMeter
            score={tempScore}
            reason={tempReason}
            loading={tempLoading}
          />
          <div className="min-h-[220px] flex-1">
            <AdvisorSidebar
              advice={advice}
              loading={adviceLoading}
              onRefresh={() => void fetchAdvice(messages)}
            />
          </div>
        </div>
      </div>

      {report && (
        <FinalReportView
          report={report}
          onClose={() => setReport(null)}
          onRestart={restart}
        />
      )}
    </div>
  );
}
