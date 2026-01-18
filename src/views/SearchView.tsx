import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ScrollView,
  Platform,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";
// Import de l'algorithme intelligent
import { getAdaptiveRecommendations } from "../services/RecommendationService";
// On garde getAllRestaurants pour les suggestions de recherche si besoin, 
// mais le chargement principal se fait via l'algo.
import { getAllRestaurants } from "../services/Database";
import { RestaurantCard } from "../components/RestaurantCard";
import * as Location from "expo-location";
import { getActiveProfile } from "../controllers/ProfileController";
import { AvatarId } from "../models/PreferencesModel";

// Mapping des images avatars
const AVATAR_IMAGES: Record<AvatarId, any> = {
  burger: require("../../assets/avatar_burger.png"),
  pizza: require("../../assets/avatar_pizza.png"),
  sushi: require("../../assets/avatar_sushi.png"),
  taco: require("../../assets/avatar_taco.png"),
  cupcake: require("../../assets/avatar_cupcake.png"),
};

// --- 1. INTERFACE DE SAUVEGARDE ---
export interface SearchSessionState {
  restaurants: any[];
  userLocation: { lat: number; lon: number } | null;
  locationName: string | null;
  useLocationFilter: boolean;
  radiusKm: number;
  searchText: string;
  selectedCategories: string[];
  takeawayOnly: boolean;
  onSiteOnly: boolean;
}

interface SearchViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
  // --- 2. PROPS POUR LA SAUVEGARDE ---
  savedState?: SearchSessionState | null;
  onSaveState?: (state: SearchSessionState) => void;
}

const ITEMS_PER_PAGE = 10;
const MAX_SUGGESTIONS = 7;
const RADIUS_OPTIONS = [2, 5, 10, 20];

// Liste complète des catégories de cuisine avec emojis
const CUISINE_CATEGORIES = [
  { id: "burger", label: "Burgers", emoji: "🍔" },
  { id: "japonais", label: "Jap'", emoji: "🍣" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "healthy", label: "Healthy", emoji: "🥗" },
  { id: "kebab", label: "Kebab", emoji: "🥙" },
  { id: "tacos", label: "Tacos", emoji: "🌮" },
  { id: "francais", label: "Français", emoji: "🧀" },
  { id: "italien", label: "Italien", emoji: "🍝" },
  { id: "chinois", label: "Chinois", emoji: "🥡" },
  { id: "asiatique", label: "Asiatique", emoji: "🍜" },
  { id: "thai", label: "Thaï", emoji: "🍛" },
  { id: "vietnamien", label: "Vietnamien", emoji: "🍲" },
  { id: "coreen", label: "Coréen", emoji: "🍱" },
  { id: "africain", label: "Africain", emoji: "🥘" },
  { id: "oriental", label: "Oriental", emoji: "🧆" },
  { id: "grec", label: "Grec", emoji: "🥚" },
  { id: "latino", label: "Latino", emoji: "🌶️" },
  { id: "poulet", label: "Poulet", emoji: "🍗" },
  { id: "sandwich", label: "Sandwich", emoji: "🥪" },
  { id: "fast_food", label: "Fast Food", emoji: "🌟" },
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "patisserie", label: "Pâtisserie", emoji: "🧁" },
  { id: "creperie", label: "Crêperie", emoji: "🥞" },
  { id: "grill", label: "Grill", emoji: "🥩" },
  { id: "fruits_de_mer", label: "Fruits de mer", emoji: "🦐" },
  { id: "bubble_tea", label: "Bubble Tea", emoji: "🧋" },
  { id: "americain", label: "Américain", emoji: "🍟" },
  { id: "espagnol", label: "Espagnol", emoji: "🥘" },
  { id: "turkish", label: "Turc", emoji: "🧇" },
  { id: "creole", label: "Créole", emoji: "🌴" },
  { id: "mediterranean", label: "Méditerranéen", emoji: "🌿" },
  { id: "asie_du_sud", label: "Asie du Sud", emoji: "🍛" },
  { id: "middle_eastern", label: "Moyen-Orient", emoji: "🧆" },
  { id: "europeen", label: "Européen", emoji: "🇪🇺" },
  { id: "balkans", label: "Balkans", emoji: "🥩" },
  { id: "bar", label: "Bar", emoji: "🍻" },
  { id: "divers", label: "Divers", emoji: "🍽️" },
];

