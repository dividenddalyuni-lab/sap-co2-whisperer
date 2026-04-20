import { BookingLine, ClaudeResponse, ClassifiedLine } from "./types";

interface Rule {
  kategorie: string;
  scope: 1 | 2 | 3;
  scope3_kategorie?: string;
  emissionsfaktor: number; // kg CO2 per einheit
  einheit: string;
  umrechnungsfaktor: number; // EUR per einheit (so einheiten = EUR / umrechnungsfaktor)
  quelle: string;
  konfidenz: "hoch" | "mittel" | "niedrig";
  begruendung: string;
}

const RULES: Record<string, Rule> = {
  strom: {
    kategorie: "Strom",
    scope: 2,
    emissionsfaktor: 0.380,
    einheit: "kWh",
    umrechnungsfaktor: 0.28,
    quelle: "UBA 2024 (Fallback)",
    konfidenz: "mittel",
    begruendung: "Stromverbrauch — Scope 2 Energiebezug (EUR→kWh Schätzung)",
  },
  diesel: {
    kategorie: "Diesel",
    scope: 1,
    emissionsfaktor: 2.64,
    einheit: "Liter",
    umrechnungsfaktor: 1.85,
    quelle: "UBA 2024 (Fallback)",
    konfidenz: "mittel",
    begruendung: "Kraftstoff Diesel — Scope 1 direkte Emissionen",
  },
  erdgas: {
    kategorie: "Erdgas",
    scope: 1,
    emissionsfaktor: 2.02,
    einheit: "m³",
    umrechnungsfaktor: 0.08,
    quelle: "UBA 2024 (Fallback)",
    konfidenz: "mittel",
    begruendung: "Erdgas Heizung — Scope 1 direkte Verbrennung",
  },
  spedition: {
    kategorie: "Spedition",
    scope: 3,
    scope3_kategorie: "Kategorie 4: Upstream Transport",
    emissionsfaktor: 0.0005,
    einheit: "EUR_EEIO",
    umrechnungsfaktor: 0.001,
    quelle: "GHG Protocol EEIO (Fallback)",
    konfidenz: "niedrig",
    begruendung: "Frachtkosten — EEIO-Methode mangels physischer Daten",
  },
  reisekosten: {
    kategorie: "Reisekosten",
    scope: 3,
    scope3_kategorie: "Kategorie 6: Geschäftsreisen",
    emissionsfaktor: 0.0003,
    einheit: "EUR_EEIO",
    umrechnungsfaktor: 0.001,
    quelle: "GHG Protocol EEIO (Fallback)",
    konfidenz: "niedrig",
    begruendung: "Geschäftsreisen — EEIO-Methode",
  },
  wareneinkauf: {
    kategorie: "Wareneinkauf",
    scope: 3,
    scope3_kategorie: "Kategorie 1: Eingekaufte Güter",
    emissionsfaktor: 0.0004,
    einheit: "EUR_EEIO",
    umrechnungsfaktor: 0.001,
    quelle: "GHG Protocol EEIO (Fallback)",
    konfidenz: "niedrig",
    begruendung: "Eingekaufte Güter — EEIO-Methode",
  },
  entsorgung: {
    kategorie: "Entsorgung",
    scope: 3,
    scope3_kategorie: "Kategorie 5: Abfall aus Geschäftstätigkeit",
    emissionsfaktor: 0.0006,
    einheit: "EUR_EEIO",
    umrechnungsfaktor: 0.001,
    quelle: "GHG Protocol EEIO (Fallback)",
    konfidenz: "niedrig",
    begruendung: "Abfallentsorgung — EEIO-Methode",
  },
  sonstiges: {
    kategorie: "Sonstige Beschaffung",
    scope: 3,
    scope3_kategorie: "Kategorie 1: Eingekaufte Güter",
    emissionsfaktor: 0.0003,
    einheit: "EUR_EEIO",
    umrechnungsfaktor: 0.001,
    quelle: "GHG Protocol EEIO (Fallback)",
    konfidenz: "niedrig",
    begruendung: "Sonstige Beschaffung — EEIO-Methode (Default)",
  },
};

