# Переговорный штаб (Arena переговоров)

Прототип хакатон-концепта **C**: учебный симулятор переговоров с ИИ-оппонентом, внутренним советником, «температурой сделки» и итоговым отчётом.

Стек: **Next.js App Router + TypeScript + Tailwind**. UI на русском.

## Быстрый старт (mock, без ключей)

```bash
cd arena-peregovorov-shtab
cp .env.example .env.local
# LLM_MOCK=1 уже в примере — mock включён
npm i
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

- **Игрок** (`/`): выбрать сценарий → чат с оппонентом → советник → температура → завершить → отчёт.
- **Админ** (`/admin`): роль / сфера / тон → генерация персонажа → сохранить или скачать JSON.

Сидированный сценарий «Поставка B2B SaaS» доступен сразу.

## SourceCraft LLM

Тонкий клиент: `src/lib/llm/client.ts`.

| Переменная | Назначение |
|---|---|
| `SOURCECRAFT_API_URL` | Базовый URL OpenAI-compatible API (без `/chat/completions`) |
| `SOURCECRAFT_API_KEY` | Bearer-ключ |
| `SOURCECRAFT_MODEL` | Опционально, модель (по умолчанию `default`) |
| `LLM_MOCK` | `1` — принудительный mock |

Запрос: `POST {SOURCECRAFT_API_URL}/chat/completions` с `Authorization: Bearer …`.

Если URL/ключ отсутствуют, запрос падает или `LLM_MOCK=1` — используются детерминированные mock-ответы. Секреты не коммитить: только `.env.example`.

Пример `.env.local` для живого API:

```bash
SOURCECRAFT_API_URL=https://your-sourcecraft-host/v1
SOURCECRAFT_API_KEY=sk-...
SOURCECRAFT_MODEL=default
LLM_MOCK=0
```

## Сборка

```bash
npm run build
npm start
```

## Хранение сценариев

Файловый стор: `data/scenarios.json` (+ сид в коде). Админ может сохранить на сервер, скачать JSON; игрок — загрузить JSON на главной.

## Out of scope

Голос, полный граф сценариев, assessment suite, design system.
