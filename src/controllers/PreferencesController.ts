import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFERENCES, UserPreferences } from "../models/PreferencesModel";


const KEY_PREFS = "user.preferences.v1";
const KEY_ONBOARDING = "onboarding.done.v1";


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