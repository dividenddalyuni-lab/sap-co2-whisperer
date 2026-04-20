import { CalculatedLine } from "./types";

export type Priority = "Hoch" | "Mittel" | "Niedrig";

export interface SavingMeasure {
  id: string;
  icon: string;
  title: string;
  description: string;
  affectedCount: number;
  co2Saving: number; // t CO2e/year
  eurSaving: number; // EUR/year
  priority: Priority;
  rule: string;
}

const STROM_KEYS = ["strom", "fernwärme", "fernwaerme", "elektri"];
const TRANSPORT_STRASSE_KEYS = ["transport straße", "transport strasse", "lkw", "spedition", "logistik"];
const KRAFTSTOFF_KEYS = ["diesel", "kraftstoff", "benzin", "fuhrpark"];
const REISE_KEYS = ["dienstreise", "reise", "flug", "hotel", "bahn"];

function matchesAny(text: string, keys: string[]): boolean {
  const t = (text || "").toLowerCase();
  return keys.some((k) => t.includes(k));
}

function categoryMatches(line: CalculatedLine, keys: string[]): boolean {
  return matchesAny(line.kategorie, keys) || matchesAny(line.original.buchungstext, keys);
}

function priorityFromCo2(co2: number, totalCo2: number): Priority {
  if (totalCo2 <= 0) return "Niedrig";
  const share = co2 / totalCo2;
  if (share >= 0.15) return "Hoch";
  if (share >= 0.05) return "Mittel";
  return "Niedrig";
}

