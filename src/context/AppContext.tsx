import React, { useState, useCallback } from "react";
import { BookingLine, ClaudeResponse, CalculatedLine, AppScreen } from "@/lib/types";
import { calculateEmissions } from "@/lib/co2-utils";
import { callClaudeAPI } from "@/lib/claude-api";
import { buildFallbackResponse } from "@/lib/fallback-classifier";
import { AppContext, ANALYSIS_STEPS } from "./app-context-core";

export { useApp } from "./app-context-core";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>("upload");
  const [bookingLines, setBookingLines] = useState<BookingLine[]>([]);
  const [claudeResponse, setClaudeResponse] = useState<ClaudeResponse | null>(null);
  const [calculatedLines, setCalculatedLines] = useState<CalculatedLine[]>([]);
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem("clymaiq_api_key") || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    localStorage.setItem("clymaiq_api_key", key);
  }, []);

  const startAnalysis = useCallback(async (useMock = false) => {
    setIsAnalyzing(true);
    setScreen("analysis");

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      setAnalysisStep(ANALYSIS_STEPS[stepIndex % ANALYSIS_STEPS.length]);
      stepIndex++;
    }, 1500);

    try {
      let response: ClaudeResponse;
      if (useMock || !apiKey) {
        await new Promise((r) => setTimeout(r, ANALYSIS_STEPS.length * 1500));
        response = buildFallbackResponse(bookingLines);
      } else {
        try {
          response = await callClaudeAPI(apiKey, bookingLines);
        } catch (apiErr) {
          console.warn("Claude API failed, using fallback classifier:", apiErr);
          response = buildFallbackResponse(bookingLines);
        }
      }

      setClaudeResponse(response);
      setCalculatedLines(calculateEmissions(bookingLines, response));
      setScreen("dashboard");
    } catch (err) {
      console.error("Analysis failed:", err);
      const response = buildFallbackResponse(bookingLines);
      setClaudeResponse(response);
      setCalculatedLines(calculateEmissions(bookingLines, response));
      setScreen("dashboard");
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  }, [apiKey, bookingLines]);

  const resetAnalysis = useCallback(() => {
    setScreen("upload");
    setBookingLines([]);
    setClaudeResponse(null);
    setCalculatedLines([]);
  }, []);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      bookingLines, setBookingLines,
      claudeResponse, calculatedLines,
      apiKey, setApiKey,
      isAnalyzing, analysisStep,
      startAnalysis, resetAnalysis,
    }}>
      {children}
    </AppContext.Provider>
  );
}
