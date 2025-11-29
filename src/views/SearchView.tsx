import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";
import { getAllRestaurants } from "../services/Database";
// Assurez-vous d'importer correctement le composant créé ci-dessus
import { RestaurantCard } from "../components/RestaurantCard"; 

interface SearchViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

const ITEMS_PER_PAGE = 10;

export const SearchView = ({ onRestaurantSelect }: SearchViewProps) => {
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllRestaurants();
      setAllRestaurants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les données à afficher pour la page courante
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allRestaurants.slice(startIndex, endIndex);
  }, [currentPage, allRestaurants]);

  // Calcul du nombre total de pages
  const totalPages = Math.ceil(allRestaurants.length / ITEMS_PER_PAGE);

  // Fonctions de navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // Rendu d'un item via le nouveau composant
  const renderItem = ({ item }: { item: any }) => (
    <RestaurantCard 
      restaurant={item}
      onPress={() => onRestaurantSelect && onRestaurantSelect(item)}
    />
  );

  // Composant de pied de page (Pagination)
  const renderFooter = () => {
    if (totalPages <= 1) return <View style={{ height: 20 }} />;

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
          Page {currentPage} <Text style={styles.pageTextTotal}>/ {totalPages}</Text>
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

  return (
    <View style={styles.container}>
      {/* En-tête de la page */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
            <Ionicons name="search" size={28} color={colors.primary} />
            <Text style={styles.headerTitle}>Recherche</Text>
        </View>
        <Text style={styles.subtitle}>
            {allRestaurants.length} restaurants trouvés
        </Text>
      </View>

      {/* Liste des restaurants */}
      <FlatList
        data={paginatedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Ajout du footer pour la pagination
        ListFooterComponent={renderFooter}
        // Optionnel : remonter en haut de la liste quand on change de page
        onContentSizeChange={() => {
            // Cette astuce dépend de la ref, mais pour une pagination simple
            // l'utilisateur voit le changement immédiatement.
        }}
      />
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
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  titleRow: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10,
    marginBottom: 4
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginLeft: 38 // pour s'aligner sous le texte du titre
  },
  listContent: {
    padding: spacing.medium,
    paddingBottom: 40,
  },
  
  // Styles Pagination
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.medium,
    marginBottom: spacing.large,
    gap: 20,
  },
  pageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    // Ombre bouton
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  pageButtonDisabled: {
    backgroundColor: "#f5f5f5",
    elevation: 0,
    borderColor: "#f0f0f0",
  },
  pageText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  pageTextTotal: {
    color: "#888",
    fontWeight: "400",
  },
});