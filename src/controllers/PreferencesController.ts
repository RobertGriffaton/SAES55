import AsyncStorage from "@react-native-async-storage/async-storage";
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


export async function isOnboardingDone(): Promise<boolean> {
const flag = await AsyncStorage.getItem(KEY_ONBOARDING);
return flag === "1";
}


export async function setOnboardingDone(done: boolean): Promise<void> {
await AsyncStorage.setItem(KEY_ONBOARDING, done ? "1" : "0");
}