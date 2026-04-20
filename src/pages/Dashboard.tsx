import { useApp } from "@/context/AppContext";
import { formatTonnes, formatNumber, scopeTotal, qualityColor, formatEuro } from "@/lib/co2-utils";
import { AlertTriangle, TrendingDown, ArrowDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

const SCOPE_COLORS = ["hsl(152, 60%, 36%)", "hsl(38, 92%, 50%)", "hsl(220, 60%, 55%)"];

const savingsMeasures = [
  { icon: "⚡", title: "Ökostrom Umstellung", description: "Scope 2 eliminieren · Einsparung", savingsEur: 84000, savingsCo2: 960 },
  { icon: "🚛", title: "Logistikroute optimieren", description: "Lieferant Nordsee Logistik · Einsparung", savingsEur: 12000, savingsCo2: 120 },
  { icon: "♻️", title: "Lieferant wechseln", description: "Verpackung Müller GmbH → GreenPack · Einsparung", savingsEur: 8000, savingsCo2: 340 },
];

const monthlyData = [
  { name: "Jan", value: 320 }, { name: "Feb", value: 290 }, { name: "Mär", value: 340 },
  { name: "Apr", value: 310 }, { name: "Mai", value: 280 }, { name: "Jun", value: 300 },
  { name: "Jul", value: 350 }, { name: "Aug", value: 330 }, { name: "Sep", value: 180 },
  { name: "Okt", value: 310 }, { name: "Nov", value: 320 }, { name: "Dez", value: 315 },
];

export default function DashboardPage() {
  const { calculatedLines, claudeResponse, bookingLines, setScreen } = useApp();

  if (!claudeResponse) return null;

  const s1 = scopeTotal(calculatedLines, 1);
  const s2 = scopeTotal(calculatedLines, 2);
  const s3 = scopeTotal(calculatedLines, 3);
  const total = s1 + s2 + s3;
  const quality = claudeResponse.datenqualitaet;
  const totalBetrag = bookingLines.reduce((sum, l) => sum + l.betrag, 0);

  const totalSavingsCo2 = savingsMeasures.reduce((a, m) => a + m.savingsCo2, 0);
  const totalSavingsEur = savingsMeasures.reduce((a, m) => a + m.savingsEur, 0);

  const pieData = [
    { name: "Scope 1", value: s1 },
    { name: "Scope 2", value: s2 },
    { name: "Scope 3", value: s3 },
  ];

  const sumByCategory = (cats: string[]) =>
    calculatedLines
      .filter((l) => cats.includes(l.kategorie))
      .reduce((s, l) => s + l.original.betrag, 0);

  const stromCost = sumByCategory(["Strom", "Fernwärme"]);
  const erdgasCost = sumByCategory(["Erdgas"]);
  const kraftstoffCost = sumByCategory(["Kraftstoff"]);
  const energyTotal = stromCost + erdgasCost + kraftstoffCost;

  const energyCosts = [
    { label: "Strom / Fernwärme", value: stromCost, color: "hsl(152, 60%, 36%)" },
    { label: "Erdgas / Wärme", value: erdgasCost, color: "hsl(152, 60%, 36%)" },
    { label: "Kraftstoffe", value: kraftstoffCost, color: "hsl(38, 92%, 50%)" },
  ];

  const anomalies = [
    { title: "Stadtwerke Bremerhaven", detail: "Sep 2024 · Buchung FI-4821", badge: "+340 %", badgeColor: "text-destructive" },
    { title: "Doppelbuchung Logistik", detail: "Aug 2024 · € 12.500", badge: "Duplikat", badgeColor: "text-warning" },
    { title: "Reisekosten Q3", detail: "Q3 2024 gesamt", badge: "+180 %", badgeColor: "text-destructive" },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">CLYMAIQ ESG / <span className="font-semibold text-foreground">Dashboard</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Muster GmbH</span>
            <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Geschäftsjahr 2024</span>
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">FK</div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">CO₂ Scope 3 — Lieferkette</p>
            <p className="text-3xl font-extrabold text-foreground">{formatTonnes(s3)} t</p>
            <p className="text-xs text-primary flex items-center gap-1 mt-2"><ArrowDown className="w-3 h-3" /> −8,2 % vs. 2023</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-3"><div className="h-full bg-primary rounded-full" style={{ width: "65%" }} /></div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">CO₂-Sparpotenzial</p>
            <p className="text-3xl font-extrabold text-foreground">{formatNumber(totalSavingsCo2, 0)} t</p>
            <p className="text-xs text-primary flex items-center gap-1 mt-2"><ArrowDown className="w-3 h-3" /> € {formatNumber(totalSavingsEur, 0)}/Jahr KI-Empfehlungen</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-3"><div className="h-full bg-primary rounded-full" style={{ width: "45%" }} /></div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">CO₂-Emissionen Scope 1+2</p>
            <p className="text-3xl font-extrabold text-foreground">{formatTonnes(s1 + s2)} t</p>
            <p className="text-xs text-primary flex items-center gap-1 mt-2"><ArrowDown className="w-3 h-3" /> −12,0 % vs. 2023</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-3"><div className="h-full bg-primary rounded-full" style={{ width: "72%" }} /></div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">CSRD-Bereitschaft</p>
            <p className="text-3xl font-extrabold text-foreground">{quality.score} %</p>
            <p className="text-xs text-warning flex items-center gap-1 mt-2"><AlertTriangle className="w-3 h-3" /> {quality.fehlende_scopes.length} Datenlücken</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-3"><div className="h-full bg-primary rounded-full" style={{ width: `${quality.score}%` }} /></div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Monthly trend */}
          <div className="col-span-3 bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-1">CO₂-Emissionen 2024 — Monatsverlauf</h3>
            <p className="text-xs text-muted-foreground mb-4">in t CO₂e — automatisch aus SAP FICO berechnet</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v + " t", "CO₂e"]} />
                <Area type="monotone" dataKey="value" stroke="hsl(152, 60%, 36%)" fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 px-3 py-2 bg-warning/5 border-l-2 border-warning rounded text-xs text-muted-foreground">
              September-Rückgang erkannt — <button onClick={() => setScreen("ai-assistant")} className="text-primary font-medium hover:underline">KI-Analyse öffnen →</button>
            </div>
          </div>

          {/* Scope Pie */}
          <div className="col-span-2 bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-1">CO₂-Emissionen nach Scope</h3>
            <p className="text-xs text-muted-foreground mb-4">Geschäftsjahr 2024 · t CO₂e</p>
            <div className="flex items-center gap-6">
              <div className="w-36 h-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} strokeWidth={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={SCOPE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold">{formatTonnes(total)}</span>
                  <span className="text-[9px] text-muted-foreground">t CO₂e gesamt</span>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: SCOPE_COLORS[0] }} />
                    <span className="font-semibold">Scope 1 — Direkte Emissionen</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">{formatTonnes(s1)} t · {total > 0 ? formatNumber(s1 / total * 100, 1) : 0} %</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: SCOPE_COLORS[1] }} />
                    <span className="font-semibold">Scope 2 — Energiebezug</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">{formatTonnes(s2)} t · {total > 0 ? formatNumber(s2 / total * 100, 1) : 0} %</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: SCOPE_COLORS[2] }} />
                    <span className="font-semibold">Scope 3 — Lieferkette</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">{formatTonnes(s3)} t · {total > 0 ? formatNumber(s3 / total * 100, 1) : 0} %</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Energy Costs, KI-Sparpotenzial, Anomalies */}
        <div className="grid grid-cols-3 gap-4">
          {/* Energiekosten */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Energiekosten 2024</h3>
            <p className="text-3xl font-extrabold text-foreground mb-1">€ {formatNumber(totalBetrag / 1000000, 2)} Mio.</p>
            <p className="text-xs text-muted-foreground mb-5">entspricht ca. {formatNumber(total * 1000, 0)} t CO₂e</p>
            {energyCosts.map((item, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">€ {formatNumber(item.value, 0)}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${energyTotal > 0 ? (item.value / energyTotal) * 100 : 0}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* KI-Sparpotenzial */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">KI-Sparpotenzial</h3>
                <p className="text-xs text-muted-foreground">Automatisch erkannte Maßnahmen · GJ 2024</p>
              </div>
              <span className="px-2.5 py-1 border border-border rounded-lg text-xs font-medium">{savingsMeasures.length} Empfehlungen</span>
            </div>
            <div className="space-y-3">
              {savingsMeasures.map((m, i) => (
                <div key={i} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2"><span>{m.icon}</span> {m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description} <span className="font-semibold text-foreground">€ {formatNumber(m.savingsEur, 0)}/Jahr</span></p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">− {formatNumber(m.savingsCo2, 0)} t CO₂</span>
                </div>
              ))}
            </div>
            <div className="mt-4 px-4 py-3 bg-primary/5 rounded-lg flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Gesamt Potenzial</span>
              <span className="text-sm font-semibold text-foreground">− {formatNumber(totalSavingsCo2, 0)} t CO₂ · € {formatNumber(totalSavingsEur, 0)}/Jahr</span>
            </div>
          </div>

          {/* Offene Anomalien */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Offene Anomalien</h3>
            <div className="space-y-3">
              {anomalies.map((a, i) => (
                <div key={i} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${a.badgeColor}`}>{a.badge}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setScreen("anomalies")} className="mt-4 w-full text-center text-xs text-primary font-medium hover:underline">
              Alle Anomalien anzeigen →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Powered by Claude AI</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">GHG Protocol</span>
        </div>
      </div>
    </>
  );
}
