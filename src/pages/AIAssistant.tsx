import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Send } from "lucide-react";

const quickActions = [
  "Warum ist mein EBITDA gesunken?",
  "Scope-3-Emissionen?",
  "CO₂-Neutralität — Prognose",
  "Kosten ohne GreenSight?",
];

export default function AIAssistantPage() {
  const { bookingLines } = useApp();
  const [input, setInput] = useState("");

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted-foreground">GreenSight ESG / <span className="font-semibold text-foreground">KI-Assistent</span></p>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Frosta GmbH</span>
          <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Geschäftsjahr 2024</span>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">FK</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 space-y-6">
        {/* Assistant Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">GS</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">GreenSight KI-Assistent</p>
                <p className="text-xs text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Verbunden · SAP FICO-Daten geladen
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Frosta GmbH · GJ 2024 · {bookingLines.length > 0 ? `${bookingLines.length} Buchungen` : "47.384 Buchungen"}</p>
            </div>
          </div>
        </div>

        {/* Initial Message */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">GS</div>
          <div className="flex-1 bg-card border border-border rounded-xl p-5 text-sm text-foreground/90 space-y-3">
            <p>
              Guten Tag. Die SAP FICO-Daten der Frosta GmbH wurden vollständig eingelesen — <strong>{bookingLines.length > 0 ? `${bookingLines.length} Buchungen` : "47.384 Buchungen"}</strong>, Zeitraum Januar bis September 2024.
            </p>
            <p>
              Die automatische Analyse hat <strong>3 Buchungsanomalien</strong> sowie <strong>262 t unerwartete CO₂-Emissionen</strong> identifiziert, die den CSRD-Report beeinflussen.
            </p>
            <p>
              Welche Kennzahl oder Buchungsposition möchten Sie analysieren?
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-6 mb-3">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => setInput(action)}
            className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frage zu Buchungen, Emissionen oder CSRD eingeben ..."
          className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button className="px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Send className="w-4 h-4" />
          Absenden
        </button>
      </div>
    </div>
  );
}
