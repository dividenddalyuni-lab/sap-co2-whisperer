import { BookingLine, ClaudeResponse } from "./types";

export const demoData: BookingLine[] = [
  { id: 0, kostenstelle: "1000 Produktion", konto: "40000", buchungstext: "Stromrechnung Stadtwerke Bremerhaven Januar", betrag: 18450, periode: "Jan 2024" },
  { id: 1, kostenstelle: "1000 Produktion", konto: "40000", buchungstext: "Stromrechnung Stadtwerke Bremerhaven Februar", betrag: 17200, periode: "Feb 2024" },
  { id: 2, kostenstelle: "2000 Kältelager", konto: "40100", buchungstext: "Strom Kälteanlagen Q1 enercity", betrag: 24300, periode: "Q1 2024" },
  { id: 3, kostenstelle: "3000 Logistik", konto: "58000", buchungstext: "Diesel Fuhrpark GmbH Januar", betrag: 8200, periode: "Jan 2024" },
  { id: 4, kostenstelle: "3000 Logistik", konto: "58100", buchungstext: "Spedition Kowalski Transport Polen Februar", betrag: 12400, periode: "Feb 2024" },
  { id: 5, kostenstelle: "3000 Logistik", konto: "58100", buchungstext: "DB Schenker Frachtkosten Februar", betrag: 9800, periode: "Feb 2024" },
  { id: 6, kostenstelle: "4000 Verwaltung", konto: "65000", buchungstext: "Lufthansa Dienstreise Berlin LH4521 Müller", betrag: 1240, periode: "Jan 2024" },
  { id: 7, kostenstelle: "4000 Verwaltung", konto: "65100", buchungstext: "Erdgas Heizung Verwaltungsgebäude Januar", betrag: 3400, periode: "Jan 2024" },
  { id: 8, kostenstelle: "5000 Einkauf", konto: "70000", buchungstext: "Lieferant Verpackungsmaterial Schulz GmbH", betrag: 45000, periode: "Q1 2024" },
  { id: 9, kostenstelle: "5000 Einkauf", konto: "70100", buchungstext: "Rohwaren Import Südamerika Seafood", betrag: 128000, periode: "Q1 2024" },
];

export const mockClaudeResponse: ClaudeResponse = {
  zeilen: [
    { zeile_id: 0, kategorie: "Strom", scope: 2, emissionsfaktor: 0.380, einheit: "kWh", umrechnungsfaktor: 0.28, quelle: "UBA 2024", konfidenz: "hoch", status: "ok", begruendung: "Stromrechnung Stadtwerke, Scope 2 Energiebezug" },
    { zeile_id: 1, kategorie: "Strom", scope: 2, emissionsfaktor: 0.380, einheit: "kWh", umrechnungsfaktor: 0.28, quelle: "UBA 2024", konfidenz: "hoch", status: "ok", begruendung: "Stromrechnung Stadtwerke, Scope 2 Energiebezug" },
    { zeile_id: 2, kategorie: "Strom", scope: 2, emissionsfaktor: 0.380, einheit: "kWh", umrechnungsfaktor: 0.28, quelle: "UBA 2024", konfidenz: "hoch", status: "ok", begruendung: "Strom Kälteanlagen, Scope 2 Energiebezug" },
    { zeile_id: 3, kategorie: "Diesel", scope: 1, emissionsfaktor: 2.650, einheit: "Liter", umrechnungsfaktor: 1.50, quelle: "UBA 2024", konfidenz: "hoch", status: "ok", begruendung: "Diesel Fuhrpark, Scope 1 direkte Emissionen" },
    { zeile_id: 4, kategorie: "Spedition_Strasse", scope: 3, scope3_kategorie: "Kategorie 4: Upstream Transport", emissionsfaktor: 0.120, einheit: "EUR_EEIO", umrechnungsfaktor: 1, quelle: "GHG Protocol EEIO", konfidenz: "mittel", status: "pruefen", begruendung: "Spedition Transport, EEIO-Methode mangels physischer Daten" },
    { zeile_id: 5, kategorie: "Spedition_Strasse", scope: 3, scope3_kategorie: "Kategorie 4: Upstream Transport", emissionsfaktor: 0.120, einheit: "EUR_EEIO", umrechnungsfaktor: 1, quelle: "GHG Protocol EEIO", konfidenz: "mittel", status: "ok", begruendung: "DB Schenker Frachtkosten, EEIO-Methode" },
    { zeile_id: 6, kategorie: "Flug", scope: 3, scope3_kategorie: "Kategorie 6: Geschäftsreisen", emissionsfaktor: 0.230, einheit: "km", umrechnungsfaktor: 0.25, quelle: "DEFRA 2024", konfidenz: "mittel", status: "ok", begruendung: "Lufthansa Dienstreise, Scope 3 Geschäftsreisen" },
    { zeile_id: 7, kategorie: "Erdgas", scope: 1, emissionsfaktor: 0.201, einheit: "kWh", umrechnungsfaktor: 0.065, quelle: "UBA 2024", konfidenz: "hoch", status: "ok", begruendung: "Erdgas Heizung, Scope 1 direkte Verbrennung" },
    { zeile_id: 8, kategorie: "Verpackung", scope: 3, scope3_kategorie: "Kategorie 1: Eingekaufte Güter", emissionsfaktor: 0.080, einheit: "EUR_EEIO", umrechnungsfaktor: 1, quelle: "GHG Protocol EEIO", konfidenz: "mittel", status: "pruefen", begruendung: "Verpackungsmaterial, EEIO-Methode — materialspezifische Daten empfohlen" },
    { zeile_id: 9, kategorie: "Rohwaren", scope: 3, scope3_kategorie: "Kategorie 1: Eingekaufte Güter", emissionsfaktor: 0.150, einheit: "EUR_EEIO", umrechnungsfaktor: 1, quelle: "GHG Protocol EEIO", konfidenz: "niedrig", status: "pruefen", begruendung: "Rohwaren Import Südamerika, hoher Betrag — lieferantenspezifische Daten anfordern" },
  ],
  anomalien: [
    { zeile_id: 9, typ: "hoher_betrag", nachricht: "Rohwaren Import Südamerika: Betrag 128.000 € ist ungewöhnlich hoch", empfehlung: "Lieferantenspezifische Emissionsdaten anfordern" },
    { zeile_id: -1, typ: "scope_verteilung", nachricht: "Scope 3 Kategorie 1 (Eingekaufte Güter) dominiert mit ca. 78 % — Lieferantendaten empfohlen", empfehlung: "Primärdaten von Hauptlieferanten anfordern für genauere Bilanzierung" },
    { zeile_id: 4, typ: "niedrige_konfidenz", nachricht: "Spedition Kowalski: EEIO-Methode weniger genau, tkm-Daten empfohlen", empfehlung: "Transportdienstleister nach Tonnenkilometer-Daten fragen" },
  ],
  datenqualitaet: {
    score: 72,
    fehlende_scopes: [
      "Scope 3 Kategorie 11: Nutzung verkaufter Produkte",
      "Scope 3 Kategorie 12: Umgang mit verkauften Produkten am Ende der Lebensdauer",
      "Scope 2: Marktbasierte Methode (nur standortbasiert vorhanden)",
    ],
    empfehlungen: [
      "Lieferantendaten für Scope 3 Kategorie 1 anfordern",
      "Stromverbrauch in kWh direkt aus Rechnung erfassen statt EUR-basiert",
      "Scope 2 marktbasierte Emissionsfaktoren vom Energieversorger anfordern",
      "Fuhrpark: Tankquittungen für genauere Diesel-Mengen nutzen",
    ],
  },
};
