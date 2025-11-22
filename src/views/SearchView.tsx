import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";
import { getAllRestaurants } from "../services/Database";

export const SearchView = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAllRestaurants();
        setRestaurants(all);
      } catch (e) {
        console.error("Erreur chargement restaurants:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.name}</Text>
        {item.type ? <Text style={styles.type}>{item.type}</Text> : null}
      </View>
      <Text style={styles.cuisine}>{item.cuisines || "Cuisine inconnue"}</Text>
      <View style={styles.tags}>
        {item.vegetarian === 1 && <Tag label="Veggie" />}
        {item.vegan === 1 && <Tag label="Vegan" />}
        {item.takeaway === 1 && <Tag label="A emporter" />}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="search" size={24} color={colors.primary} />
        <Text style={styles.headerText}>Restaurants</Text>
        <Text style={styles.headerSub}>{restaurants.length} trouvés</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Chargement des restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun restaurant disponible.</Text>
          }
        />
      )}
    </View>
  );
};

const Tag = ({ label }: { label: string }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.large,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  headerSub: {
    marginLeft: "auto",
    fontSize: fontSize.small,
    color: colors.inactive,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.small,
  },
  loaderText: {
    color: colors.inactive,
  },
  list: {
    paddingBottom: spacing.large,
    gap: spacing.small,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.small,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  type: {
    fontSize: fontSize.small,
    color: colors.inactive,
  },
  cuisine: {
    marginTop: 4,
    fontSize: fontSize.small,
    color: colors.inactive,
  },
  tags: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing.small,
  },
  tag: {
    backgroundColor: (colors as any).primary + "15",
    borderColor: colors.primary,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: colors.inactive,
    marginTop: spacing.large,
  },
});
