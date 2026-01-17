import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DEFAULT_PREFERENCES, AvatarId } from '../models/PreferencesModel';

const KEY_PROFILES = 'user.profiles.v1';
const KEY_ACTIVE_PROFILE = 'user.active_profile.v1';

// Génère un ID unique
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Créer un profil par défaut
const createDefaultProfile = (name: string, avatar: AvatarId): UserProfile => ({
    id: generateId(),
    name,
    avatar,
    level: 1,
    xp: 0,
    createdAt: new Date().toISOString(),
    preferences: { ...DEFAULT_PREFERENCES },
});

// Récupérer tous les profils
export async function getAllProfiles(): Promise<UserProfile[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY_PROFILES);
        if (!raw) return [];
        return JSON.parse(raw) as UserProfile[];
    } catch {
        return [];
    }
}

// Sauvegarder tous les profils
async function saveProfiles(profiles: UserProfile[]): Promise<void> {
    await AsyncStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
}

// Récupérer le profil actif
export async function getActiveProfile(): Promise<UserProfile | null> {
    try {
        const activeId = await AsyncStorage.getItem(KEY_ACTIVE_PROFILE);
        const profiles = await getAllProfiles();

        if (activeId) {
            const found = profiles.find(p => p.id === activeId);
            if (found) return found;
        }

        // Si pas de profil actif, retourner le premier ou null
        return profiles.length > 0 ? profiles[0] : null;
    } catch {
        return null;
    }
}

// Définir le profil actif
export async function setActiveProfile(profileId: string): Promise<void> {
    await AsyncStorage.setItem(KEY_ACTIVE_PROFILE, profileId);
}

// Créer un nouveau profil
export async function createProfile(name: string, avatar: AvatarId): Promise<UserProfile> {
    const profiles = await getAllProfiles();
    const newProfile = createDefaultProfile(name, avatar);
    profiles.push(newProfile);
    await saveProfiles(profiles);

    // Si c'est le premier profil, le définir comme actif
    if (profiles.length === 1) {
        await setActiveProfile(newProfile.id);
    }

    return newProfile;
}

// Mettre à jour un profil
export async function updateProfile(
    profileId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<UserProfile | null> {
    const profiles = await getAllProfiles();
    const index = profiles.findIndex(p => p.id === profileId);

    if (index === -1) return null;

    profiles[index] = { ...profiles[index], ...updates };
    await saveProfiles(profiles);

    return profiles[index];
}

// Supprimer un profil
export async function deleteProfile(profileId: string): Promise<boolean> {
    const profiles = await getAllProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);

    if (filtered.length === profiles.length) return false;

    await saveProfiles(filtered);

    // Si le profil supprimé était actif, changer de profil actif
    const activeId = await AsyncStorage.getItem(KEY_ACTIVE_PROFILE);
    if (activeId === profileId && filtered.length > 0) {
        await setActiveProfile(filtered[0].id);
    }

    return true;
}

// Ajouter de l'XP et gérer le niveau
export async function addXpToProfile(profileId: string, xpAmount: number): Promise<UserProfile | null> {
    const profiles = await getAllProfiles();
    const profile = profiles.find(p => p.id === profileId);

    if (!profile) return null;

    profile.xp += xpAmount;

    // Calculer le niveau (100 XP par niveau)
    const newLevel = Math.floor(profile.xp / 100) + 1;
    profile.level = Math.min(newLevel, 10); // Max niveau 10

    await saveProfiles(profiles);
    return profile;
}

// Obtenir le pourcentage de progression vers le prochain niveau
export function getLevelProgress(profile: UserProfile): number {
    const xpInCurrentLevel = profile.xp % 100;
    return xpInCurrentLevel;
}

// Formater la date d'inscription
export function formatMemberSince(createdAt: string): string {
    const date = new Date(createdAt);
    const months = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
