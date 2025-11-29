import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";

interface RestaurantCardProps {
  restaurant: any;
  onPress: () => void;
}

export const RestaurantCard = ({ restaurant, onPress }: RestaurantCardProps) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Colonne Icône / Image Placeholder */}
      <View style={styles.iconContainer}>
        <Ionicons name="restaurant" size={24} color="#fff" />
      </View>

      {/* Colonne Infos */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>

        <Text style={styles.details} numberOfLines={1}>
          {restaurant.cuisines
            ? restaurant.cuisines.replace(",", ", ")
            : restaurant.type?.replace("_", " ")}
        </Text>

        {/* Badges (Végétarien / Vegan / À emporter) */}
        <View style={styles.badgesRow}>
          {restaurant.vegetarian === 1 && (
            <View style={[styles.badge, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="leaf" size={10} color="green" />
              <Text style={[styles.badgeText, { color: "green" }]}>Végé</Text>
            </View>
          )}
          {restaurant.vegan === 1 && (
            <View style={[styles.badge, { backgroundColor: "#E6F4EA" }]}>
              <Ionicons name="nutrition" size={10} color="green" />
              <Text style={[styles.badgeText, { color: "green" }]}>Vegan</Text>
            </View>
          )}
           {restaurant.takeaway === 1 && (
            <View style={[styles.badge, { backgroundColor: "#FFF4E5" }]}>
              <Ionicons name="basket" size={10} color="orange" />
              <Text style={[styles.badgeText, { color: "orange" }]}>Emporter</Text>
            </View>
          )}
        </View>
      </View>

      {/* Flèche de navigation */}
      <Ionicons name="chevron-forward" size={20} color={colors.inactive || "#ccc"} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    // Ombres
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  details: {
    fontSize: 13,
    color: "#888",
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});