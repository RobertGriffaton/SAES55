import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";
import { createUser, deleteUser, getAllUsers, updateUserName, updateUserAvatar } from "../services/Database";
import { getPreferencesForUser, savePreferencesForUser, getActiveUserId, setActiveUserId, getUserNote, saveUserNote, removePreferencesForUser, removeUserNote } from "../controllers/PreferencesController";
import { Ambiance, Cuisine, DEFAULT_PREFERENCES, Diet, UserPreferences } from "../models/PreferencesModel";

// Valeurs copiées de PreferencesModel pour rester aligné sur le type union
const CUISINES: Cuisine[] = [
  "Afrique",
  "Asie",
  "Europe",
  "Maghreb",
  "Amérique",
  "Inde",
  "Italien",
  "Japonais",
  "Chinois",
  "Libanais",
  "Turc",
];

const DIETS: Diet[] = ["Aucune", "Végétarien", "Végan", "Halal", "Sans gluten"];
const AMBIANCES: Ambiance[] = ["Calme", "Familial", "Branché", "Traditionnel", "Romantique"];
const AVATARS = [
  { id: "user_default", label: "Classique", icon: "person" },
  { id: "chef", label: "Chef", icon: "restaurant" },
  { id: "coffee", label: "Coffee", icon: "cafe" },
  { id: "pizza", label: "Pizza", icon: "pizza" },
  { id: "icecream", label: "Glace", icon: "ice-cream" },
];

