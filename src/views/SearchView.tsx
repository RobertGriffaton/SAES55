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

interface SearchViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

const ITEMS_PER_PAGE = 10;
const MAX_SUGGESTIONS = 7;
const RADIUS_OPTIONS = [2, 5, 10, 20];

export const SearchView = ({ onRestaurantSelect }: SearchViewProps) => {
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- RESPONSIVE : Calcul des colonnes ---
  const { width } = useWindowDimensions();
  const numColumns = width > 1024 ? 3 : width > 600 ? 2 : 1;
  const isGrid = numColumns > 1;

  // --- ÉTATS DE FILTRES & PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [takeawayOnly, setTakeawayOnly] = useState(false);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // --- CHARGEMENT INTELLIGENT ---
  useEffect(() => {
    loadData();
  }, []);

  // Fonction de chargement qui accepte des coordonnées pour recalculer le score
  const loadData = async (lat?: number, lon?: number, rad?: number) => {
    setLoading(true);
    try {
      // Appel à l'algorithme de recommandation
      // Il retourne la liste triée (Score = Habitudes + Préférences + Distance)
      const data = await getAdaptiveRecommendations(lat, lon, rad);
      
      console.log(`[SearchView] ${data.length} restaurants chargés et triés par pertinence.`);
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
      if(text.length < 3) setIsSearching(false);
  };
  
  const clearSearch = () => { setSearchText(""); setIsSearching(false); Keyboard.dismiss(); };

  const toggleCategory = (cat: string) => { setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat] ); };

  // --- GÉOLOCALISATION & RECHARGEMENT ---
 // Remplacez votre fonction requestLocation actuelle par celle-ci :
  const requestLocation = async () => {
      setLocationError(null);
      setRequestingLocation(true);
      
      try {
        let lat, lon;
        
        // --- SPÉCIFIQUE WEB : GESTION DES ERREURS ---
        if (Platform.OS === "web") {
          if (!navigator.geolocation) {
             throw new Error("Géolocalisation non supportée.");
          }

          console.log("Tentative GPS Web...");
          
          // Fonction utilitaire pour "promisifier" l'API Geolocation du navigateur
          const getWebPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
          };

          try {
            // Tentative 1 : Précision moyenne (plus rapide et compatible PC/Wi-Fi)
            // timeout: 10000 (10s) pour laisser le temps au Wi-Fi de trianguler
            const pos = await getWebPosition({ enableHighAccuracy: false, timeout: 10000 });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          } catch (err) {
            console.warn("Échec GPS Web standard, tentative Haute Précision...", err);
            // Tentative 2 : Haute précision (si dispo)
            const pos = await getWebPosition({ enableHighAccuracy: true, timeout: 10000 });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          }

        } 
        // --- LOGIQUE MOBILE (Inchangée car elle marche) ---
        else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            throw new Error("Permission refusée sur mobile");
          }
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }

        // SUCCÈS : On a la position
        console.log("Position trouvée :", lat, lon);
        setUserLocation({ lat, lon });
        setUseLocationFilter(true);
        
        // IMPORTANT : On recharge la liste avec la nouvelle position pour mettre à jour les scores
        await loadData(lat, lon, radiusKm);

      } catch (err: any) {
        console.error("ERREUR GÉOLOCALISATION :", err);
        
        // --- PLAN B (UNIQUEMENT SUR LE WEB) ---
        // Si tout échoue sur le web, on place l'utilisateur à Paris pour ne pas bloquer le test
        if (Platform.OS === 'web') {
            const parisLat = 48.8566;
            const parisLon = 2.3522;
            console.log("⚠️ Mode Secours Web activé : Paris Châtelet");
            
            setUserLocation({ lat: parisLat, lon: parisLon });
            setUseLocationFilter(true);
            await loadData(parisLat, parisLon, radiusKm);
            
            // On affiche une petite alerte pour prévenir que ce n'est pas le vrai GPS
            alert("Impossible de vous localiser (Erreur Navigateur). Position par défaut utilisée (Paris) pour le test.");
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

  const HeaderComponent = () => (
    <View style={{ backgroundColor: "#fff", paddingBottom: spacing.medium }}>
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => { Keyboard.dismiss(); setIsSearching(true); }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {(!isSearching && searchText.length < 3) && (
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>{filteredRestaurants.length} restaurants triés par pertinence</Text>
            <TouchableOpacity style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters((v) => !v)}>
              <Ionicons name="options-outline" size={16} color={showFilters ? "#fff" : colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>Filtres {activeFiltersCount ? `(${activeFiltersCount})` : ""}</Text>
              <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color={showFilters ? "#fff" : colors.text} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>

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
                        <TouchableOpacity 
                            key={opt} 
                            style={[styles.chip, active && styles.chipActive]} 
                            onPress={() => {
                                setRadiusKm(opt);
                                // Si on a déjà la position, on recharge avec le nouveau rayon pour l'algo
                                if (userLocation) {
                                    loadData(userLocation.lat, userLocation.lon, opt);
                                }
                            }}
                        >
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
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type de cuisine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {categoryOptions.map((cat) => { const active = selectedCategories.includes(cat); return ( <TouchableOpacity key={cat} onPress={() => toggleCategory(cat)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{formatLabel(cat)}</Text></TouchableOpacity> ); })}
            </ScrollView>
          </View>
          {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
          {requestingLocation && (<View style={styles.locatingRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.locatingText}>Recherche de votre position...</Text></View>)}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {(!isSearching && searchText.length >= 3 && suggestions.length > 0) ? (
         <>
           <HeaderComponent />
           <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsHeader}>Suggestions</Text>
            <FlatList 
                data={suggestions} 
                renderItem={renderSuggestionItem} 
                keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())} 
                keyboardShouldPersistTaps="handled" 
            />
           </View>
         </>
      ) : (
        <FlatList
          data={paginatedData}
          renderItem={renderCardItem}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={HeaderComponent}
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
  container: { flex: 1, backgroundColor: colors.background || "#f8f9fa" },
  center: { justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: spacing.large, paddingTop: Platform.OS === 'ios' ? 60 : 50 },
  searchBarContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f2f5", borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, height: "100%", paddingVertical: 0 },
  subtitle: { fontSize: 12, color: "#888", marginTop: 8, marginLeft: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10 },
  filterToggle: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "#f0f2f5" },
  filterToggleActive: { backgroundColor: colors.primary },
  filterToggleText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  filterToggleTextActive: { color: "#fff" },
  filtersContainer: { paddingHorizontal: spacing.large, paddingVertical: spacing.medium, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", gap: spacing.medium },
  filterRow: { gap: spacing.small },
  filterLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  chipsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "#f0f2f5" },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  listContent: { padding: spacing.medium, paddingBottom: 40, gap: 20 },
  paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.medium, marginBottom: spacing.large, gap: 20 },
  pageButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#eee", elevation: 1 },
  pageButtonDisabled: { backgroundColor: "#f9f9f9", borderColor: "#f0f0f0", elevation: 0 },
  pageText: { fontSize: 14, fontWeight: "700", color: colors.text },
  pageTextTotal: { color: "#888", fontWeight: "400" },
  suggestionsContainer: { flex: 1, paddingHorizontal: spacing.large, paddingTop: spacing.medium },
  suggestionsHeader: { fontSize: 14, fontWeight: "600", color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  suggestionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  suggestionTextContainer: { flex: 1, marginLeft: 12 },
  suggestionTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  suggestionSubtitle: { fontSize: 13, color: "#888" },
  emptySearch: { paddingTop: 40, alignItems: "center" },
  emptyText: { color: "#888", fontStyle: "italic", textAlign: "center" },
  errorText: { color: "#d14343", fontSize: 12 },
  locatingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locatingText: { color: colors.text, fontSize: 13 },
});