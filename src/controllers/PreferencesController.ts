import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFERENCES, UserPreferences } from "../models/PreferencesModel";


const KEY_PREFS = "user.preferences.v1";
const KEY_ONBOARDING = "onboarding.done.v1";
const KEY_ACTIVE_USER = "active.user.id";
const KEY_USER_NOTE = "user.note";
const userPrefsKey = (userId: number | string) => `${KEY_PREFS}.${userId}`;
const userNoteKey = (userId: number | string) => `${KEY_USER_NOTE}.${userId}`;


export async function getPreferences(): Promise<UserPreferences> {
try {
const raw = await AsyncStorage.getItem(KEY_PREFS);
if (!raw) return DEFAULT_PREFERENCES;
return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } as UserPreferences;
} catch {
return DEFAULT_PREFERENCES;
}
}


export async function savePreferences(prefs: UserPreferences): Promise<void> {
await AsyncStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
}

export async function getPreferencesForUser(userId: number | string): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(userPrefsKey(userId));
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } as UserPreferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferencesForUser(userId: number | string, prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(userPrefsKey(userId), JSON.stringify(prefs));
}

export async function getUserNote(userId: number | string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(userNoteKey(userId))) || "";
  } catch {
    return "";
  }
}

export async function saveUserNote(userId: number | string, note: string): Promise<void> {
  await AsyncStorage.setItem(userNoteKey(userId), note);
}

export async function removePreferencesForUser(userId: number | string): Promise<void> {
  try {
    await AsyncStorage.removeItem(userPrefsKey(userId));
  } catch (e) {
    console.warn("removePreferencesForUser", e);
  }
}

export async function removeUserNote(userId: number | string): Promise<void> {
  try {
    await AsyncStorage.removeItem(userNoteKey(userId));
  } catch (e) {
    console.warn("removeUserNote", e);
  }
}

export async function getActiveUserId(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ACTIVE_USER);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setActiveUserId(userId: number | null): Promise<void> {
  if (userId === null || userId === undefined) {
    await AsyncStorage.removeItem(KEY_ACTIVE_USER);
    return;
  }
  await AsyncStorage.setItem(KEY_ACTIVE_USER, String(userId));
}


export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem('onboarding_done');
    return value === 'true';
  } catch (e) {
    return false;
  }
};


export const setOnboardingDone = async () => {
  try {
    await AsyncStorage.setItem('onboarding_done', 'true');
  } catch (e) {
    console.error(e);
  }
};
