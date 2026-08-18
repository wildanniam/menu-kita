import { useSyncExternalStore } from "react";

export const DEMO_GROUP_ID = "global-friends";
const GROUP_STORAGE_KEY = "menukita:joined-group";
const GROUP_CHANGE_EVENT = "menukita:group-change";

export function parseStoredGroupId(raw: string | null): string | null {
  return raw === DEMO_GROUP_ID ? DEMO_GROUP_ID : null;
}

export function joinDemoGroup(): void {
  window.localStorage.setItem(GROUP_STORAGE_KEY, DEMO_GROUP_ID);
  window.dispatchEvent(new Event(GROUP_CHANGE_EVENT));
}

export function loadJoinedGroupId(): string | null {
  return parseStoredGroupId(window.localStorage.getItem(GROUP_STORAGE_KEY));
}

export function clearJoinedDemoGroup(): void {
  window.localStorage.removeItem(GROUP_STORAGE_KEY);
  window.dispatchEvent(new Event(GROUP_CHANGE_EVENT));
}

let cachedRaw: string | null = null;
let cachedGroupId: string | null = null;

function snapshot(): string | null {
  const raw = window.localStorage.getItem(GROUP_STORAGE_KEY);
  if (raw === cachedRaw) return cachedGroupId;
  cachedRaw = raw;
  cachedGroupId = parseStoredGroupId(raw);
  return cachedGroupId;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(GROUP_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(GROUP_CHANGE_EVENT, onChange);
  };
}

export function useJoinedDemoGroup(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => null) === DEMO_GROUP_ID;
}
