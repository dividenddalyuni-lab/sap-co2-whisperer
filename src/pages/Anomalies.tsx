import { useApp } from "@/context/AppContext";
import { formatNumber } from "@/lib/co2-utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

const anomalyData = [
  {
    id: "FI-2024-09-4821",
    date: "14. September 2024",
    title: "Stadtwerke Bremerhaven",
    category: "Strom · Scope 2",
    betrag: 48200,
    deviation: "+340 %",
    deviationDetail: "Ø € 11.000",
    co2Impact: "+ 189 t CO₂e",
    status: "Kritisch",
    statusColor: "text-destructive",
    deviationColor: "text-destructive",
  },
  {
    id: "FI-2024-08-3317",
    date: "22. August 2024",
    title: "Logistik Nord GmbH",
    category: "Transport · Scope 3",
    betrag: 12500,
    deviation: "Duplikat",
    deviationDetail: "×2",
    co2Impact: "+ 31 t CO₂e",
    status: "Prüfung",
    statusColor: "text-warning",
    deviationColor: "text-warning",
  },
  {
    id: "FI-2024-Q3-9941",
    date: "Q3 2024 gesamt",
    title: "Reisekosten Vertrieb",
    category: "Dienstreisen · Scope 3",
    betrag: 34800,
    deviation: "+180 %",
    deviationDetail: "Ø € 12.400",
    co2Impact: "+ 42 t CO₂e",
    status: "Prüfung",
    statusColor: "text-warning",
    deviationColor: "text-destructive",
  },
  {
    id: "FI-2024-07-2208",
    date: "5. Juli 2024",
    title: "Kältetechnik Wagner",
    category: "Wartung · Scope 1",
    betrag: 8750,
    deviation: "Normal",
    deviationDetail: "",
    co2Impact: "+ 12 t CO₂e",
    status: "Freigegeben",
    statusColor: "text-primary",
    deviationColor: "text-muted-foreground",
  },
];

const monthlyAnomalies = [
  { name: "Jan", value: 1 }, { name: "Feb", value: 0 }, { name: "Mär", value: 1 },
  { name: "Apr", value: 0 }, { name: "Mai", value: 2 }, { name: "Jun", value: 0 },
  { name: "Jul", value: 1 }, { name: "Aug", value: 2 }, { name: "Sep", value: 3 },
];

export default function AnomaliesPage() {
  const { claudeResponse } = useApp();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">CLYMAIQ ESG / <span className="font-semibold text-foreground">Anomalie-Erkennung</span></p>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Muster GmbH</span>
          <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Geschäftsjahr 2024</span>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">FK</div>
        </div>
      </div>

      {/* Anomaly Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Buchungsanalyse — Anomalie-Übersicht</h3>
          <p className="text-xs text-muted-foreground">47.384 Buchungen geprüft · KI-gestützte Mustererkennung</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="px-5 py-3 text-left font-semibold">Buchungsnummer</th>
                <th className="px-5 py-3 text-left font-semibold">Konto / Kategorie</th>
                <th className="px-5 py-3 text-right font-semibold">Betrag (€)</th>
                <th className="px-5 py-3 text-center font-semibold">Abweichung</th>
                <th className="px-5 py-3 text-left font-semibold">CO₂-Auswirkung</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {anomalyData.map((a) => (
                <tr key={a.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-xs font-mono text-muted-foreground">{a.id}</p>
                    <p className="text-xs text-muted-foreground">{a.date}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-primary">{a.category}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="font-semibold">{formatNumber(a.betrag, 2)}</p>
                    {a.deviationDetail && a.deviation !== "Duplikat" && a.deviation !== "Normal" && (
                      <p className="text-xs text-muted-foreground">{a.deviationDetail}</p>
                    )}
                    {a.deviation === "Duplikat" && <p className="text-xs text-muted-foreground">×2</p>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      a.deviation === "Normal" ? "border-border text-muted-foreground" :
                      a.deviation === "Duplikat" ? "border-warning/30 bg-warning/10 text-warning" :
                      "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}>{a.deviation}</span>
                    {a.deviationDetail && a.deviation !== "Duplikat" && a.deviation !== "Normal" && (
                      <p className="text-xs text-muted-foreground mt-0.5">{a.deviationDetail}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-primary font-medium text-xs">{a.co2Impact}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-xs font-semibold ${a.statusColor}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-5 gap-4">
        {/* KI Analysis */}
        <div className="col-span-3 bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">KI-Analyse: Buchung FI-2024-09-4821</h3>
          <div className="space-y-4 text-sm text-foreground/90">
            <p>
              Die Analyse der Buchung <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">FI-2024-09-4821</code> ergibt eine Abweichung von <strong>+340 %</strong> gegenüber dem 12-Monats-Durchschnitt von € 11.000.
            </p>
            <div>
              <p className="font-semibold mb-1">Wahrscheinliche Ursachen</p>
              <p className="text-muted-foreground">Nachabrechnung für Q2/Q3 · Produktionserweiterung · Messtechnischer Fehler der Stadtwerke</p>
            </div>
            <div>
              <p className="font-semibold mb-1">CO₂-Auswirkung auf den CSRD-Report</p>
              <p className="text-muted-foreground">Die Buchung entspricht ca. <span className="text-primary font-semibold">189 t CO₂e (Scope 2)</span> und verfälscht den Emissionsausweis</p>
            </div>
          </div>
        </div>

        {/* Anomalies by Month */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Anomalien nach Monat</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyAnomalies}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
