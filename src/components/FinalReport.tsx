"use client";

import type { FinalReport as Report } from "@/lib/scenarios/types";

type Props = {
  report: Report;
  onClose: () => void;
  onRestart: () => void;
};

export function FinalReportView({ report, onClose, onRestart }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-2xl">
        <h2 className="mb-2 text-xl font-semibold">Итоговый отчёт</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">{report.summary}</p>

        <section className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-[var(--good)]">Сильные стороны</h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mb-4">
          <h3 className="mb-1 text-sm font-medium text-[var(--warn)]">Зоны роста</h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {report.weaknesses.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6 rounded-lg bg-[var(--accent-soft)] p-3 text-sm">
          <h3 className="mb-1 font-medium">Рекомендация к реальной встрече</h3>
          <p>{report.recommendation}</p>
        </section>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            Новая попытка
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--card-border)] px-4 py-2 text-sm hover:bg-white/5"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
