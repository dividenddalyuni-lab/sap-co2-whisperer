import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Leaf, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen bg-[hsl(155,35%,10%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">GreenSight</h1>
            <p className="text-[10px] text-white/40 tracking-widest uppercase">ESG Platform</p>
          </div>
        </div>
        <SettingsDialog />
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-8 pb-16">
        <div className="w-full max-w-2xl space-y-6">
          {/* API Key Warning */}
          {!apiKey && (
            <div className="flex items-center gap-3 px-4 py-3 bg-warning/10 border border-warning/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-warning shrink-0" />
              <p className="text-sm text-warning">
                Kein Claude API Key hinterlegt — Demo-Analyse wird verwendet.
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
                : "border-white/20 hover:border-white/40 bg-white/5"
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
            <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              SAP Kostenstellen-Export hochladen
            </h2>
            <p className="text-white/50 text-sm mb-4">
              Datei hierher ziehen oder klicken zum Auswählen
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs text-white/60">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel (.xlsx) • CSV
            </div>
          </div>

          {/* Uploaded file info */}
          {uploadedLines && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  {fileName}
                </div>
                <span className="text-white/50 text-xs">{uploadedLines.length} Buchungszeilen</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/40 text-left">
                      <th className="pb-2 pr-4 font-medium">Kostenstelle</th>
                      <th className="pb-2 pr-4 font-medium">Konto</th>
                      <th className="pb-2 pr-4 font-medium">Buchungstext</th>
                      <th className="pb-2 pr-4 font-medium text-right">Betrag €</th>
                      <th className="pb-2 font-medium">Periode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedLines.slice(0, 5).map((line) => (
                      <tr key={line.id} className="text-white/70 border-t border-white/5">
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
                  <p className="text-white/30 text-xs mt-2">... und {uploadedLines.length - 5} weitere Zeilen</p>
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
              className="px-6 py-3 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium rounded-xl transition-colors text-sm"
            >
              Demo-Daten laden
            </button>
          </div>

          {/* Footer badges */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Powered by Claude AI</span>
            <span className="text-white/10">•</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">GHG Protocol</span>
            <span className="text-white/10">•</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">CSRD / ESRS E1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
