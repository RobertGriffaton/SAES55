import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClickedRestaurant {
  id: string;
  cuisines: string[];
  type: string | null;
}

const CLICKED_KEY = 'clicked_restaurants_v1';

/**
 * Register a restaurant click by storing its id, cuisines, and type in local storage.
 * Keeps only the last 20 clicked restaurants.
 */
export async function registerRestaurantClick(restaurant: any): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(CLICKED_KEY);
    const clicked: ClickedRestaurant[] = stored ? JSON.parse(stored) : [];
    // Remove existing entry
    const filtered = clicked.filter(item => item.id !== restaurant.id);
    const cuisines: string[] = Array.isArray(restaurant.cuisine)
      ? restaurant.cuisine
      : restaurant.cuisine
      ? [restaurant.cuisine]
      : [];
    const entry: ClickedRestaurant = {
      id: restaurant.id,
      cuisines: cuisines,
      type: restaurant.type ?? null,
    };
    filtered.push(entry);
    const trimmed = filtered.slice(-20);
    await AsyncStorage.setItem(CLICKED_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving clicked restaurant', error);
  }
}

/**
 * Get the list of clicked restaurants from local storage.
 */
export async function getClickedRestaurants(): Promise<ClickedRestaurant[]> {
  const stored = await AsyncStorage.getItem(CLICKED_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Given all restaurants, recommend restaurants similar to those clicked based on matching cuisines and type.
 * @param allRestaurants List of all restaurants
 * @param limit Maximum number of recommendations to return
 */
export async function getRecommendedRestaurants(
  allRestaurants: any[],
  limit: number = 10
): Promise<any[]> {
  const clicked = await getClickedRestaurants();
  if (!clicked || clicked.length === 0) {
    return [];
  }
  // Build frequency map for cuisines and types
  const freq: Record<string, number> = {};
  clicked.forEach(item => {
    item.cuisines.forEach(c => {
      const key = c.toLowerCase();
      freq[key] = (freq[key] || 0) + 1;
    });
    if (item.type) {
      const key = item.type.toLowerCase();
      freq[key] = (freq[key] || 0) + 1;
    }
  });
  const clickedIds = new Set(clicked.map(item => item.id));
  // Compute score for each restaurant
  const scored = allRestaurants
    .filter(r => !clickedIds.has(r.id))
    .map(r => {
      let score = 0;
      const cuisines: string[] = Array.isArray(r.cuisine)
        ? r.cuisine
        : r.cuisine
        ? [r.cuisine]
        : [];
      cuisines.forEach(c => {
        score += freq[c.toLowerCase()] || 0;
      });
      if (r.type) {
        score += freq[r.type.toLowerCase()] || 0;
      }
      return { restaurant: r, score };
    });
  scored.sort((a, b) => b.score - a.score);
  const recommendations = scored
    .filter(item => item.score > 0)
    .slice(0, limit)
    .map(item => item.restaurant);
  return recommendations;
}
