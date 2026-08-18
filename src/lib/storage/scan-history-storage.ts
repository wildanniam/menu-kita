import { useSyncExternalStore } from "react";

import { z } from "zod";

const HISTORY_STORAGE_KEY = "menukita:scan-history";
const PENDING_SCAN_STORAGE_KEY = "menukita:pending-scan";
const MAX_HISTORY_ENTRIES = 20;

export const scanHistoryEntrySchema = z.object({
  id: z.string().trim().min(1),
  restaurantName: z.string().trim().min(1),
  scannedAt: z.iso.datetime(),
  dishCount: z.number().int().nonnegative(),
  safeCount: z.number().int().nonnegative(),
  conflictCount: z.number().int().nonnegative(),
});

export type ScanHistoryEntry = z.infer<typeof scanHistoryEntrySchema>;

const pendingScanSchema = z.object({
  restaurantName: z.string().trim().min(1),
  scannedAt: z.iso.datetime(),
});

export function setPendingScan(restaurantName: string): void {
  window.localStorage.setItem(
    PENDING_SCAN_STORAGE_KEY,
    JSON.stringify({
      restaurantName: restaurantName.trim() || "Untitled scan",
      scannedAt: new Date().toISOString(),
    }),
  );
}

export function consumePendingScan(): { restaurantName: string; scannedAt: string } | null {
  const raw = window.localStorage.getItem(PENDING_SCAN_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);

  const parsed = pendingScanSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

function readHistory(): ScanHistoryEntry[] {
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  const parsed = scanHistoryEntrySchema.array().safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

export function getScanHistory(): ScanHistoryEntry[] {
  return readHistory().sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
  );
}

export function addScanHistoryEntry(
  entry: Omit<ScanHistoryEntry, "id">,
): void {
  const next = [
    scanHistoryEntrySchema.parse({ ...entry, id: crypto.randomUUID() }),
    ...readHistory(),
  ].slice(0, MAX_HISTORY_ENTRIES);

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
}

let cachedRaw: string | null = null;
let cachedHistory: ScanHistoryEntry[] = [];

function readHistorySnapshot(): ScanHistoryEntry[] {
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedHistory;
  }
  cachedRaw = raw;
  cachedHistory = getScanHistory();
  return cachedHistory;
}

function subscribeToScanHistory(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getServerSnapshot(): ScanHistoryEntry[] {
  return [];
}

export function useScanHistory(): ScanHistoryEntry[] {
  return useSyncExternalStore(
    subscribeToScanHistory,
    readHistorySnapshot,
    getServerSnapshot,
  );
}
