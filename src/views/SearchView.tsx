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
  useWindowDimensions, // <--- AJOUT
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";
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
  // Si écran > 1024px (Grand PC) -> 3 colonnes
  // Si écran > 600px (Tablette/Petit PC) -> 2 colonnes
  // Sinon (Mobile) -> 1 colonne
  const numColumns = width > 1024 ? 3 : width > 600 ? 2 : 1;
  const isGrid = numColumns > 1;

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // ... (Tes états de filtres restent identiques)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [takeawayOnly, setTakeawayOnly] = useState(false);
  const [onSiteOnly, setOnSiteOnly] = useState(false);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllRestaurants();
      setAllRestaurants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, takeawayOnly, onSiteOnly, useLocationFilter, radiusKm, userLocation]);

  // ... (Tes fonctions activeFiltersCount, categoryOptions, formatLabel, getDistanceFromLatLonInKm restent identiques)
  // Pour alléger la réponse, je ne les répète pas ici car elles ne changent pas.
  // ... Copie-colle tes fonctions existantes ici ...

  // --- JE REMETS JUSTE LES FILTRES ET LE RESTE POUR LA COHÉRENCE ---
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
      return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([cat]) => cat);
    }, [allRestaurants]);
  
  const formatLabel = (value: string) => value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
  };

  const filteredRestaurants = useMemo(() => {
    return allRestaurants.filter((resto) => {
      const typeValue = (resto.type || "").toString().toLowerCase();
      const cuisinesValue = (resto.cuisines || "").toString().toLowerCase();

      if (selectedCategories.length) {
        const matchesCategory = selectedCategories.some((cat) => {
          const target = cat.toLowerCase();
          return typeValue === target || cuisinesValue.includes(target);
        });
        if (!matchesCategory) return false;
      }

      const takeawayValue = resto.takeaway;
      const hasTakeaway =
        takeawayValue === 1 ||
        takeawayValue === true ||
        (typeof takeawayValue === "string" && ["yes", "only", "true"].includes(takeawayValue.toLowerCase())) ||
        typeValue === "fast_food";

      if (takeawayOnly && !hasTakeaway) return false;

      const offersOnSite = typeof takeawayValue === "string" ? takeawayValue.toLowerCase() !== "only" : true;
      if (onSiteOnly && !offersOnSite) return false;

      if (useLocationFilter) {
        if (!userLocation || typeof resto.lat !== "number" || typeof resto.lon !== "number") return false;
        const distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, resto.lat, resto.lon);
        return distance <= radiusKm;
      }
      return true;
    });
  }, [allRestaurants, selectedCategories, takeawayOnly, onSiteOnly, useLocationFilter, userLocation, radiusKm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredRestaurants.slice(startIndex, endIndex);
  }, [currentPage, filteredRestaurants]);

  const totalPages = Math.max(1, Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE));

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage((p) => p - 1); };

  const suggestions = useMemo(() => {
    if (!searchText || searchText.length < 3) return [];
    const lowerText = searchText.toLowerCase();
    return filteredRestaurants
      .filter((r) => r?.name && r.name.toLowerCase().includes(lowerText))
      .slice(0, MAX_SUGGESTIONS);
  }, [searchText, filteredRestaurants]);

  const handleSearchChange = (text: string) => { setSearchText(text); setIsSearching(text.length >= 3); };
  const clearSearch = () => { setSearchText(""); setIsSearching(false); Keyboard.dismiss(); };

  const toggleCategory = (cat: string) => { setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat] ); };

  // ... (Fonction requestLocation identique) ...
  const requestLocation = async () => {
      setLocationError(null);
      setRequestingLocation(true);
      try {
        if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
          const coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 7000 }
            );
          });
          setUserLocation({ lat: coords.latitude, lon: coords.longitude });
          setUseLocationFilter(true);
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setLocationError("Autorisation de géolocalisation refusée.");
            setUseLocationFilter(false);
            return;
          }
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
          setUseLocationFilter(true);
        }
      } catch (err) {
        setLocationError("Impossible de récupérer la position.");
        setUseLocationFilter(false);
      } finally {
        setRequestingLocation(false);
      }
    };

  const renderSuggestionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => { Keyboard.dismiss(); onRestaurantSelect && onRestaurantSelect(item); }}
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
    // On enveloppe la carte dans une View qui a un style "flex: 1" pour bien se répartir dans la grille
    <View style={{ flex: 1, maxWidth: isGrid ? "33%" : "100%" }}>
        <RestaurantCard
          restaurant={item}
          onPress={() => onRestaurantSelect && onRestaurantSelect(item)}
        />
    </View>
  );

  const renderPaginationFooter = () => {
    if (totalPages <= 1 || isSearching) return <View style={{ height: 20 }} />;
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

  // --- CONTENU DU HEADER (Barre de recherche + Filtres) ---
  // Je l'extrais pour pouvoir le passer au ListHeaderComponent proprement
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
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {!isSearching && (
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>{filteredRestaurants.length} restaurants trouvés avec vos filtres</Text>
            <TouchableOpacity style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters((v) => !v)}>
              <Ionicons name="options-outline" size={16} color={showFilters ? "#fff" : colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>Filtres {activeFiltersCount ? `(${activeFiltersCount})` : ""}</Text>
              <Ionicons name={showFilters ? "chevron-up" : "chevron-down"} size={16} color={showFilters ? "#fff" : colors.text} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
           {/* ... Contenu des filtres inchangé ... */}
           <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Autour de moi</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity style={[styles.chip, useLocationFilter && styles.chipActive]} onPress={() => { if (useLocationFilter) { setUseLocationFilter(false); } else { requestLocation(); } }}>
                <Ionicons name={useLocationFilter ? "location" : "location-outline"} size={14} color={useLocationFilter ? "#fff" : colors.text} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, useLocationFilter && styles.chipTextActive]}>Activer</Text>
              </TouchableOpacity>
              {useLocationFilter && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {RADIUS_OPTIONS.map((opt) => { const active = radiusKm === opt; return ( <TouchableOpacity key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setRadiusKm(opt)}><Text style={[styles.chipText, active && styles.chipTextActive]}>{opt} km</Text></TouchableOpacity> ); })}
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
      {/* Si on cherche (suggestions), on garde l'affichage standard vertical 
         Si on affiche les résultats, on utilise la grille responsive
      */}
      {isSearching ? (
         <>
           <HeaderComponent />
           <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsHeader}>Suggestions</Text>
            {suggestions.length > 0 ? (
              <FlatList data={suggestions} renderItem={renderSuggestionItem} keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())} keyboardShouldPersistTaps="handled" />
            ) : (
              <View style={styles.emptySearch}><Text style={styles.emptyText}>Aucun résultat pour "{searchText}"</Text></View>
            )}
           </View>
         </>
      ) : (
        <FlatList
          data={paginatedData}
          renderItem={renderCardItem}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={HeaderComponent} // Le header est intégré ici
          ListFooterComponent={renderPaginationFooter}
          keyboardDismissMode="on-drag"
          
          // --- CONFIGURATION GRILLE ---
          key={numColumns} // Force le re-render quand le nombre de colonnes change (CRUCIAL)
          numColumns={numColumns}
          columnWrapperStyle={isGrid ? { gap: 20 } : undefined} // Espace horizontal entre les cartes
          // ----------------------------

          ListEmptyComponent={
            <View style={styles.emptySearch}><Text style={styles.emptyText}>Aucun restaurant ne correspond à vos filtres.</Text></View>
          }
        />
      )}
    </View>
  );
};

// ... (Tes styles restent identiques, je ne les copie pas tous pour gagner de la place, garde ceux que tu avais)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || "#f8f9fa" },
  center: { justifyContent: "center", alignItems: "center" },
  // ATTENTION: J'ai retiré le padding top/bottom du Header dans le style, 
  // car il est maintenant géré par le composant wrapper
  header: { paddingHorizontal: spacing.large, paddingTop: 50, /* paddingBottom retiré ici */ },
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
  listContent: { padding: spacing.medium, paddingBottom: 40, gap: 20 }, // gap vertical géré ici
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