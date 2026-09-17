import type { ChatCompletionRequest, ChatCompletionResponse, LlmMessage } from "./types";

function isMockMode(): boolean {
  if (process.env.LLM_MOCK === "1") return true;
  const url = process.env.SOURCECRAFT_API_URL;
  const key = process.env.SOURCECRAFT_API_KEY;
  return !url || !key;
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mockReply(messages: LlmMessage[]): string {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const seed = hashSeed(system.slice(0, 80) + "|" + lastUser);

  if (system.includes("ГЕНЕРАЦИЯ_ПЕРСОНАЖА") || system.includes("генерации персонажа")) {
    const roles = ["директор по закупкам", "коммерческий директор", "владелец сети"];
    const names = ["Ирина Волкова", "Алексей Смирнов", "Марина Козлова"];
    const name = names[seed % names.length];
    const role = roles[seed % roles.length];
    return JSON.stringify({
      name,
      personality: "Опытный переговорщик, ценит факты и сроки, не любит давление.",
      goals: ["Снизить цену на 8–12%", "Получить гибкий график поставок", "Минимизировать риски контракта"],
      redLines: ["Не соглашаться на предоплату свыше 30%", "Не принимать условия без KPI"],
      style: "Сдержанный, задаёт уточняющие вопросы, иногда делает паузы.",
      systemPrompt: `Ты — ${name}, ${role}. Ведёшь жёсткие, но деловые переговоры. Говори по-русски, коротко (2–4 предложения). Не сдавайся сразу; торгуйся. Не раскрывай свои «красные линии» прямо.`,
    });
  }

  if (system.includes("ТЕМПЕРАТУРА_СДЕЛКИ") || system.includes("температуру сделки")) {
    const score = 35 + (seed % 50);
    const reasons = [
      "Собеседник услышал ценностное предложение, но ещё сомневается в цифрах.",
      "Есть прогресс по срокам, цена остаётся камнем преткновения.",
      "Тон стал конструктивнее после уточнения условий.",
      "Игрок давит слишком жёстко — доверие чуть просело.",
    ];
    return JSON.stringify({ score, reason: reasons[seed % reasons.length] });
  }

  if (system.includes("ВНУТРЕННИЙ_СОВЕТНИК") || system.includes("внутренний советник")) {
    const tips = [
      "Сначала подтвердите интерес оппонента, затем предложите обмен: скидка ↔ объём.",
      "Задайте открытый вопрос про приоритет: цена, сроки или риски.",
      "Суммируйте уже согласованное — это снижает напряжение.",
      "Предложите пилот на малый объём, чтобы обойти красную линию по предоплате.",
    ];
    return tips[seed % tips.length];
  }

  if (system.includes("ФИНАЛЬНЫЙ_ОТЧЁТ") || system.includes("итоговый отчёт")) {
    return JSON.stringify({
      strengths: [
        "Чёткая структура аргументов и ссылки на выгоды.",
        "Умение задавать уточняющие вопросы.",
      ],
      weaknesses: [
        "Иногда рано называли финальную цену.",
        "Мало использовали обмен уступками.",
      ],
      recommendation:
        "На реальной встрече начните с совместного определения критериев успеха, держите «якорь» цены и готовьте 2–3 пакета условий.",
      summary: "Переговоры прошли на среднем уровне конструктивности; есть база для сделки при уточнении коммерческих условий.",
    });
  }

  const replies = [
    `Понял вашу позицию. Нам важно уложиться в бюджет — давайте уточним: какой объём вы готовы гарантировать в первом квартале?`,
    `Интересно. Но текущее предложение всё ещё выше нашего бенчмарка. Что вы можете предложить взамен, если мы зафиксируем срок на 12 месяцев?`,
    `Хорошо, это звучит реалистичнее. Остаётся вопрос рисков: как вы страхуете срыв поставки?`,
    `Я готов двигаться, если мы разделим предоплату и добавим KPI по качеству. Ваш вариант?`,
    `Давайте не торопиться. Мне нужны цифры по TCO, а не только unit-price. Можете разложить?`,
  ];
  return replies[seed % replies.length];
}

export async function chatCompletion(
  req: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  if (isMockMode()) {
    return { content: mockReply(req.messages), mock: true };
  }

  const base = process.env.SOURCECRAFT_API_URL!.replace(/\/$/, "");
  const model = process.env.SOURCECRAFT_MODEL || "default";

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SOURCECRAFT_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 800,
      }),
    });

    if (!res.ok) {
      console.error("SourceCraft error", res.status, await res.text());
      return { content: mockReply(req.messages), mock: true };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { content: mockReply(req.messages), mock: true };
    }
    return { content, mock: false };
  } catch (err) {
    console.error("SourceCraft request failed", err);
    return { content: mockReply(req.messages), mock: true };
  }
}

export function extractJson<T>(text: string): T | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
