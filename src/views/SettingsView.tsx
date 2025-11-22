import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";
import { createUser, getAllUsers } from '../services/Database';

export const SettingsView = () => {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charge les utilisateurs au démarrage de la vue
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  const handleCreateUser = async () => {
    if (username.trim().length === 0) {
      Alert.alert("Erreur", "Le nom d'utilisateur ne peut pas être vide.");
      return;
    }

    setLoading(true);
    // On crée l'utilisateur avec un avatar par défaut
    const newId = await createUser(username, "user_default");
    setLoading(false);

    if (newId) {
      setUsername(""); // Vide le champ
      loadUsers(); // Rafraîchit la liste
      Alert.alert("Succès", `Profil "${username}" créé !`);
    } else {
      Alert.alert("Erreur", "Impossible de créer l'utilisateur.");
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person" size={24} color="#fff" />
      </View>
      <View>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userDate}>ID: {item.id}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color={colors.primary} />
        <Text style={styles.title}>Gestion des Profils</Text>
      </View>

      {/* Section Création */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Nouveau Profil</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre nom..."
            value={username}
            onChangeText={setUsername}
          />
          <View style={{ marginTop: 30, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 20 }}>
  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Zone Debug 🚧</Text>
  
  <TouchableOpacity 
    style={{ backgroundColor: '#333', padding: 15, borderRadius: 8 }}
    onPress={async () => {
       // 1. Récupérer les utilisateurs
       const users = await getAllUsers();
       console.log("=== TABLE UTILISATEURS ===");
       console.log(JSON.stringify(users, null, 2));

       // 2. Récupérer quelques restaurants (pour vérifier)
       // Note: Il faudra peut-être ajouter une fonction getAllRestaurants() dans Database.ts
       console.log("=== STATUS DB ===");
       console.log(users.length + " utilisateurs trouvés.");
    }}
  >
    <Text style={{ color: 'white', textAlign: 'center' }}>Voir les données dans la Console</Text>
  </TouchableOpacity>
</View>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleCreateUser}
            disabled={loading}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Liste */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Utilisateurs ({users.length})</Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur pour le moment.</Text>}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#f5f5f5',
    padding: spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
    gap: spacing.small,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: spacing.medium,
    borderRadius: 12,
    marginBottom: spacing.large,
    // Ombre légère
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.small,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  listSection: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inactive || '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  userDate: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
});