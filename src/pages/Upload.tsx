import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Database, LinkIcon, FileDigit } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { demoData } from "@/lib/demo-data";
import { BookingLine } from "@/lib/types";
import { formatEuro } from "@/lib/co2-utils";
import SettingsDialog from "@/components/SettingsDialog";
import * as XLSX from "xlsx";

export default function UploadPage() {
  const { setBookingLines, startAnalysis, apiKey } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedLines, setUploadedLines] = useState<BookingLine[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const parseFile = useCallback((file: File) => {
    setError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const lines: BookingLine[] = json.map((row, i) => ({
          id: i,
          kostenstelle: String(row["Kostenstelle"] || row["kostenstelle"] || ""),
          konto: String(row["Konto"] || row["konto"] || ""),
          buchungstext: String(row["Buchungstext"] || row["buchungstext"] || ""),
          betrag: Number(row["Betrag"] || row["betrag"] || row["Betrag €"] || 0),
          periode: String(row["Periode"] || row["periode"] || ""),
        }));

        if (lines.length === 0) throw new Error("Keine Daten gefunden");
        setUploadedLines(lines);
        setBookingLines(lines);
      } catch (err) {
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

  const handleLoadDemo = () => {
    setUploadedLines(demoData);
    setBookingLines(demoData);
    setFileName("demo-frosta-gmbh.xlsx");
  };

  const handleStartAnalysis = () => {
    if (!uploadedLines || uploadedLines.length === 0) {
      setError("Bitte laden Sie zuerst Daten hoch.");
      return;
    }
    const useMock = !apiKey;
    startAnalysis(useMock);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Datenimport</h1>
        <p className="text-sm text-muted-foreground mt-1">SAP Kostenstellen-Export hochladen und Analyse starten</p>
      </div>

      {/* API Key Warning */}
      {!apiKey && (
        <div className="flex items-center gap-3 px-4 py-3 bg-warning/10 border border-warning/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-sm text-warning">
            Kein Claude API Key hinterlegt — Demo-Analyse wird verwendet.{" "}
            <SettingsDialog />
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
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
        <button
          onClick={handleLoadDemo}
          className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-medium rounded-xl transition-colors text-sm"
        >
          Demo-Daten laden
        </button>
      </div>
    </div>
  );
}
