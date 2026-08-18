"use client";

import { ChevronRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useScanHistory, type ScanHistoryEntry } from "@/lib/storage/scan-history-storage";

const PALETTE = {
  rustySpice: "#AD390B",
  oliveLeaf: "#385610",
};

const COLLAPSED_COUNT = 2;

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 14) {
    return "Last week";
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }
  return `${Math.floor(diffDays / 30)} months ago`;
}

function ScanEntryCard({ entry }: { entry: ScanHistoryEntry }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <span className="font-semibold text-neutral-900">{entry.restaurantName}</span>
        <span className="text-sm text-neutral-500">
          {formatRelativeDate(entry.scannedAt)} &bull; {entry.dishCount} Dishes
        </span>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {entry.safeCount > 0 && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              {entry.safeCount} SAFE
            </span>
          )}
          {entry.conflictCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {entry.conflictCount} CONFLICTS
            </span>
          )}
        </div>
      </div>
      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-neutral-400" />
    </li>
  );
}

export function RecentScans() {
  const history = useScanHistory();
  const [expanded, setExpanded] = useState(false);

  const visibleEntries = expanded ? history : history.slice(0, COLLAPSED_COUNT);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Recent Scans</h2>
        {history.length > COLLAPSED_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            style={{ color: PALETTE.oliveLeaf }}
            className="text-sm font-semibold hover:opacity-80"
          >
            {expanded ? "Show less" : "View All"}
          </button>
        )}
      </div>

      {visibleEntries.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visibleEntries.map((entry) => (
            <ScanEntryCard key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      <Link
        href="/scan"
        style={{ borderColor: PALETTE.rustySpice, color: PALETTE.rustySpice }}
        className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-white/60 py-6 text-sm font-semibold hover:bg-white"
      >
        <span
          style={{ borderColor: PALETTE.rustySpice }}
          className="flex size-8 items-center justify-center rounded-full border-2"
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </span>
        Scan another menu
      </Link>
    </div>
  );
}
