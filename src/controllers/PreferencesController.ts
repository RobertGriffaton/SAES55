import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PREFERENCES,
  DietPreference,
  UserPreferences,
} from "../models/PreferencesModel";

const KEY_PREFS = "user.preferences.v2";
const KEY_ONBOARDING = "onboarding_done";

const normalizeDiet = (value: string | undefined): DietPreference => {
  if (!value) return "none";
  const normalized = value.toLowerCase();
  if (normalized.includes("vegan") || normalized.includes("v\u00e9gan")) {
    return "vegan";
  }
  if (
    normalized.includes("vege") ||
    normalized.includes("v\u00e9g\u00e9") ||
    normalized.includes("vegetarian")
  ) {
    return "vegetarian";
  }
  return "none";
};

const migratePreferences = (raw: any): Partial<UserPreferences> => {
  const migrated: Partial<UserPreferences> = {};

  if (Array.isArray(raw?.preferredTypes)) {
    migrated.preferredTypes = raw.preferredTypes.filter(Boolean);
  }

  if (typeof raw?.diet === "string") {
    migrated.diet = normalizeDiet(raw.diet);
  }

  if (typeof raw?.takeawayPreferred === "boolean") {
    migrated.takeawayPreferred = raw.takeawayPreferred;
  }

  // Legacy fields from the previous onboarding
  if (raw?.options?.emporter === true) {
    migrated.takeawayPreferred = true;
  }

  return migrated;
};

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFS);
    if (!raw) return DEFAULT_PREFERENCES;

    const parsed = JSON.parse(raw);
    const migrated = migratePreferences(parsed);

    return { ...DEFAULT_PREFERENCES, ...migrated };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
}

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(KEY_ONBOARDING);
    return value === "true";
  } catch (e) {
    return false;
  }
};

export const setOnboardingDone = async () => {
  try {
    await AsyncStorage.setItem(KEY_ONBOARDING, "true");
  } catch (e) {
    console.error(e);
  }
};
