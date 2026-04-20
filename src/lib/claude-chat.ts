import { CalculatedLine } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function buildContextJson(lines: CalculatedLine[]): string {
  // Keep payload compact — only fields needed for analysis
  const compact = lines.map((l) => ({
    id: l.original.id,
    kst: l.original.kostenstelle,
    konto: l.original.konto,
    text: l.original.buchungstext,
    betrag: Number(l.original.betrag.toFixed(2)),
    periode: l.original.periode,
    kategorie: l.kategorie,
    scope: l.scope,
    t_co2: Number(l.t_co2.toFixed(4)),
  }));
  return JSON.stringify(compact);
}

export async function askClaudeAboutData(
  apiKey: string,
  history: ChatMessage[],
  question: string,
  lines: CalculatedLine[]
): Promise<string> {
  const dataJson = buildContextJson(lines);

  const systemPrompt = `Du bist ein CO₂-Bilanzierungsexperte und SAP FICO Berater. Du analysierst SAP FI/CO Kostenstellen-Buchungsdaten für CSRD-Compliance. Dir stehen folgende Buchungsdaten zur Verfügung: ${dataJson}. Beantworte Fragen präzise auf Deutsch. Gib konkrete Zahlen aus den Daten an. Verwende deutsche Zahlenformate (1.234,56). Halte dich kurz und präzise.`;

  // Keep last 5 messages of history
  const recent = history.slice(-5);
  const messages = [
    ...recent.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: question },
  ];

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API Fehler (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";
  return text.trim();
}
