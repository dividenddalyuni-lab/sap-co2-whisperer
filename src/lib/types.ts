export interface BookingLine {
  id: number;
  kostenstelle: string;
  konto: string;
  buchungstext: string;
  betrag: number;
  periode: string;
}

export interface ClassifiedLine {
  zeile_id: number;
  kategorie: string;
  scope: 1 | 2 | 3;
  scope3_kategorie?: string;
  emissionsfaktor: number;
  einheit: string;
  umrechnungsfaktor: number;
  quelle: string;
  konfidenz: "hoch" | "mittel" | "niedrig";
  status: "ok" | "pruefen" | "fehler";
  begruendung: string;
}

export interface Anomalie {
  zeile_id: number;
  typ: string;
  nachricht: string;
  empfehlung: string;
}

export interface Datenqualitaet {
  score: number;
  fehlende_scopes: string[];
  empfehlungen: string[];
}

export interface ClaudeResponse {
  zeilen: ClassifiedLine[];
  anomalien: Anomalie[];
  datenqualitaet: Datenqualitaet;
}

export interface CalculatedLine extends ClassifiedLine {
  original: BookingLine;
  einheiten: number;
  kg_co2: number;
  t_co2: number;
}

export type AppScreen = "upload" | "analysis" | "dashboard" | "csrd-report" | "anomalies" | "ai-assistant";
