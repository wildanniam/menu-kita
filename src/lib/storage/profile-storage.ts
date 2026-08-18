import { useSyncExternalStore } from "react";

import { foodProfileSchema, type FoodProfile } from "../schemas";

const CURRENT_USER_STORAGE_KEY = "menukita:current-user-profile";
const PROFILE_CHANGE_EVENT = "menukita:profile-change";

export function saveCurrentUserProfile(profile: FoodProfile): void {
  const normalized = foodProfileSchema.parse({
    ...profile,
    isCurrentUser: true,
  });
  window.localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
}

export function loadCurrentUserProfile(): FoodProfile | null {
  const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  return parseStoredProfile(raw);
}

export function parseStoredProfile(raw: string | null): FoodProfile | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = foodProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearCurrentUserProfile(): void {
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
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
  window.addEventListener(PROFILE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PROFILE_CHANGE_EVENT, onChange);
  };
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
