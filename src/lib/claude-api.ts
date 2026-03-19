import { BookingLine, ClaudeResponse } from "./types";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

const buildPrompt = (lines: BookingLine[]): string => {
  const linesJson = JSON.stringify(lines.map(l => ({
    id: l.id,
    kostenstelle: l.kostenstelle,
    konto: l.konto,
    buchungstext: l.buchungstext,
    betrag: l.betrag,
    periode: l.periode,
  })));

  return `Du bist ein zertifizierter CO₂-Bilanzierungsexperte nach GHG Protocol Corporate Standard und CSRD/ESRS E1.

Analysiere diese SAP FI/CO Buchungszeilen eines deutschen Unternehmens vollständig.

Buchungszeilen (JSON):
${linesJson}

Führe folgende Analysen durch:

1. KLASSIFIZIERUNG jeder Zeile:
- kategorie: "Strom" | "Diesel" | "Erdgas" | "Fernwärme" | "Flug" | "Spedition_Strasse" | "Spedition_See" | "Spedition_Luft" | "Verpackung" | "Rohwaren" | "Abfall" | "Wasser" | "Sonstiges"
- scope: 1 | 2 | 3
- scope3_kategorie: (nur bei Scope 3)
- emissionsfaktor: Zahl in kg CO₂e pro Einheit
- einheit: "kWh" | "Liter" | "km" | "t" | "EUR_EEIO"
- umrechnungsfaktor: Betrag € zu physischer Einheit
- quelle: "UBA 2024" | "DEFRA 2024" | "GHG Protocol EEIO"
- konfidenz: "hoch" | "mittel" | "niedrig"
- status: "ok" | "pruefen" | "fehler"

2. ANOMALIE-ERKENNUNG:
- Ungewöhnlich hohe oder niedrige Beträge
- Fehlende wichtige Emissionskategorien
- Buchungen die nicht klassifizierbar sind
- Scope-Verteilung Auffälligkeiten

3. DATENQUALITÄT:
- Score 0-100%
- Was fehlt für vollständige CSRD-Compliance
- Konkrete Empfehlungen

Antworte NUR mit diesem JSON, kein Text davor oder danach:
{
  "zeilen": [
    {
      "zeile_id": 0,
      "kategorie": "...",
      "scope": 1,
      "scope3_kategorie": "...",
      "emissionsfaktor": 0.380,
      "einheit": "kWh",
      "umrechnungsfaktor": 0.28,
      "quelle": "UBA 2024",
      "konfidenz": "hoch",
      "status": "ok",
      "begruendung": "..."
    }
  ],
  "anomalien": [
    {
      "zeile_id": 0,
      "typ": "hoher_betrag",
      "nachricht": "...",
      "empfehlung": "..."
    }
  ],
  "datenqualitaet": {
    "score": 72,
    "fehlende_scopes": ["..."],
    "empfehlungen": ["..."]
  }
}`;
};

export async function callClaudeAPI(
  apiKey: string,
  bookingLines: BookingLine[]
): Promise<ClaudeResponse> {
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
      max_tokens: 4000,
      messages: [
        { role: "user", content: buildPrompt(bookingLines) },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API Fehler (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "";

  // Strip markdown fences if present
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  return JSON.parse(cleaned) as ClaudeResponse;
}
