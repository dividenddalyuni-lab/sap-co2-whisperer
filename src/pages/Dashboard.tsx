import { useApp } from "@/context/AppContext";
import { formatTonnes, formatNumber, scopeTotal, qualityColor, statusIcon, statusLabel, formatEuro } from "@/lib/co2-utils";
import { AlertTriangle, TrendingDown, BarChart3, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const SCOPE_COLORS = ["hsl(152, 60%, 36%)", "hsl(38, 92%, 50%)", "hsl(220, 60%, 55%)"];

export default function DashboardPage() {
  const { calculatedLines, claudeResponse, bookingLines } = useApp();

  if (!claudeResponse) return null;

  const s1 = scopeTotal(calculatedLines, 1);
  const s2 = scopeTotal(calculatedLines, 2);
  const s3 = scopeTotal(calculatedLines, 3);
  const total = s1 + s2 + s3;
  const quality = claudeResponse.datenqualitaet;

  const pieData = [
    { name: "Scope 1", value: s1 },
    { name: "Scope 2", value: s2 },
    { name: "Scope 3", value: s3 },
  ];

  // Group by Kostenstelle
  const ksMap = new Map<string, number>();
  calculatedLines.forEach((l) => {
    const name = l.original.kostenstelle.split(" ").slice(1).join(" ") || l.original.kostenstelle;
    ksMap.set(name, (ksMap.get(name) || 0) + l.t_co2);
  });
  const barData = Array.from(ksMap.entries()).map(([name, value]) => ({ name, value: +value.toFixed(2) }));

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">GreenSight ESG / <span className="font-semibold text-foreground">Dashboard</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Frosta GmbH</span>
            <span className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium">Geschäftsjahr 2024</span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-5 gap-4">
          <MetricCard label="Scope 1 — Direkte Emissionen" value={formatTonnes(s1)} unit="t CO₂e" color="text-primary" />
          <MetricCard label="Scope 2 — Energiebezug" value={formatTonnes(s2)} unit="t CO₂e" color="text-warning" />
          <MetricCard label="Scope 3 — Wertschöpfungskette" value={formatTonnes(s3)} unit="t CO₂e" color="text-blue-500" />
          <MetricCard label="Gesamt" value={formatTonnes(total)} unit="t CO₂e" color="text-foreground" bold />
          <MetricCard label="Datenqualität" value={`${quality.score} %`} unit="" color={qualityColor(quality.score)} badge={quality.score < 80 ? `${quality.fehlende_scopes.length} Datenlücken` : "Gut"} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Scope Distribution */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-1">CO₂-Emissionen nach Scope</h3>
            <p className="text-xs text-muted-foreground mb-4">Geschäftsjahr 2024 · t CO₂e</p>
            <div className="flex items-center gap-8">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={SCOPE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: SCOPE_COLORS[0] }} />
                  <span><strong>Scope 1</strong> — {formatTonnes(s1)} t · {total > 0 ? formatNumber(s1/total*100, 1) : 0} %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: SCOPE_COLORS[1] }} />
                  <span><strong>Scope 2</strong> — {formatTonnes(s2)} t · {total > 0 ? formatNumber(s2/total*100, 1) : 0} %</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: SCOPE_COLORS[2] }} />
                  <span><strong>Scope 3</strong> — {formatTonnes(s3)} t · {total > 0 ? formatNumber(s3/total*100, 1) : 0} %</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-1">CO₂ pro Kostenstelle</h3>
            <p className="text-xs text-muted-foreground mb-4">t CO₂e</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => [formatTonnes(v) + " t", "CO₂e"]} />
                <Bar dataKey="value" fill="hsl(152, 60%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomalies */}
        {claudeResponse.anomalien.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Anomalien & Warnungen
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {claudeResponse.anomalien.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.nachricht}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.empfehlung}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">Buchungszeilen — Klassifizierung</h3>
            <p className="text-xs text-muted-foreground">{calculatedLines.length} Buchungen analysiert · KI-gestützte Klassifizierung</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left font-medium">Kostenstelle</th>
                  <th className="px-4 py-2.5 text-left font-medium">Buchungstext</th>
                  <th className="px-4 py-2.5 text-right font-medium">Betrag €</th>
                  <th className="px-4 py-2.5 text-left font-medium">Kategorie</th>
                  <th className="px-4 py-2.5 text-center font-medium">Scope</th>
                  <th className="px-4 py-2.5 text-right font-medium">t CO₂e</th>
                  <th className="px-4 py-2.5 text-left font-medium">Faktor</th>
                  <th className="px-4 py-2.5 text-left font-medium">Quelle</th>
                  <th className="px-4 py-2.5 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {calculatedLines.map((line) => {
                  const st = statusIcon(line.status);
                  return (
                    <tr key={line.zeile_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs">{line.original.kostenstelle}</td>
                      <td className="px-4 py-2.5 text-xs max-w-[200px] truncate">{line.original.buchungstext}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-medium">{formatEuro(line.original.betrag)}</td>
                      <td className="px-4 py-2.5 text-xs">{line.kategorie}</td>
                      <td className="px-4 py-2.5 text-xs text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                          line.scope === 1 ? "bg-primary/10 text-primary" :
                          line.scope === 2 ? "bg-warning/10 text-warning" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>{line.scope}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right font-medium">{formatTonnes(line.t_co2)}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{line.emissionsfaktor} {line.einheit}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{line.quelle}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs font-medium ${st.className}`}>
                          {st.icon} {statusLabel(line.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Powered by Claude AI</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">GHG Protocol</span>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, unit, color, bold, badge }: {
  label: string; value: string; unit: string; color: string; bold?: boolean; badge?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl ${bold ? "font-extrabold" : "font-bold"} ${color}`}>{value}</p>
      {unit && <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>}
      {badge && (
        <p className={`text-[10px] mt-1.5 font-medium ${color}`}>
          {badge}
        </p>
      )}
    </div>
  );
}