export function computeSavings(lines: CalculatedLine[]): SavingMeasure[] {
  if (!lines || lines.length === 0) return [];

  const sumCo2 = (arr: CalculatedLine[]) => arr.reduce((s, l) => s + l.t_co2, 0);
  const sumEur = (arr: CalculatedLine[]) => arr.reduce((s, l) => s + Math.abs(l.original.betrag), 0);

  const totalCo2 = sumCo2(lines);
  const scope2 = lines.filter((l) => l.scope === 2);
  const scope3 = lines.filter((l) => l.scope === 3);
  const scope1 = lines.filter((l) => l.scope === 1);

  const measures: SavingMeasure[] = [];

  // Rule 1 — Ökostrom
  const stromLines = scope2.filter((l) => categoryMatches(l, STROM_KEYS));
  const stromCo2 = sumCo2(stromLines);
  if (totalCo2 > 0 && stromCo2 / totalCo2 > 0.2) {
    const co2 = sumCo2(scope2) * 0.85;
    const eur = sumEur(stromLines) * 0.15;
    measures.push({
      id: "oekostrom",
      icon: "⚡",
      title: "Ökostrom Umstellung",
      description: `Wechsel auf zertifizierten Grünstrom für ${stromLines.length} Strom-/Fernwärme-Buchungen. Eliminiert nahezu vollständig Scope 2 Emissionen.`,
      affectedCount: stromLines.length,
      co2Saving: co2,
      eurSaving: eur,
      priority: priorityFromCo2(co2, totalCo2),
      rule: "Scope 2 Strom > 20% Gesamtemissionen",
    });
  }

  // Rule 2 — Logistik optimieren
  const transportLines = scope3.filter((l) => categoryMatches(l, TRANSPORT_STRASSE_KEYS));
  const transportCo2 = sumCo2(transportLines);
  const scope3Co2 = sumCo2(scope3);
  if (scope3Co2 > 0 && transportCo2 / scope3Co2 > 0.15) {
    const co2 = transportCo2 * 0.25;
    const eur = sumEur(transportLines) * 0.10;
    measures.push({
      id: "logistik",
      icon: "🚛",
      title: "Logistikroute optimieren",
      description: `Routenoptimierung & Konsolidierung von ${transportLines.length} Straßentransport-Buchungen. ~25% Emissionsreduktion realistisch.`,
      affectedCount: transportLines.length,
      co2Saving: co2,
      eurSaving: eur,
      priority: priorityFromCo2(co2, totalCo2),
      rule: "Scope 3 Transport > 15% des Scope 3",
    });
  }

  // Rule 3 — Lieferant wechseln (höchster Scope 3 Cat 1 nach EUR)
  const cat1 = scope3.filter((l) => {
    const k = (l.scope3_kategorie || "").toLowerCase();
    return k.includes("1") || k.includes("purchased") || k.includes("eingekauft") || k.includes("rohwaren") || k.includes("material");
  });
  const candidates = cat1.length > 0 ? cat1 : scope3;
  if (candidates.length > 0) {
    const bySupplier = new Map<string, CalculatedLine[]>();
    for (const l of candidates) {
      const key = l.original.buchungstext || l.kategorie || "Unbekannt";
      if (!bySupplier.has(key)) bySupplier.set(key, []);
      bySupplier.get(key)!.push(l);
    }
    let topKey = "";
    let topEur = 0;
    let topGroup: CalculatedLine[] = [];
    for (const [key, group] of bySupplier) {
      const eur = sumEur(group);
      if (eur > topEur) {
        topEur = eur;
        topKey = key;
        topGroup = group;
      }
    }
    if (topGroup.length > 0 && topEur > 0) {
      const co2 = sumCo2(topGroup) * 0.35;
      const eur = topEur * 0.05;
      measures.push({
        id: "lieferant",
        icon: "♻️",
        title: "Lieferant wechseln",
        description: `Größter Scope 3 Lieferant: "${topKey}" (${topGroup.length} Buchungen). Wechsel zu nachhaltiger Alternative spart ~35% CO₂.`,
        affectedCount: topGroup.length,
        co2Saving: co2,
        eurSaving: eur,
        priority: priorityFromCo2(co2, totalCo2),
        rule: "Top Scope 3 Lieferant nach EUR",
      });
    }
  }

  // Rule 4 — Fuhrpark elektrifizieren
  const dieselLines = scope1.filter((l) => categoryMatches(l, KRAFTSTOFF_KEYS));
  const dieselEur = sumEur(dieselLines);
  if (dieselEur > 5000) {
    const co2 = sumCo2(dieselLines) * 0.90;
    const eur = dieselEur * 0.30;
    measures.push({
      id: "fuhrpark",
      icon: "🔋",
      title: "Fuhrpark elektrifizieren",
      description: `${dieselLines.length} Diesel-/Kraftstoff-Buchungen mit ${dieselEur.toLocaleString("de-DE", { maximumFractionDigits: 0 })} € Volumen. E-Fuhrpark spart ~90% CO₂ und ~30% Betriebskosten.`,
      affectedCount: dieselLines.length,
      co2Saving: co2,
      eurSaving: eur,
      priority: priorityFromCo2(co2, totalCo2),
      rule: "Scope 1 Diesel > 5.000 €",
    });
  }

  // Rule 5 — Dienstreisen reduzieren
  const reiseLines = scope3.filter((l) => categoryMatches(l, REISE_KEYS));
  const reiseEur = sumEur(reiseLines);
  if (reiseEur > 2000) {
    const co2 = sumCo2(reiseLines) * 0.50;
    const eur = reiseEur * 0.30;
    measures.push({
      id: "dienstreisen",
      icon: "💻",
      title: "Dienstreisen reduzieren",
      description: `${reiseLines.length} Dienstreise-Buchungen identifiziert. Substitution durch Video-Calls spart ~50% CO₂ und ~30% Reisekosten.`,
      affectedCount: reiseLines.length,
      co2Saving: co2,
      eurSaving: eur,
      priority: priorityFromCo2(co2, totalCo2),
      rule: "Scope 3 Dienstreisen > 2.000 €",
    });
  }

  // Sort by CO2 saving descending
  return measures.sort((a, b) => b.co2Saving - a.co2Saving);
}