function classifyLine(line: BookingLine): Rule {
  const konto = (line.konto || "").trim();
  const text = (line.buchungstext || "").toLowerCase();

  const hasKw = (...kws: string[]) => kws.some((k) => text.includes(k));
  const kontoStarts = (...prefixes: string[]) => prefixes.some((p) => konto.startsWith(p));

  // Strom — accounts 40000, 40100, 4200, 401, 400
  if (kontoStarts("40000", "40010", "40100", "4010", "4001", "4000", "4200") || hasKw("strom", "stromrechnung", "stadtwerke", "enercity", "rechenzentrum", "kühlhaus", "kälteanlagen", "kaelteanlagen", "kühl")) {
    if (hasKw("gas", "erdgas")) return RULES.erdgas;
    return RULES.strom;
  }
  // Erdgas / Gas / Wärme — 65100, 4210, 400100, 400200
  if (kontoStarts("65100", "6510", "4210", "40010", "40020") || hasKw("erdgas", "gas ", "gasverbrauch", "fernwärme", "fernwaerme", "heizung", "wärme", "waerme")) {
    return RULES.erdgas;
  }
  // Diesel / Kraftstoff — 58000, 580000, 4500, 4510
  if (kontoStarts("58000", "5800", "4500", "4510") || hasKw("diesel", "tank", "kraftstoff", "adblue", "benzin", "shell", "aral")) {
    return RULES.diesel;
  }
  // Spedition / Fracht — 58100
  if (kontoStarts("58100", "5810") || hasKw("spedition", "fracht", "schenker", "transport", "logistik")) {
    return RULES.spedition;
  }
  // Reisekosten — 65000, 650, 4520, 4700
  if (kontoStarts("65000", "6500", "4520", "4700") || hasKw("dienstreise", "reise", "lufthansa", "bahncard", "flug", "bahn", "pendler")) {
    return RULES.reisekosten;
  }
  // Entsorgung — 68000, 750, 7500
  if (kontoStarts("68000", "6800", "75000", "7500") || hasKw("entsorgung", "abfall", "remondis", "müll", "muell")) {
    return RULES.entsorgung;
  }
  // Wareneinkauf — 70000, 70100, 700, 7000
  if (kontoStarts("70000", "70100", "7000", "7010", "700")) {
    return RULES.wareneinkauf;
  }
  if (hasKw("rohwaren", "rohstoff", "verpackung", "lieferant", "wareneinkauf", "kartonage", "material")) {
    return RULES.wareneinkauf;
  }
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
      emissionsfaktor: rule.emissionsfaktor,
      einheit: rule.einheit,
      umrechnungsfaktor: rule.umrechnungsfaktor,
      quelle: rule.quelle,
      konfidenz: rule.konfidenz,
      status: rule.konfidenz === "hoch" ? "ok" : rule.konfidenz === "mittel" ? "ok" : "pruefen",
      begruendung: rule.begruendung,
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

  const lowConfCount = zeilen.filter((z) => z.konfidenz === "niedrig").length;
  const score = Math.max(45, Math.min(85, Math.round(85 - (lowConfCount / Math.max(zeilen.length, 1)) * 40)));

  return {
    zeilen,
    anomalien,
    datenqualitaet: {
      score,
      fehlende_scopes: [
        "Scope 3 Kategorie 11: Nutzung verkaufter Produkte",
        "Scope 3 Kategorie 12: End-of-Life",
        "Scope 2: Marktbasierte Methode",
      ],
      empfehlungen: [
        "Claude API-Key hinterlegen für präzisere KI-Klassifikation",
        "Stromverbrauch in kWh direkt aus Rechnung erfassen",
        "Lieferantendaten für Scope 3 Kategorie 1 anfordern",
        "Tankquittungen für genauere Diesel-Mengen nutzen",
      ],
    },
  };
}
