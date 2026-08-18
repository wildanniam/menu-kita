import { useSyncExternalStore } from "react";

import { foodProfileSchema, type FoodProfile } from "../schemas";

const CURRENT_USER_STORAGE_KEY = "menukita:current-user-profile";

export function saveCurrentUserProfile(profile: FoodProfile): void {
  const normalized = foodProfileSchema.parse({
    ...profile,
    isCurrentUser: true,
  });
  window.localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify(normalized),
  );
}

export function loadCurrentUserProfile(): FoodProfile | null {
  const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = foodProfileSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export function clearCurrentUserProfile(): void {
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}

let cachedRaw: string | null = null;
let cachedProfile: FoodProfile | null = null;

function readCurrentUserProfileSnapshot(): FoodProfile | null {
  const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedProfile;
  }
  cachedRaw = raw;
  cachedProfile = raw ? loadCurrentUserProfile() : null;
  return cachedProfile;
}

function subscribeToCurrentUserProfile(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getServerSnapshot(): FoodProfile | null {
  return null;
}

export function useCurrentUserProfile(): FoodProfile | null {
  return useSyncExternalStore(
    subscribeToCurrentUserProfile,
    readCurrentUserProfileSnapshot,
    getServerSnapshot,
  );
}
