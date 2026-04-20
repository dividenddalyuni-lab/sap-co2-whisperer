import { BookingLine, CalculatedLine, ClassifiedLine, ClaudeResponse } from "./types";

export function calculateEmissions(
  bookingLines: BookingLine[],
  claudeResponse: ClaudeResponse
): CalculatedLine[] {
  // Single Spend-Based EEIO formula for ALL lines:
  //   t CO2e = Betrag (€) × Emissionsfaktor (kg CO2e/€) ÷ 1000
  return claudeResponse.zeilen
    .map((z) => {
      const original = bookingLines.find((b) => b.id === z.zeile_id);
      if (!original) return null;
      const einheiten = original.betrag; // EUR is the activity unit in EEIO
      const kg_co2 = original.betrag * z.emissionsfaktor;
      const t_co2 = kg_co2 / 1000;
      return { ...z, original, einheiten, kg_co2, t_co2 };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
}

export function formatEuro(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function formatTonnes(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function scopeTotal(lines: CalculatedLine[], scope: 1 | 2 | 3): number {
  return lines.filter((l) => l.scope === scope).reduce((s, l) => s + l.t_co2, 0);
}

export function qualityColor(score: number): string {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function statusIcon(status: string): { icon: string; className: string } {
  switch (status) {
    case "ok": return { icon: "✓", className: "text-primary" };
    case "pruefen": return { icon: "⚠", className: "text-warning" };
    case "fehler": return { icon: "✗", className: "text-destructive" };
    default: return { icon: "?", className: "text-muted-foreground" };
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "ok": return "OK";
    case "pruefen": return "Prüfen";
    case "fehler": return "Fehler";
    default: return status;
  }
}
