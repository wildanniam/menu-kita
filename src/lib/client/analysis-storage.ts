import { useSyncExternalStore } from "react";

import { analysisResultSchema, type AnalysisResult } from "../schemas";

const ANALYSIS_STORAGE_KEY = "menukita:current-analysis";
const ANALYSIS_CHANGE_EVENT = "menukita:analysis-change";

let cachedRaw: string | null = null;
let cachedResult: AnalysisResult | null = null;

export function parseStoredAnalysisResult(raw: string | null): AnalysisResult | null {
  if (!raw) return null;
  try {
    const parsed = analysisResultSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveAnalysisResult(result: AnalysisResult): void {
  const normalized = analysisResultSchema.parse(result);
  window.sessionStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(ANALYSIS_CHANGE_EVENT));
}

export function loadAnalysisResult(): AnalysisResult | null {
  return parseStoredAnalysisResult(
    window.sessionStorage.getItem(ANALYSIS_STORAGE_KEY),
  );
}

export function clearAnalysisResult(): void {
  window.sessionStorage.removeItem(ANALYSIS_STORAGE_KEY);
  window.dispatchEvent(new Event(ANALYSIS_CHANGE_EVENT));
}

function snapshot(): AnalysisResult | null {
  const raw = window.sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  cachedResult = parseStoredAnalysisResult(raw);
  return cachedResult;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(ANALYSIS_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(ANALYSIS_CHANGE_EVENT, onChange);
  };
}

export function useAnalysisResult(): AnalysisResult | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
