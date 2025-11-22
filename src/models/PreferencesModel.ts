// src/models/PreferencesModel.ts

export type DietPreference = "none" | "vegetarian" | "vegan";

export interface UserPreferences {
  preferredTypes: string[]; // ex: ["restaurant", "cafe"]
  diet: DietPreference; // "none" | "vegetarian" | "vegan"
  takeawayPreferred: boolean; // true = privilégier les lieux avec takeaway = 1
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTypes: [],
  diet: "none",
  takeawayPreferred: false,
};
