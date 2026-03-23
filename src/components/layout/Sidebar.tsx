import { Leaf, LayoutDashboard, FileText, Settings, BarChart3 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { AppScreen } from "@/lib/types";

const navSections = [
  {
    label: "DATEN",
    items: [
      { id: "upload" as AppScreen, label: "Datenimport", icon: BarChart3 },
    ],
  },
  {
    label: "ANALYSE",
    items: [
      { id: "dashboard" as AppScreen, label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "COMPLIANCE",
    items: [
      { id: "csrd-report" as AppScreen, label: "CSRD Report", icon: FileText },
    ],
  },
];

export default function Sidebar() {
  const { screen, setScreen } = useApp();

  return (
    <aside className="w-56 min-h-screen bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sidebar-foreground font-bold text-sm tracking-wide">GreenSight</div>
          <div className="text-[10px] text-sidebar-muted tracking-widest uppercase">ESG Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-5 mt-2">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-sidebar-muted uppercase">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = screen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setScreen(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-xs text-sidebar-muted">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-green" />
          <span>Demo-Modus aktiv</span>
        </div>
      </div>
    </aside>
  );
}