export const SettingsView = () => {
  const [username, setUsername] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [activeUserId, setActiveUserIdState] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefCuisines, setPrefCuisines] = useState<Cuisine[]>(DEFAULT_PREFERENCES.cuisines);
  const [prefBudget, setPrefBudget] = useState(String(DEFAULT_PREFERENCES.budgetEuro));
  const [prefDistance, setPrefDistance] = useState(String(DEFAULT_PREFERENCES.distanceKm));
  const [prefDiet, setPrefDiet] = useState<Diet>(DEFAULT_PREFERENCES.diet);
  const [prefAmbiance, setPrefAmbiance] = useState<Ambiance | null>(DEFAULT_PREFERENCES.ambiance);
  const [prefOptions, setPrefOptions] = useState(DEFAULT_PREFERENCES.options);
  const [prefNote, setPrefNote] = useState("");
  const [avatarChoice, setAvatarChoice] = useState("user_default");

  const activeUser = users.find((u) => u.id === activeUserId) || null;

  useEffect(() => {
    const bootstrap = async () => {
      const storedActive = await getActiveUserId();
      setActiveUserIdState(storedActive);
      await loadUsers(storedActive);
    };
    bootstrap();
  }, []);

  const resetPrefsFields = () => {
    setPrefCuisines(DEFAULT_PREFERENCES.cuisines);
    setPrefBudget(String(DEFAULT_PREFERENCES.budgetEuro));
    setPrefDistance(String(DEFAULT_PREFERENCES.distanceKm));
    setPrefDiet(DEFAULT_PREFERENCES.diet);
    setPrefAmbiance(DEFAULT_PREFERENCES.ambiance);
    setPrefOptions(DEFAULT_PREFERENCES.options);
    setPrefNote("");
  };

  const loadPreferencesSection = async (userId: number) => {
    setPrefsLoading(true);
    try {
      const prefs = await getPreferencesForUser(userId);
      const note = await getUserNote(userId);
      setPrefCuisines(prefs.cuisines || []);
      setPrefBudget(String(prefs.budgetEuro ?? DEFAULT_PREFERENCES.budgetEuro));
      setPrefDistance(String(prefs.distanceKm ?? DEFAULT_PREFERENCES.distanceKm));
      setPrefDiet(prefs.diet || DEFAULT_PREFERENCES.diet);
      setPrefAmbiance(prefs.ambiance ?? null);
      setPrefOptions(prefs.options || DEFAULT_PREFERENCES.options);
      setPrefNote(note || "");
    } catch (e) {
      resetPrefsFields();
    } finally {
      setPrefsLoading(false);
    }
  };

  const loadUsers = async (preferredId?: number | null) => {
    setUsersLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);

      // Choisir un utilisateur par défaut si aucun sélectionné
      let targetId: number | null = preferredId ?? activeUserId ?? selectedUserId;
      if (!targetId && allUsers.length > 0) {
        targetId = allUsers[0].id;
        setSelectedUserId(targetId);
        setActiveUserIdState((prev) => prev ?? targetId);
        if (!activeUserId) {
          await setActiveUserId(targetId);
        }
      }

      if (targetId) {
        const stillExists = allUsers.find((u) => u.id === targetId);
        if (stillExists) {
          setAvatarChoice(stillExists.avatar || "user_default");
          setSelectedUserId(targetId);
          await loadPreferencesSection(targetId);
        } else if (allUsers.length > 0) {
          targetId = allUsers[0].id;
          setSelectedUserId(targetId);
          setActiveUserIdState(targetId);
          await setActiveUserId(targetId);
          const fallbackUser = allUsers.find((u) => u.id === targetId);
          setAvatarChoice(fallbackUser?.avatar || "user_default");
          await loadPreferencesSection(targetId);
        } else {
          setSelectedUserId(null);
          resetPrefsFields();
        }
      } else {
        resetPrefsFields();
      }
    } catch (e) {
      resetPrefsFields();
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const trimmed = username.trim();
    if (trimmed.length === 0) {
      Alert.alert("Erreur", "Le nom d'utilisateur ne peut pas être vide.");
      return;
    }

    setLoading(true);
    const newId = await createUser(trimmed, "user_default");
    setLoading(false);

    if (newId) {
      setUsername("");
      setSelectedUserId(newId as number);
      setActiveUserIdState(newId as number);
      await setActiveUserId(newId as number);
      await loadUsers(newId as number);
      await loadPreferencesSection(newId as number);
      Alert.alert("Succès", `Profil "${trimmed}" créé !`);
    } else {
      Alert.alert("Erreur", "Impossible de créer l'utilisateur.");
    }
  };

  const startEditUser = (user: any) => {
    setEditingId(user.id);
    setEditingName(user.username);
  };

  const cancelEditUser = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdateUser = async () => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) {
      Alert.alert("Erreur", "Le nom d'utilisateur ne peut pas être vide.");
      return;
    }
    setLoading(true);
    const ok = await updateUserName(editingId, trimmed);
    setLoading(false);
    if (ok) {
      cancelEditUser();
      await loadUsers();
      Alert.alert("Succès", "Nom d'utilisateur mis à jour.");
    } else {
      Alert.alert("Erreur", "La mise à jour a échoué.");
    }
  };

  const handleDeleteUser = (user: any) => {
    Alert.alert(
      "Supprimer ce profil ?",
      `Cette action retirera "${user.username}" de la liste.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const ok = await deleteUser(user.id);
            if (ok) {
              await removePreferencesForUser(user.id);
              await removeUserNote(user.id);
              if (editingId === user.id) cancelEditUser();
              // on laisse loadUsers recalculer active/selected proprement
              await loadUsers(null);
              // si l'actif supprimé, on réinitialise la persistance
              if (activeUserId === user.id) {
                setActiveUserIdState(null);
                await setActiveUserId(null);
              }
              Alert.alert("Supprimé", "Profil supprimé avec succès.");
            } else {
              Alert.alert("Erreur", "Impossible de supprimer ce profil.");
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const togglePrefCuisine = (cuisine: Cuisine) => {
    setPrefCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const togglePrefOption = (key: "surPlace" | "emporter" | "livraison") => {
    setPrefOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const budgetError = useMemo(() => {
    const b = Number(prefBudget);
    return Number.isNaN(b) || b <= 0 || b >= 200;
  }, [prefBudget]);

  const distanceError = useMemo(() => {
    const d = Number(prefDistance);
    return Number.isNaN(d) || d <= 0 || d > 50;
  }, [prefDistance]);

  const handleSavePreferences = async () => {
    if (!selectedUserId) {
      Alert.alert("Choisissez un utilisateur", "Sélectionnez un profil avant d'enregistrer les préférences.");
      return;
    }
    const budgetEuro = Number(prefBudget);
    const distanceKm = Number(prefDistance);

    if (budgetError || distanceError) {
      Alert.alert("Vérifiez vos champs", "Budget ou distance invalide.");
      return;
    }

    const toSave: UserPreferences = {
      cuisines: prefCuisines,
      budgetEuro,
      distanceKm,
      diet: prefDiet,
      ambiance: prefAmbiance,
      options: prefOptions,
    };

    try {
      setPrefsSaving(true);
      await savePreferencesForUser(selectedUserId, toSave);
      await updateUserAvatar(selectedUserId, avatarChoice || "user_default");
      await loadUsers(selectedUserId);
      await saveUserNote(selectedUserId, prefNote);
      Alert.alert("Succès", "Préférences mises à jour pour cet utilisateur.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer les préférences.");
    } finally {
      setPrefsSaving(false);
    }
  };

  const setActiveProfile = async (userId: number) => {
    const found = users.find((u) => u.id === userId);
    if (found) setAvatarChoice(found.avatar || "user_default");
    setActiveUserIdState(userId);
    await setActiveUserId(userId);
    setSelectedUserId(userId);
    await loadPreferencesSection(userId);
  };

  const renderUserCard = (user: any) => {
    const isEditing = editingId === user.id;
    const isSelected = selectedUserId === user.id;
    const isActive = activeUserId === user.id;
    const avatarIcon =
      AVATARS.find((a) => a.id === user.avatar)?.icon ||
      (isActive ? "person-circle" : "person");
    return (
      <TouchableOpacity
        key={user.id}
        style={[styles.userCard, isSelected && styles.userCardSelected]}
        onPress={() => setActiveProfile(user.id)}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name={avatarIcon as any} size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.editInput]}
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Nouveau nom"
            />
          ) : (
            <>
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userDate}>ID: {user.id}</Text>
            </>
          )}
        </View>
        <View style={styles.actionsRow}>
          {!isEditing && (
            <TouchableOpacity
              style={[styles.iconButton, (isSelected || isActive) && styles.iconButtonActive]}
              onPress={() => setActiveProfile(user.id)}
            >
              <Ionicons name={isActive ? "star" : "star-outline"} size={18} color="#fff" />
            </TouchableOpacity>
          )}
          {isEditing ? (
            <>
              <TouchableOpacity style={[styles.iconButton, styles.validateButton]} onPress={handleUpdateUser} disabled={loading}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.cancelButton]} onPress={cancelEditUser} disabled={loading}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.iconButton} onPress={() => startEditUser(user)}>
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={() => handleDeleteUser(user)}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color={colors.primary} />
        <Text style={styles.title}>Gestion des Profils</Text>
      </View>

      {activeUser ? (
        <View style={styles.activeCard}>
          <Ionicons name="star" size={20} color="#f5a524" />
          <Text style={styles.activeText}>Profil actif : {activeUser.username}</Text>
        </View>
      ) : (
        <View style={styles.activeCard}>
          <Ionicons name="alert-circle" size={20} color="#d14343" />
          <Text style={styles.activeText}>Aucun profil actif sélectionné</Text>
        </View>
      )}

      {users.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickSwitchRow}>
          {users.map((u) => {
            const isActive = activeUserId === u.id;
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.quickChip, isActive && styles.quickChipActive]}
                onPress={() => setActiveProfile(u.id)}
              >
                <Ionicons name={isActive ? "star" : "person"} size={14} color={isActive ? "#fff" : colors.text} />
                <Text style={[styles.quickChipText, isActive && styles.quickChipTextActive]} numberOfLines={1}>
                  {u.username}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Nouveau Profil</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre nom..."
            value={username}
            onChangeText={setUsername}
          />
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleCreateUser}
            disabled={loading}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Utilisateurs ({users.length})</Text>
        {usersLoading ? (
          <ActivityIndicator style={{ marginVertical: spacing.medium }} color={colors.primary} />
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>Aucun utilisateur pour le moment.</Text>
        ) : (
          users.map(renderUserCard)
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Préférences par défaut</Text>
        {prefsLoading ? (
          <ActivityIndicator style={{ marginVertical: spacing.medium }} color={colors.primary} />
        ) : (
          <>
            <Text style={styles.helper}>Ces choix serviront pour vos recommandations initiales.</Text>

            <Text style={styles.sectionSubtitle}>Photo de profil</Text>
            <View style={styles.wrap}>
              {AVATARS.map((a) => {
                const active = avatarChoice === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.avatarChip, active && styles.avatarChipActive]}
                    onPress={() => setAvatarChoice(a.id)}
                  >
                    <Ionicons name={a.icon as any} size={18} color={active ? "#fff" : colors.text} />
                    <Text style={[styles.avatarChipText, active && styles.avatarChipTextActive]}>{a.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: spacing.small }]}>Cuisines préférées</Text>
            <View style={styles.wrap}>
              {CUISINES.map((c) =>
                renderChip(c, prefCuisines.includes(c), () => togglePrefCuisine(c))
              )}
            </View>

            <Text style={styles.sectionSubtitle}>Budget moyen (€/pers.)</Text>
            <TextInput
              keyboardType="numeric"
              value={prefBudget}
              onChangeText={setPrefBudget}
              style={[styles.input, budgetError && styles.inputError]}
              placeholder="15"
            />
            <Text style={[styles.helper, budgetError && styles.helperError]}>
              Budget entre 1 et 199 €.
            </Text>

            <Text style={styles.sectionSubtitle}>Distance max (km)</Text>
            <TextInput
              keyboardType="numeric"
              value={prefDistance}
              onChangeText={setPrefDistance}
              style={[styles.input, distanceError && styles.inputError]}
              placeholder="5"
            />
            <Text style={[styles.helper, distanceError && styles.helperError]}>
              Distance entre 1 et 50 km.
            </Text>

            <Text style={styles.sectionSubtitle}>Régime alimentaire</Text>
            <View style={styles.wrap}>
              {DIETS.map((d) => renderChip(d, prefDiet === d, () => setPrefDiet(d)))}
            </View>

            <Text style={styles.sectionSubtitle}>Ambiance</Text>
            <View style={styles.wrap}>
              {AMBIANCES.map((a) => renderChip(a, prefAmbiance === a, () => setPrefAmbiance(a)))}
              {renderChip("Peu importe", !prefAmbiance, () => setPrefAmbiance(null))}
            </View>

            <Text style={styles.sectionSubtitle}>Options</Text>
            <View style={styles.wrap}>
              {renderChip("Sur place", prefOptions.surPlace, () => togglePrefOption("surPlace"))}
              {renderChip("À emporter", prefOptions.emporter, () => togglePrefOption("emporter"))}
              {renderChip("Livraison", prefOptions.livraison, () => togglePrefOption("livraison"))}
            </View>

            <Text style={styles.sectionSubtitle}>Notes (allergies, préférences perso)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={prefNote}
              onChangeText={setPrefNote}
              placeholder="Ex : Allergie arachides, préfère les options végétariennes."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveButton, prefsSaving && styles.buttonDisabled]}
              onPress={handleSavePreferences}
              disabled={prefsSaving}
            >
              {prefsSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer les préférences</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <Text style={styles.helper}>
          Graye est une application de recommandation de restaurants. Les données sont stockées localement sur votre appareil.
        </Text>
        <Text style={styles.helper}>
          Version : 1.0.0
        </Text>
        <Text style={styles.helper}>
          Contact : support@graye.app
        </Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Mentions légales</Text>
        <Text style={styles.helper}>
          Éditeur : Graye SAS, 10 rue Exemple, 75000 Paris.
        </Text>
        <Text style={styles.helper}>
          Hébergeur : Votre appareil (données locales) et service de distribution mobile.
        </Text>
        <Text style={styles.helper}>
          Données : aucune inscription, vos préférences sont enregistrées uniquement en local.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || "#f5f5f5",
  },
  scroll: {
    padding: spacing.large,
    paddingBottom: spacing.large * 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.large,
    gap: spacing.small,
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
    backgroundColor: (colors as any).primary + "12",
    borderRadius: 10,
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  activeText: {
    color: colors.text,
    fontWeight: "600",
  },
  quickSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
    paddingHorizontal: spacing.small,
    marginBottom: spacing.medium,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  quickChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickChipText: {
    color: colors.text,
    maxWidth: 120,
  },
  quickChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  formSection: {
    backgroundColor: "#fff",
    padding: spacing.medium,
    borderRadius: 12,
    marginBottom: spacing.large,
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.small,
    marginBottom: spacing.xsmall,
    color: colors.text,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.small,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  editInput: {
    flex: undefined,
    minWidth: 140,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  listSection: {
    backgroundColor: "#fff",
    padding: spacing.medium,
    borderRadius: 12,
    marginBottom: spacing.large,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: spacing.small,
  },
  userCardSelected: {
    backgroundColor: (colors as any).primary + "12",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inactive || "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  userDate: {
    fontSize: 12,
    color: "#888",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    backgroundColor: "#2f855a",
  },
  deleteButton: {
    backgroundColor: "#d14343",
  },
  validateButton: {
    backgroundColor: "#2f855a",
  },
  cancelButton: {
    backgroundColor: "#a0aec0",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 10,
    fontStyle: "italic",
  },
  helper: {
    color: colors.inactive,
    fontSize: 12,
    marginBottom: spacing.small,
  },
  helperError: {
    color: "#d14343",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: (colors as any).primary + "22",
    borderColor: colors.primary,
  },
  chipText: { color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: "600" },
  inputError: {
    borderColor: "#d14343",
  },
  avatarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  avatarChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  avatarChipText: { color: colors.text },
  avatarChipTextActive: { color: "#fff", fontWeight: "700" },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: spacing.medium,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fontSize.medium,
  },
});
