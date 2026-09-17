export type OpponentCharacter = {
  name: string;
  role: string;
  sphere: string;
  tone: string;
  personality: string;
  goals: string[];
  redLines: string[];
  style: string;
  systemPrompt: string;
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  playerBrief: string;
  opponent: OpponentCharacter;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type TemperatureReading = {
  score: number;
  reason: string;
};

export type FinalReport = {
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  summary: string;
};
