import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import UploadPage from "@/pages/Upload";
import AnalysisPage from "@/pages/Analysis";
import DashboardPage from "@/pages/Dashboard";
import CSRDReportPage from "@/pages/CSRDReport";

const queryClient = new QueryClient();

function ScreenRouter() {
  const { screen } = useApp();
  switch (screen) {
    case "upload": return <UploadPage />;
    case "analysis": return <AnalysisPage />;
    case "dashboard": return <DashboardPage />;
    case "csrd-report": return <CSRDReportPage />;
    default: return <UploadPage />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <ScreenRouter />
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
