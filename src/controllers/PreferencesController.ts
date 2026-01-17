import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFERENCES, UserPreferences } from "../models/PreferencesModel";
// On importe le contrôleur de profil pour faire le lien
import { getActiveProfile, updateProfile } from "./ProfileController";

const KEY_ONBOARDING = "onboarding.done.v1";

/**
 * Récupère les préférences du PROFIL ACTIF au lieu du stockage local isolé.
 * C'est ce qui permet à l'algo de voir vos changements dans SettingsView.
 */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const profile = await getActiveProfile();
    if (profile && profile.preferences) {
      return profile.preferences;
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.warn("Erreur lecture préférences profil:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Sauvegarde les préférences dans le PROFIL ACTIF.
 */
export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    const profile = await getActiveProfile();
    if (profile) {
      await updateProfile(profile.id, { preferences: prefs });
    } else {
      console.warn("Aucun profil actif pour sauvegarder les préférences.");
    }
  } catch (error) {
    console.error("Erreur sauvegarde préférences profil:", error);
  }
}

// --- Gestion de l'Onboarding (inchangée) ---

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(KEY_ONBOARDING);
    return value === 'true';
  } catch (e) {
    return false;
  }
};

export const setOnboardingDone = async () => {
  try {
    await AsyncStorage.setItem(KEY_ONBOARDING, 'true');
  } catch (e) {
    console.error(e);
  }
};