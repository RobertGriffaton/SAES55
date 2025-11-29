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
  // TouchableWithoutFeedback est supprimé pour éviter les conflits de focus
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";
import { getAllRestaurants } from "../services/Database";
import { RestaurantCard } from "../components/RestaurantCard";

interface SearchViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

const ITEMS_PER_PAGE = 10;
const MAX_SUGGESTIONS = 7;

export const SearchView = ({ onRestaurantSelect }: SearchViewProps) => {
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // États pour la recherche
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllRestaurants();
      // Petite sécurité : on s'assure que data est un tableau
      setAllRestaurants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE PAGINATION ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allRestaurants.slice(startIndex, endIndex);
  }, [currentPage, allRestaurants]);

  const totalPages = Math.ceil(allRestaurants.length / ITEMS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // --- LOGIQUE SUGGESTIONS (CORRIGÉE) ---
  const suggestions = useMemo(() => {
    if (!searchText || searchText.length < 3) return [];

    const lowerText = searchText.toLowerCase();
    
    return allRestaurants
      .filter((r) => {
        // CORRECTION DU CRASH ICI :
        // On vérifie que le nom existe avant de faire toLowerCase()
        if (!r || !r.name) return false; 
        return r.name.toLowerCase().includes(lowerText);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [searchText, allRestaurants]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setIsSearching(text.length >= 3);
  };

  const clearSearch = () => {
    setSearchText("");
    setIsSearching(false);
    Keyboard.dismiss();
  };

  // --- RENDUS ---

  const renderSuggestionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        Keyboard.dismiss(); // On ferme le clavier quand on choisit
        onRestaurantSelect && onRestaurantSelect(item);
      }}
    >
      <Ionicons name="search-outline" size={20} color={colors.inactive} />
      <View style={styles.suggestionTextContainer}>
        {/* Sécurité d'affichage si le nom est manquant */}
        <Text style={styles.suggestionTitle}>{item.name || "Restaurant sans nom"}</Text>
        <Text style={styles.suggestionSubtitle}>
             {item.cuisines || item.type || "Type inconnu"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  const renderCardItem = ({ item }: { item: any }) => (
    <RestaurantCard 
      restaurant={item}
      onPress={() => onRestaurantSelect && onRestaurantSelect(item)}
    />
  );

  const renderPaginationFooter = () => {
    if (totalPages <= 1 || isSearching) return <View style={{ height: 20 }} />;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={goToPrevPage}
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#ccc" : colors.text} />
        </TouchableOpacity>

        <Text style={styles.pageText}>
          {currentPage} <Text style={styles.pageTextTotal}>/ {totalPages}</Text>
        </Text>

        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={goToNextPage}
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
        >
          <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? "#ccc" : colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // NOTE: On a retiré le TouchableWithoutFeedback qui bloquait l'input
  return (
      <View style={styles.container}>
        {/* --- HEADER --- */}
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
              // Important pour UX mobile
              returnKeyType="search" 
              onSubmitEditing={Keyboard.dismiss}
            />

            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {!isSearching && (
            <Text style={styles.subtitle}>
              {allRestaurants.length} restaurants trouvés
            </Text>
          )}
        </View>

        {/* --- CONTENU --- */}
        
        {isSearching ? (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsHeader}>Suggestions</Text>
            {suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                renderItem={renderSuggestionItem}
                // Sécurité sur l'ID
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                keyboardShouldPersistTaps="handled" // Permet de cliquer sur la liste sans fermer le clavier d'abord
              />
            ) : (
              <View style={styles.emptySearch}>
                <Text style={styles.emptyText}>Aucun résultat pour "{searchText}"</Text>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={paginatedData}
            renderItem={renderCardItem}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderPaginationFooter}
            // Permet de scroller pour fermer le clavier
            keyboardDismissMode="on-drag"
          />
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || "#f8f9fa",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: spacing.large,
    paddingTop: 50, 
    paddingBottom: spacing.medium,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: "100%",
    paddingVertical: 0, // Fix pour centrage texte Android
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
    marginLeft: 4
  },
  listContent: {
    padding: spacing.medium,
    paddingBottom: 40,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.medium,
    marginBottom: spacing.large,
    gap: 20,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
  },
  pageButtonDisabled: {
    backgroundColor: "#f9f9f9",
    borderColor: "#f0f0f0",
    elevation: 0,
  },
  pageText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  pageTextTotal: {
    color: "#888",
    fontWeight: "400",
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.large,
    paddingTop: spacing.medium,
  },
  suggestionsHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: "#888",
  },
  emptySearch: {
    paddingTop: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: "#888",
    fontStyle: 'italic'
  }
});