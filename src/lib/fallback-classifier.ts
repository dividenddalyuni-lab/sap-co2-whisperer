import { BookingLine, ClaudeResponse, ClassifiedLine } from "./types";

interface EeioRule {
  kategorie: string;
  scope: 1 | 2 | 3;
  scope3_kategorie?: string;
  faktor: number; // kg CO2e per EUR (Spend-Based EEIO)
  quelle: string;
}

// Single source of truth: Spend-Based EEIO factors in kg CO2e / EUR.
// Formula (applied in calculateEmissions): t CO2e = Betrag (€) × Faktor (kg/€) ÷ 1000
// Scope 1 & 2 factors are pre-converted EEIO-equivalents (activity factor × avg. price)
// so the same formula works for ALL lines.
const RULES: Record<string, EeioRule> = {
  strom:        { kategorie: "Strom",            scope: 2, faktor: 1.36, quelle: "UBA 2024" },
  fernwaerme:   { kategorie: "Fernwärme",        scope: 2, faktor: 1.80, quelle: "UBA 2024" },
  kraftstoff:   { kategorie: "Kraftstoff",       scope: 1, faktor: 1.43, quelle: "DEFRA 2024" },
  erdgas:       { kategorie: "Erdgas",           scope: 1, faktor: 2.53, quelle: "UBA 2024" },
  transport_str:{ kategorie: "Transport Straße", scope: 3, scope3_kategorie: "Kategorie 4: Upstream Transport",  faktor: 0.50, quelle: "GHG Protocol EEIO" },
  transport_see:{ kategorie: "Transport See",    scope: 3, scope3_kategorie: "Kategorie 4: Upstream Transport",  faktor: 0.30, quelle: "GHG Protocol EEIO" },
  transport_luft:{kategorie: "Transport Luft",   scope: 3, scope3_kategorie: "Kategorie 4: Upstream Transport",  faktor: 1.20, quelle: "GHG Protocol EEIO" },
  dienstreisen: { kategorie: "Dienstreisen",     scope: 3, scope3_kategorie: "Kategorie 6: Geschäftsreisen",     faktor: 0.30, quelle: "GHG Protocol EEIO" },
  verpackung:   { kategorie: "Verpackung",       scope: 3, scope3_kategorie: "Kategorie 1: Eingekaufte Güter",   faktor: 0.40, quelle: "GHG Protocol EEIO" },
  rohwaren:     { kategorie: "Rohwaren",         scope: 3, scope3_kategorie: "Kategorie 1: Eingekaufte Güter",   faktor: 0.60, quelle: "GHG Protocol EEIO" },
  abfall:       { kategorie: "Abfall",           scope: 3, scope3_kategorie: "Kategorie 5: Abfall",              faktor: 0.60, quelle: "GHG Protocol EEIO" },
  wasser:       { kategorie: "Wasser",           scope: 3, scope3_kategorie: "Kategorie 1: Eingekaufte Güter",   faktor: 0.40, quelle: "GHG Protocol EEIO" },
  sonstiges:    { kategorie: "Sonstige",         scope: 3, scope3_kategorie: "Kategorie 1: Eingekaufte Güter",   faktor: 0.30, quelle: "GHG Protocol EEIO" },
};

function kontoIn(konto: string, from: number, to: number): boolean {
  const n = parseInt(konto.replace(/\D/g, "").slice(0, 5), 10);
  return Number.isFinite(n) && n >= from && n <= to;
}

