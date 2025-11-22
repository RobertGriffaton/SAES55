import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";
import { getAllRestaurants, getRestaurantsNearby } from "../services/Database";

export const SearchView = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const radiusKm = 5;

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllRestaurants();
      setRestaurants(all);
      setIsNearby(false);
    } catch (e) {
      console.error("Erreur chargement restaurants:", e);
      setError("Impossible de charger les restaurants.");
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission localisation refusée.");
        setLoading(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const nearby = await getRestaurantsNearby(
        position.coords.latitude,
        position.coords.longitude,
        radiusKm
      );
      setRestaurants(nearby);
      setIsNearby(true);
    } catch (e) {
      console.error("Erreur geoloc:", e);
      setError("Impossible de récupérer votre position.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.name}</Text>
        {item.distanceKm !== undefined ? (
          <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
        ) : item.type ? (
          <Text style={styles.type}>{item.type}</Text>
        ) : null}
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

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={loadNearby}>
          <Ionicons name="locate" size={18} color="#fff" />
          <Text style={styles.actionText}>Autour de moi ({radiusKm} km)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionGhost]}
          onPress={loadAll}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={[styles.actionText, styles.actionGhostText]}>
            Tout afficher
          </Text>
        </TouchableOpacity>
      </View>

      {isNearby && (
        <Text style={styles.modeText}>
          Affichage des restaurants dans un rayon de {radiusKm} km.
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

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
  actions: {
    flexDirection: "row",
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
  actionGhost: {
    backgroundColor: (colors as any).primary + "12",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionGhostText: {
    color: colors.primary,
  },
  modeText: {
    color: colors.inactive,
    marginBottom: spacing.small,
    fontSize: fontSize.small,
  },
  error: {
    color: "#EF4444",
    marginBottom: spacing.small,
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
  distance: {
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
