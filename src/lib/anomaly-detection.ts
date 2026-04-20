import { CalculatedLine } from "./types";

export type AnomalyStatus = "Kritisch" | "Prüfung" | "Hinweis";
export type AnomalyType =
  | "Hoher Betrag"
  | "Duplikat"
  | "Negativer Betrag"
  | "Runder Betrag"
  | "Reisekosten auf Produktions-KST";

export interface DetectedAnomaly {
  belegNr: string;
  buchungstext: string;
  betrag: number;
  kategorie: string;
  periode: string;
  kostenstelle: string;
  typ: AnomalyType;
  detail: string;
  co2Impact: number; // t CO2e
  status: AnomalyStatus;
}

const REISE_KEYS = ["reise", "dienstreise", "flug", "hotel", "bahn", "taxi"];

function isExpenseAccount(konto: string): boolean {
  const n = parseInt(String(konto).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n >= 40000 && n <= 89999;
}

function isProductionKst(kst: string): boolean {
  if (!kst) return false;
  const lower = kst.toLowerCase();
  if (lower.includes("produktion")) return true;
  const digits = String(kst).replace(/\D/g, "");
  return digits.startsWith("1000") || digits.startsWith("2000");
}

function isReisekosten(line: CalculatedLine): boolean {
  const cat = (line.kategorie || "").toLowerCase();
  const text = (line.original.buchungstext || "").toLowerCase();
  if (cat.includes("flug") || cat.includes("reise")) return true;
  return REISE_KEYS.some((k) => text.includes(k));
}

export function detectAnomalies(lines: CalculatedLine[]): DetectedAnomaly[] {
  if (!lines || lines.length === 0) return [];

  const anomalies: DetectedAnomaly[] = [];

  // 1) Hoher Betrag (>3x Kategorie-Durchschnitt)
  const byCategory = new Map<string, CalculatedLine[]>();
  for (const l of lines) {
    const k = l.kategorie || "Sonstiges";
    if (!byCategory.has(k)) byCategory.set(k, []);
    byCategory.get(k)!.push(l);
  }
  for (const [cat, group] of byCategory) {
    if (group.length < 2) continue;
    const avg = group.reduce((s, l) => s + Math.abs(l.original.betrag), 0) / group.length;
    if (avg <= 0) continue;
    for (const l of group) {
      if (Math.abs(l.original.betrag) > 3 * avg) {
        anomalies.push(make(l, "Hoher Betrag", `${(l.original.betrag / avg).toFixed(1)}× Ø ${cat}`, "Kritisch"));
      }
    }
  }

  // 2) Duplikat (gleicher Buchungstext + Betrag + Periode)
  const dupMap = new Map<string, CalculatedLine[]>();
  for (const l of lines) {
    const key = `${l.original.buchungstext}|${l.original.betrag}|${l.original.periode}`;
    if (!dupMap.has(key)) dupMap.set(key, []);
    dupMap.get(key)!.push(l);
  }
  for (const group of dupMap.values()) {
    if (group.length > 1) {
      for (const l of group) {
        anomalies.push(make(l, "Duplikat", `×${group.length}`, "Prüfung"));
      }
    }
  }

  // 3) Negativer Betrag auf Aufwandskonto
  for (const l of lines) {
    if (l.original.betrag < 0 && isExpenseAccount(l.original.konto)) {
      anomalies.push(make(l, "Negativer Betrag", `Konto ${l.original.konto}`, "Prüfung"));
    }
  }

  // 4) Runder Betrag (>50.000 und teilbar durch 10.000)
  for (const l of lines) {
    const b = Math.abs(l.original.betrag);
    if (b > 50000 && b % 10000 === 0) {
      anomalies.push(make(l, "Runder Betrag", `${b.toLocaleString("de-DE")} €`, "Hinweis"));
    }
  }

  // 5) Reisekosten auf Produktions-KST
  for (const l of lines) {
    if (isReisekosten(l) && isProductionKst(l.original.kostenstelle)) {
      anomalies.push(make(l, "Reisekosten auf Produktions-KST", `KST ${l.original.kostenstelle}`, "Prüfung"));
    }
  }

  // De-duplicate (same line + same type)
  const seen = new Set<string>();
  return anomalies.filter((a) => {
    const k = `${a.belegNr}|${a.typ}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function make(
  l: CalculatedLine,
  typ: AnomalyType,
  detail: string,
  status: AnomalyStatus
): DetectedAnomaly {
  return {
    belegNr: `FI-${String(l.original.id).padStart(6, "0")}`,
    buchungstext: l.original.buchungstext,
    betrag: l.original.betrag,
    kategorie: l.kategorie,
    periode: l.original.periode,
    kostenstelle: l.original.kostenstelle,
    typ,
    detail,
    co2Impact: l.t_co2,
    status,
  };
}

export function statusBadgeClasses(status: AnomalyStatus): string {
  switch (status) {
    case "Kritisch":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "Prüfung":
      return "border-warning/30 bg-warning/10 text-warning";
    case "Hinweis":
      return "border-border bg-muted text-muted-foreground";
  }
}
