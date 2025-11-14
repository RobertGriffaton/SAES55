export type Cuisine =
| "Afrique"
| "Asie"
| "Europe"
| "Maghreb"
| "Amérique"
| "Inde"
| "Italien"
| "Japonais"
| "Chinois"
| "Libanais"
| "Turc";


export type Diet = "Végétarien" | "Végan" | "Halal" | "Sans gluten" | "Aucune";


export type Ambiance = "Calme" | "Familial" | "Branché" | "Traditionnel" | "Romantique";


export interface UserPreferences {
cuisines: Cuisine[];
budgetEuro: number; // budget moyen par personne
distanceKm: number; // rayon de recherche max
diet: Diet;
ambiance: Ambiance | null;
options: { surPlace: boolean; emporter: boolean; livraison: boolean };
}


export const DEFAULT_PREFERENCES: UserPreferences = {
cuisines: [],
budgetEuro: 15,
distanceKm: 5,
diet: "Aucune",
ambiance: null,
options: { surPlace: true, emporter: false, livraison: false },
};