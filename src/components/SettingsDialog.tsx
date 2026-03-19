import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Eye, EyeOff } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function SettingsDialog() {
  const { apiKey, setApiKey } = useApp();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Claude API Key
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Erforderlich für KI-gestützte Analyse. Erhältlich unter{" "}
              <a href="https://console.anthropic.com/" target="_blank" rel="noopener" className="text-primary underline">
                console.anthropic.com
              </a>
            </p>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ohne API Key wird die Demo-Analyse mit vorberechneten Daten durchgeführt.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
