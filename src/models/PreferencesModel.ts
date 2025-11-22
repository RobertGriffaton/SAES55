export type RestaurantType =
  | "restaurant"
  | "fast_food"
  | "cafe"
  | "bar"
  | "pub"
  | "ice_cream"
  | "food_court"
  | "biergarten";

export type DietPreference = "none" | "vegetarian" | "vegan";

export interface UserPreferences {
  preferredTypes: RestaurantType[];
  diet: DietPreference;
  takeawayPreferred: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTypes: [],
  diet: "none",
  takeawayPreferred: false,
};
