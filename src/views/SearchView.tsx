import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";
import { getAllRestaurants } from "../services/Database"; // Assurez-vous d'avoir cet import

// 1. DÉFINITION DE L'INTERFACE (C'est ce qui manquait !)
interface SearchViewProps {
  onRestaurantSelect?: (restaurant: any) => void;
}

// 2. UTILISATION DES PROPS DANS LE COMPOSANT
export const SearchView = ({ onRestaurantSelect }: SearchViewProps) => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllRestaurants();
      setRestaurants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onRestaurantSelect && onRestaurantSelect(item)} // C'est ici qu'on utilise la fonction
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.subtitle}>{item.cuisines || item.type}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="search" size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Recherche</Text>
      </View>
      <FlatList 
        data={restaurants} 
        renderItem={renderItem} 
        keyExtractor={(item) => item.id.toString()} 
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: spacing.medium },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.medium, gap: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { color: 'gray', marginTop: 4 }
});