function classifyLine(line: BookingLine): EeioRule {
  const konto = (line.konto || "").trim();
  const text = (line.buchungstext || "").toLowerCase();
  const has = (...kws: string[]) => kws.some((k) => text.includes(k));

  // Priority 1: account number ranges
  if (kontoIn(konto, 40000, 40199)) return RULES.strom;
  if (kontoIn(konto, 40200, 40299)) return RULES.fernwaerme;
  if (kontoIn(konto, 42000, 42099)) return RULES.wasser;
  if (kontoIn(konto, 58000, 58099)) return RULES.kraftstoff;
  if (kontoIn(konto, 58100, 58299)) return RULES.transport_str;
  if (kontoIn(konto, 58300, 58499)) return RULES.transport_see;
  if (kontoIn(konto, 58500, 58699)) return RULES.transport_luft;
  if (kontoIn(konto, 65000, 65099)) return RULES.dienstreisen;
  if (kontoIn(konto, 65100, 65199)) return RULES.erdgas;
  if (kontoIn(konto, 68000, 68999)) return RULES.abfall;
  if (kontoIn(konto, 70000, 70099)) return RULES.verpackung;
  if (kontoIn(konto, 70100, 70299)) return RULES.rohwaren;

  // Priority 2: keywords in booking text
  if (has("strom", "energie", "electric")) return RULES.strom;
  if (has("fernwärme", "fernwaerme", "wärme", "waerme")) return RULES.fernwaerme;
  if (has("erdgas", "heizung", "gas ")) return RULES.erdgas;
  if (has("diesel", "kraftstoff", "benzin", "tank")) return RULES.kraftstoff;
  if (has("seefracht", "schiff", "container")) return RULES.transport_see;
  if (has("luftfracht", "airfreight", "luftfracht")) return RULES.transport_luft;
  if (has("spedition", "transport", "fracht", "lkw", "logistik")) return RULES.transport_str;
  if (has("reise", "flug", "lufthansa", "bahn", "hotel", "dienstreise")) return RULES.dienstreisen;
  if (has("verpackung", "karton", "folie", "kartonage")) return RULES.verpackung;
  if (has("rohwaren", "rohstoff", "lebensmittel", "seafood", "fisch")) return RULES.rohwaren;
  if (has("entsorgung", "abfall", "müll", "muell", "recycling")) return RULES.abfall;
  if (has("wasser", "wasserversorgung")) return RULES.wasser;

  return RULES.sonstiges;
}

export function buildFallbackResponse(bookingLines: BookingLine[]): ClaudeResponse {
  const zeilen: ClassifiedLine[] = bookingLines.map((line) => {
    const rule = classifyLine(line);
    return {
      zeile_id: line.id,
      kategorie: rule.kategorie,
      scope: rule.scope,
      scope3_kategorie: rule.scope3_kategorie,
      emissionsfaktor: rule.faktor, // kg CO2e / EUR
      einheit: "EUR_EEIO",
      umrechnungsfaktor: 1,         // identity: betrag stays in EUR
      quelle: rule.quelle,
      konfidenz: "mittel",
      status: "ok",
      begruendung: `Spend-Based EEIO: ${rule.faktor} kg CO₂e/€ (${rule.quelle})`,
    };
  });

  // Anomalies: top 3 highest amounts
  const sorted = [...bookingLines].sort((a, b) => b.betrag - a.betrag);
  const anomalien = sorted.slice(0, Math.min(3, sorted.length)).map((l) => ({
    zeile_id: l.id,
    typ: "hoher_betrag",
    nachricht: `${l.buchungstext}: Betrag ${l.betrag.toLocaleString("de-DE")} € auffällig hoch`,
    empfehlung: "Lieferantenspezifische Emissionsdaten anfordern",
  }));

  // Data quality score: pure EEIO ⇒ baseline ~70 (good methodology coverage, low granularity)
  const score = bookingLines.length === 0 ? 0 : 72;

  return {
    zeilen,
    anomalien,
    datenqualitaet: {
      score,
      fehlende_scopes: [
        "Scope 3 Kategorie 11: Nutzung verkaufter Produkte",
        "Scope 3 Kategorie 12: End-of-Life behandelter Produkte",
        "Scope 2: Marktbasierte Methode (aktuell nur EEIO-Schätzung)",
      ],
      empfehlungen: [
        "Stromverbrauch in kWh direkt aus Rechnungen erfassen für Aktivitätsdaten-Methode",
        "Lieferantenspezifische Emissionsfaktoren für Scope 3 Kategorie 1 anfordern",
        "Tankquittungen mit Litermengen für genauere Diesel-Bilanzierung nutzen",
        "Claude API-Key hinterlegen für KI-gestützte Anomalie-Erkennung",
      ],
    },
  };
}