export const SearchView = ({ onRestaurantSelect, savedState, onSaveState }: SearchViewProps) => {
  // --- 3. INITIALISATION AVEC savedState ---
  const [allRestaurants, setAllRestaurants] = useState<any[]>(savedState?.restaurants || []);
  // Si on a déjà des restaurants, on ne met pas loading à true par défaut
  const [loading, setLoading] = useState(savedState?.restaurants && savedState.restaurants.length > 0 ? false : true);

  // --- RESPONSIVE : Calcul des colonnes ---
  const { width } = useWindowDimensions();
  const numColumns = width > 1024 ? 3 : width > 600 ? 2 : 1;
  const isGrid = numColumns > 1;

  // --- ÉTATS DE FILTRES & PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState(savedState?.searchText || "");
  const [isSearching, setIsSearching] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(savedState?.selectedCategories || []);
  const [takeawayOnly, setTakeawayOnly] = useState(savedState?.takeawayOnly || false);
  const [onSiteOnly, setOnSiteOnly] = useState(savedState?.onSiteOnly || false);

  // États de localisation restaurés
  const [useLocationFilter, setUseLocationFilter] = useState(savedState?.useLocationFilter || false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(savedState?.userLocation || null);
  const [locationName, setLocationName] = useState<string | null>(savedState?.locationName || null);
  const [radiusKm, setRadiusKm] = useState<number>(savedState?.radiusKm || 5);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<AvatarId | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  // --- 4. EFFET DE SAUVEGARDE AUTOMATIQUE ---
  useEffect(() => {
    if (onSaveState) {
      onSaveState({
        restaurants: allRestaurants,
        userLocation: userLocation,
        locationName: locationName,
        useLocationFilter: useLocationFilter,
        radiusKm: radiusKm,
        searchText: searchText,
        selectedCategories: selectedCategories,
        takeawayOnly: takeawayOnly,
        onSiteOnly: onSiteOnly
      });
    }
  }, [allRestaurants, userLocation, locationName, useLocationFilter, radiusKm, searchText, selectedCategories, takeawayOnly, onSiteOnly]);

  // --- CHARGEMENT INTELLIGENT ---
  useEffect(() => {
    // On ne charge que si la liste est vide (évite le rechargement au retour)
    if (allRestaurants.length === 0) {
      loadData();
    }
    // Charger l'avatar du profil actif
    (async () => {
      const profile = await getActiveProfile();
      if (profile) {
        setProfileAvatar(profile.avatar);
        setProfileName(profile.name);
      }
    })();
  }, []);

  // Fonction de chargement qui accepte des coordonnées pour recalculer le score
  const loadData = async (lat?: number, lon?: number, rad?: number) => {
    setLoading(true);
    try {
      // Appel à l'algorithme de recommandation
      const data = await getAdaptiveRecommendations(lat, lon, rad);
      setAllRestaurants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement algo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, takeawayOnly, onSiteOnly, useLocationFilter, radiusKm, userLocation]);

  // --- FONCTIONS UTILITAIRES ---

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length) count += selectedCategories.length;
    if (takeawayOnly) count += 1;
    if (onSiteOnly) count += 1;
    if (useLocationFilter) count += 1;
    return count;
  }, [selectedCategories.length, takeawayOnly, onSiteOnly, useLocationFilter]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    const addCategory = (val?: string | number | null) => {
      if (!val) return;
      const normalized = String(val).trim();
      if (!normalized) return;
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    };
    allRestaurants.forEach((r) => {
      addCategory(r?.type);
      if (r?.cuisines) {
        String(r.cuisines).split(",").map((c) => c.trim()).filter(Boolean).forEach(addCategory);
      }
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([cat]) => cat);
  }, [allRestaurants]);

  const formatLabel = (value: string) =>
    value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- FILTRAGE ---

  const filteredRestaurants = useMemo(() => {
    return allRestaurants.filter((resto) => {
      // 1. Recherche Textuelle
      if (isSearching && searchText.length >= 3) {
        const nameMatch = (resto.name || "").toLowerCase().includes(searchText.toLowerCase());
        if (!nameMatch) return false;
      }

      // 2. Catégories
      const typeValue = (resto.type || "").toString().toLowerCase();
      const cuisinesValue = (resto.cuisines || "").toString().toLowerCase();

      if (selectedCategories.length) {
        const matchesCategory = selectedCategories.some((cat) => {
          const target = cat.toLowerCase();
          return typeValue === target || cuisinesValue.includes(target);
        });
        if (!matchesCategory) return false;
      }

      // 3. Options
      const takeawayValue = resto.takeaway;
      const hasTakeaway =
        takeawayValue === 1 ||
        takeawayValue === true ||
        (typeof takeawayValue === "string" && ["yes", "only", "true"].includes(takeawayValue.toLowerCase())) ||
        typeValue === "fast_food";

      if (takeawayOnly && !hasTakeaway) return false;

      const offersOnSite = typeof takeawayValue === "string" ? takeawayValue.toLowerCase() !== "only" : true;
      if (onSiteOnly && !offersOnSite) return false;

      // 4. Localisation
      if (useLocationFilter) {
        if (!userLocation || typeof resto.lat !== "number" || typeof resto.lon !== "number") return false;
        const distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, resto.lat, resto.lon);
        return distance <= radiusKm;
      }
      return true;
    });
  }, [allRestaurants, selectedCategories, takeawayOnly, onSiteOnly, useLocationFilter, userLocation, radiusKm, isSearching, searchText]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredRestaurants.slice(startIndex, endIndex);
  }, [currentPage, filteredRestaurants]);

  const totalPages = Math.max(1, Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE));

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage((p) => p - 1); };

  // --- ACTIONS UI ---

  const suggestions = useMemo(() => {
    if (!searchText || searchText.length < 3) return [];
    const lowerText = searchText.toLowerCase();
    return allRestaurants
      .filter((r) => r?.name && r.name.toLowerCase().includes(lowerText))
      .slice(0, MAX_SUGGESTIONS);
  }, [searchText, allRestaurants]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.length < 3) setIsSearching(false);
  };

  const clearSearch = () => { setSearchText(""); setIsSearching(false); Keyboard.dismiss(); };

  const toggleCategory = (cat: string) => { setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]); };


  // --- GÉOLOCALISATION & RECHARGEMENT ---
  const getCityName = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        { headers: { 'User-Agent': 'GrayeApp/1.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        const city = address.city || address.town || address.village || address.suburb;
        const district = address.city_district;

        if (city && district) return `${city}, ${district}`;
        if (city) return city;
      }
    } catch (error) {
      console.warn("Erreur reverse geocoding:", error);
    }
    return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  };

  const requestLocation = async () => {
    setLocationError(null);
    setRequestingLocation(true);

    try {
      let lat, lon;

      if (Platform.OS === "web") {
        if (!navigator.geolocation) throw new Error("Géolocalisation non supportée.");

        const getWebPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        };

        try {
          const pos = await getWebPosition({ enableHighAccuracy: false, timeout: 10000 });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (err) {
          const pos = await getWebPosition({ enableHighAccuracy: true, timeout: 10000 });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        }

      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("Permission refusée sur mobile");

        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
      }

      setUserLocation({ lat, lon });
      setUseLocationFilter(true);
      const cityName = await getCityName(lat, lon);
      setLocationName(cityName);
      await loadData(lat, lon, radiusKm);

    } catch (err: any) {
      console.error("ERREUR GÉOLOCALISATION :", err);
      if (Platform.OS === 'web') {
        const parisLat = 48.8566;
        const parisLon = 2.3522;
        setUserLocation({ lat: parisLat, lon: parisLon });
        setLocationName("Paris, Centre");
        setUseLocationFilter(true);
        await loadData(parisLat, parisLon, radiusKm);
        alert("Mode secours: Paris utilisé par défaut.");
      } else {
        setLocationError("Impossible de récupérer la position.");
        setUseLocationFilter(false);
      }
    } finally {
      setRequestingLocation(false);
    }
  };

  // --- RENDUS ITEMS ---

  const renderSuggestionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        Keyboard.dismiss();
        setSearchText(item.name);
        setIsSearching(true);
      }}
    >
      <Ionicons name="search-outline" size={20} color={colors.inactive} />
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionTitle}>{item.name || "Restaurant sans nom"}</Text>
        <Text style={styles.suggestionSubtitle}>{item.cuisines || item.type || "Type inconnu"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  const renderCardItem = ({ item }: { item: any }) => (
    <View style={{ flex: 1, maxWidth: `${100 / numColumns}%` }}>
      <RestaurantCard
        restaurant={item}
        onPress={() => onRestaurantSelect && onRestaurantSelect(item)}
      />
    </View>
  );

  const renderPaginationFooter = () => {
    if (totalPages <= 1 || isSearching && suggestions.length > 0) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity disabled={currentPage === 1} onPress={goToPrevPage} style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}>
          <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#ccc" : colors.text} />
        </TouchableOpacity>
        <Text style={styles.pageText}>{currentPage} <Text style={styles.pageTextTotal}>/ {totalPages}</Text></Text>
        <TouchableOpacity disabled={currentPage === totalPages} onPress={goToNextPage} style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}>
          <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? "#ccc" : colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  // --- HEADER CONSTANT ---
  const headerContent = (
    <View style={{ backgroundColor: "#fff", zIndex: 10 }}>
      <View style={styles.header}>
        {/* Location & Profile */}
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={styles.locationLeft}
            onPress={requestLocation}
            disabled={requestingLocation}
          >
            <Text style={styles.locationLabel}>Localisation</Text>
            <View style={styles.locationValue}>
              <Ionicons name="location" size={14} color={colors.primary || "#6B4EFF"} />
              {requestingLocation ? (
                <ActivityIndicator size="small" color={colors.primary || "#6B4EFF"} style={{ marginLeft: 4 }} />
              ) : (
                <>
                  <Text style={styles.locationText}>
                    {locationName || (userLocation
                      ? `${userLocation.lat.toFixed(3)}, ${userLocation.lon.toFixed(3)}`
                      : "Activer la localisation")}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.primary || "#6B4EFF"} style={{ marginLeft: 2 }} />
                </>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.profileSection}>
            {profileName && (
              <Text style={styles.profileName}>{profileName}</Text>
            )}
            <View style={styles.profilePic}>
              {profileAvatar ? (
                <Image source={AVATAR_IMAGES[profileAvatar]} style={styles.profileAvatar} />
              ) : (
                <Ionicons name="person" size={24} color="#9CA3AF" style={{ alignSelf: "center", marginTop: 6 }} />
              )}
            </View>
          </View>
        </View>

        {/* Main Title */}
        <Text style={styles.mainTitle}>
          Grave faim ?{"\n"}
          <Text style={styles.mainTitleOrange}>Viens Graye !</Text>
        </Text>

        {/* Search Bar AVEC BORDURE VIOLETTE */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Sushi, Burger, Tacos..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => { Keyboard.dismiss(); setIsSearching(true); }}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters((v) => !v)}>
              <Ionicons name="options" size={20} color={colors.primary || "#6B4EFF"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills */}
      {(!isSearching && searchText.length < 3) && (
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoriesScroll, { paddingHorizontal: spacing.large }]}
          >
            <TouchableOpacity style={[styles.categoryPill, selectedCategories.length === 0 && styles.categoryPillActive]} onPress={() => setSelectedCategories([])}>
              <Text style={styles.categoryEmoji}>🔥</Text>
              <Text style={[styles.categoryText, selectedCategories.length === 0 && styles.categoryTextActive]}>Pour toi</Text>
            </TouchableOpacity>
            {CUISINE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, selectedCategories.includes(cat.id) && styles.categoryPillActive]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryText, selectedCategories.includes(cat.id) && styles.categoryTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filters Panel */}
      {showFilters && (!isSearching || searchText.length < 3) && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Autour de moi</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity style={[styles.chip, useLocationFilter && styles.chipActive]} onPress={() => { if (useLocationFilter) { setUseLocationFilter(false); } else { requestLocation(); } }}>
                <Ionicons name={useLocationFilter ? "location" : "location-outline"} size={14} color={useLocationFilter ? "#fff" : colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, useLocationFilter && styles.chipTextActive]}>Activer</Text>
              </TouchableOpacity>
              {useLocationFilter && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {RADIUS_OPTIONS.map((opt) => {
                    const active = radiusKm === opt;
                    return (
                      <TouchableOpacity key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => { setRadiusKm(opt); if (userLocation) loadData(userLocation.lat, userLocation.lon, opt); }}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt} km</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Service</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity style={[styles.chip, takeawayOnly && styles.chipActive]} onPress={() => setTakeawayOnly((v) => !v)}><Ionicons name="bag-handle-outline" size={14} color={takeawayOnly ? "#fff" : colors.text} style={{ marginRight: 6 }} /><Text style={[styles.chipText, takeawayOnly && styles.chipTextActive]}>À emporter</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.chip, onSiteOnly && styles.chipActive]} onPress={() => setOnSiteOnly((v) => !v)}><Ionicons name="restaurant-outline" size={14} color={onSiteOnly ? "#fff" : colors.text} style={{ marginRight: 6 }} /><Text style={[styles.chipText, onSiteOnly && styles.chipTextActive]}>Sur place</Text></TouchableOpacity>
            </View>
          </View>
          {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
          {requestingLocation && (<View style={styles.locatingRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.locatingText}>Recherche de votre position...</Text></View>)}
        </View>
      )}

      {/* Titre de Section (adaptatif) */}
      <View style={styles.sectionHeader}>
        {(!isSearching && searchText.length < 3) ? (
          <>
            <Text style={styles.sectionTitle}>Nos recommandations</Text>
          </>
        ) : (
          <Text style={styles.sectionTitle}>Résultats pour "{searchText}"</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {headerContent}

      {/* AFFICHAGE CONDITIONNEL DU CONTENU DU BAS */}
      {(!isSearching && searchText.length >= 3 && suggestions.length > 0) ? (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsHeader}>Suggestions rapides</Text>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : (
        <FlatList
          data={paginatedData}
          renderItem={renderCardItem}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderPaginationFooter}
          keyboardDismissMode="on-drag"

          key={`grid-${numColumns}`}
          numColumns={numColumns}
          columnWrapperStyle={isGrid ? { gap: 20 } : undefined}

          ListEmptyComponent={
            <View style={styles.emptySearch}><Text style={styles.emptyText}>Aucun restaurant ne correspond à vos filtres.</Text></View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    paddingHorizontal: spacing.large,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },

  // Location
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationLeft: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    color: colors.primary || "#6B4EFF",
    fontWeight: "700",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FF8C00",
    overflow: "hidden",
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },

  // Titre
  mainTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1F2937",
    lineHeight: 30,
    marginBottom: 16,
  },
  mainTitleOrange: {
    color: "#FF8C00",
  },

  // MODIFICATION ICI : Barre de recherche avec bordure violette
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // Fond blanc pour contraste
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 2, // Bordure visible
    borderColor: colors.primary || "#6B4EFF", // Couleur violette
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    height: "100%",
    paddingVertical: 0,
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: "#F5F5F7", // Bouton filtre gris clair pour se distinguer du fond blanc
    padding: 8,
    borderRadius: 12,
    marginLeft: 8,
  },

  // Categories Pills
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    gap: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryPillActive: {
    backgroundColor: colors.primary || "#6B4EFF",
    borderColor: colors.primary || "#6B4EFF",
    ...Platform.select({
      ios: {
        shadowColor: "#6B4EFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.large,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary || "#6B4EFF",
  },

  // Filtres
  filtersContainer: {
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: spacing.medium,
    marginBottom: 8,
  },
  filterRow: { gap: spacing.small },
  filterLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  chipsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: colors.primary || "#6B4EFF",
    borderColor: colors.primary || "#6B4EFF",
  },
  chipText: { color: "#374151", fontWeight: "700", fontSize: 12 },
  chipTextActive: { color: "#FFFFFF" },

  // Liste
  listContent: {
    padding: spacing.medium,
    paddingBottom: 40,
    gap: 20,
    backgroundColor: "#FFFFFF",
  },

  // Pagination
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.medium,
    marginBottom: 35,
    gap: 20,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pageButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  pageText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  pageTextTotal: { color: "#9CA3AF", fontWeight: "400" },

  // Suggestions
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.large,
    paddingTop: spacing.medium,
    backgroundColor: "#FFFFFF",
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  suggestionTextContainer: { flex: 1, marginLeft: 12 },
  suggestionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  suggestionSubtitle: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },

  // Empty state
  emptySearch: { paddingTop: 60, alignItems: "center", paddingHorizontal: 40 },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // Erreurs
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4 },
  locatingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  locatingText: { color: "#6B7280", fontSize: 13 },

  // Filter toggle button
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterToggleActive: {
    backgroundColor: colors.primary || "#6B4EFF",
    borderColor: colors.primary || "#6B4EFF",
  },
  filterToggleText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  filterToggleTextActive: { color: "#FFFFFF" },

  subtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 0,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
});