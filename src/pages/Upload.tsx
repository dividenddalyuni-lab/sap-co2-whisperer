import { useState, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Database, LinkIcon, FileDigit } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { demoData, sapDemoData, datevDemoData } from "@/lib/demo-data";
import { BookingLine } from "@/lib/types";
import { formatEuro, formatTonnes, calculateEmissions } from "@/lib/co2-utils";
import { buildFallbackResponse } from "@/lib/fallback-classifier";
import SettingsDialog from "@/components/SettingsDialog";
import * as XLSX from "xlsx";

// Parse German number format: "18.450,00" → 18450.00
function parseGermanNumber(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const s = String(value).trim().replace(/[€\s\u00A0]/g, "");
  if (s.includes(",")) {
    const cleaned = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// Find first column header matching any of the given keywords (case-insensitive substring)
function findHeader(headers: string[], keywords: string[]): string | null {
  const lower = headers.map((h) => ({ raw: h, low: h.toLowerCase() }));
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    const hit = lower.find((h) => h.low.includes(k));
    if (hit) return hit.raw;
  }
  return null;
}

export default function UploadPage() {
  const { setBookingLines, startAnalysis, apiKey } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedLines, setUploadedLines] = useState<BookingLine[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const parseFile = useCallback((file: File) => {
    setError("");
    setWarnings([]);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

        if (json.length === 0) throw new Error("Keine Daten gefunden");

        const headers = Object.keys(json[0]);
        console.log("[Upload] Detected headers:", headers);
        console.log("[Upload] First 3 raw rows:", JSON.stringify(json.slice(0, 3), null, 2));

        // Robust column detection — works for SAP, DATEV, and other German/English exports
        const hKost   = findHeader(headers, ["kostenstelle", "kst", "cost", "center"]);
        const hKonto  = findHeader(headers, ["sachkonto", "konto", "account", "gl"]);
        const hText   = findHeader(headers, ["buchungstext", "beschreibung", "bezeichnung", "description", "text"]);
        const hBetrag = findHeader(headers, ["betrag", "amount", "summe", "wert", "eur"]);
        const hPer    = findHeader(headers, ["periode", "period", "monat", "month", "datum", "date"]);
        console.log("[Upload] Mapped columns:", { hKost, hKonto, hText, hBetrag, hPer });

        const newWarnings: string[] = [];
        if (!hKost)   newWarnings.push("Spalte nicht erkannt: Kostenstelle");
        if (!hKonto)  newWarnings.push("Spalte nicht erkannt: Konto");
        if (!hText)   newWarnings.push("Spalte nicht erkannt: Buchungstext");
        if (!hBetrag) newWarnings.push("Spalte nicht erkannt: Betrag");
        if (!hPer)    newWarnings.push("Spalte nicht erkannt: Periode");
        setWarnings(newWarnings);

        const lines: BookingLine[] = json.map((row, i) => ({
          id: i,
          kostenstelle: hKost ? String(row[hKost] ?? "") : "",
          konto:        hKonto ? String(row[hKonto] ?? "") : "",
          buchungstext: hText ? String(row[hText] ?? "") : "",
          betrag:       hBetrag ? parseGermanNumber(row[hBetrag]) : 0,
          periode:      hPer ? String(row[hPer] ?? "") : "",
        }));

        const sumBetrag = lines.reduce((s, l) => s + l.betrag, 0);
        console.log("[Upload] Total rows parsed:", lines.length);
        console.log("[Upload] Sum of all Betrag values:", sumBetrag);
        console.log("[Upload] First parsed row object:", lines[0]);

        if (sumBetrag === 0 && lines.length > 0) {
          console.warn("[Upload] WARNING: Betrag sum is 0 — check column mapping above");
        }

        setUploadedLines(lines);
        setBookingLines(lines);
      } catch (err) {
        console.error("[Upload] Parse error:", err);
        setError("Datei konnte nicht gelesen werden. Bitte prüfen Sie das Format.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [setBookingLines]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleLoadDemo = (source: string) => {
    const dataMap: Record<string, { data: BookingLine[]; file: string }> = {
      demo: { data: demoData, file: "demo-frosta-gmbh.xlsx" },
      sap: { data: sapDemoData, file: "sap-export-hamburg.xlsx" },
      datev: { data: datevDemoData, file: "datev-export-muenchen.csv" },
    };
    const { data, file } = dataMap[source] || dataMap.demo;
    setUploadedLines(data);
    setBookingLines(data);
    setFileName(file);
  };

  const handleStartAnalysis = () => {
    if (!uploadedLines || uploadedLines.length === 0) {
      setError("Bitte laden Sie zuerst Daten hoch.");
      return;
    }
    const useMock = !apiKey;
    startAnalysis(useMock);
  };

  // Live EEIO preview — recompute whenever uploaded data changes
  const previewLines = useMemo(() => {
    if (!uploadedLines || uploadedLines.length === 0) return [];
    const resp = buildFallbackResponse(uploadedLines);
    return calculateEmissions(uploadedLines, resp);
  }, [uploadedLines]);
  const previewTotalT = useMemo(
    () => previewLines.reduce((s, l) => s + l.t_co2, 0),
    [previewLines]
  );

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Datenimport</h1>
        <p className="text-sm text-muted-foreground mt-1">SAP Kostenstellen-Export hochladen und Analyse starten</p>
      </div>

      {/* AI API Key Options */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-sm text-primary font-medium">
          AI API Key Options
        </p>
        <div className="ml-auto">
          <SettingsDialog />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="text-sm text-warning space-y-0.5">
            {warnings.map((w) => <p key={w}>{w}</p>)}
            <p className="text-xs text-muted-foreground mt-1">Verarbeitung läuft mit den verfügbaren Spalten weiter.</p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 bg-muted/30"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".xlsx,.csv,.xls";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) parseFile(file);
          };
          input.click();
        }}
      >
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          SAP Kostenstellen-Export hochladen
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Datei hierher ziehen oder klicken zum Auswählen
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Excel (.xlsx) • CSV
        </div>
      </div>

      {/* Uploaded file info */}
      {uploadedLines && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-foreground text-sm font-medium">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              {fileName}
            </div>
            <span className="text-muted-foreground text-xs">{uploadedLines.length} Buchungszeilen</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="pb-2 pr-4 font-medium">Kostenstelle</th>
                  <th className="pb-2 pr-4 font-medium">Konto</th>
                  <th className="pb-2 pr-4 font-medium">Buchungstext</th>
                  <th className="pb-2 pr-4 font-medium text-right">Betrag €</th>
                  <th className="pb-2 font-medium">Periode</th>
                </tr>
              </thead>
              <tbody>
                {uploadedLines.slice(0, 5).map((line) => (
                  <tr key={line.id} className="text-foreground/80 border-t border-border">
                    <td className="py-1.5 pr-4">{line.kostenstelle}</td>
                    <td className="py-1.5 pr-4">{line.konto}</td>
                    <td className="py-1.5 pr-4 max-w-[200px] truncate">{line.buchungstext}</td>
                    <td className="py-1.5 pr-4 text-right">{formatEuro(line.betrag)}</td>
                    <td className="py-1.5">{line.periode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {uploadedLines.length > 5 && (
              <p className="text-muted-foreground text-xs mt-2">... und {uploadedLines.length - 5} weitere Zeilen</p>
            )}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleStartAnalysis}
          disabled={!uploadedLines}
          className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Analyse starten
        </button>
      </div>

      {/* AI Connections */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Connections</h3>
        <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Demo-Daten", icon: Database, source: "demo" },
          { label: "SAP-Connection", icon: LinkIcon, source: "sap" },
          { label: "DATEV-Connection", icon: FileDigit, source: "datev" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.source}
              onClick={() => handleLoadDemo(item.source)}
              className="flex flex-col items-center gap-2 px-4 py-4 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm"
            >
              <Icon className="w-6 h-6" />
              <span className="font-medium text-xs">{item.label}</span>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
