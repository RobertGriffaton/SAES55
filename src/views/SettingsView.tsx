import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../styles/theme";
import {
  UserProfile,
  UserPreferences,
  AVATARS,
  AvatarId,
  Cuisine,
  Diet,
  DEFAULT_PREFERENCES,
} from "../models/PreferencesModel";
import {
  getAllProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  formatMemberSince,
  getLevelProgress,
} from "../controllers/ProfileController";

// Mapping des images avatars
const AVATAR_IMAGES: Record<AvatarId, any> = {
  burger: require("../../assets/avatar_burger.png"),
  pizza: require("../../assets/avatar_pizza.png"),
  sushi: require("../../assets/avatar_sushi.png"),
  taco: require("../../assets/avatar_taco.png"),
  cupcake: require("../../assets/avatar_cupcake.png"),
};

// Cuisines disponibles avec emojis
const CUISINES_WITH_EMOJIS: { id: Cuisine; emoji: string; label: string }[] = [
  { id: "Amérique", emoji: "🍔", label: "US" },
  { id: "Maghreb", emoji: "🌮", label: "Mexicain" },
  { id: "Japonais", emoji: "🍣", label: "Japonais" },
  { id: "Italien", emoji: "🍝", label: "Italien" },
  { id: "Afrique", emoji: "🥘", label: "Africain" },
  { id: "Inde", emoji: "🍛", label: "Indien" },
];

// Régimes disponibles
const DIETS: { id: Diet; label: string; emoji?: string }[] = [
  { id: "Aucune", label: "Aucun", emoji: "🚫" },
  { id: "Végétarien", label: "Végétarien" },
  { id: "Végan", label: "Végan" },
];

// Titres de niveau
const LEVEL_TITLES = [
  "Débutant Foodie",
  "Apprenti Gourmet",
  "Explorateur Culinaire",
  "Fin Gourmet",
  "Expert Foodie",
  "Maître Culinaire",
  "Chef Amateur",
  "Critique Étoilé",
  "Légende Gastronomique",
  "Dieu de la Bouffe",
];

export const SettingsView = () => {
  const [activeProfile, setActiveProfileState] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les préférences
  const [selectedDiet, setSelectedDiet] = useState<Diet>("Aucune");
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>([]);
  const [distanceKm, setDistanceKm] = useState(5);

  // Modals
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [selectedAvatarForNew, setSelectedAvatarForNew] = useState<AvatarId>("burger");
  const [editingName, setEditingName] = useState("");

  // Charger les données
  const loadData = useCallback(async () => {
    setLoading(true);
    const allProfiles = await getAllProfiles();
    const active = await getActiveProfile();

    setProfiles(allProfiles);
    setActiveProfileState(active);

    if (active) {
      // Charger les préférences du profil actif
      const prefs = active.preferences;
      setSelectedDiet(prefs.diet);
      setSelectedCuisines(prefs.cuisines);
      setDistanceKm(prefs.distanceKm);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Créer un nouveau profil
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }

    const newProfile = await createProfile(newProfileName.trim(), selectedAvatarForNew);
    setNewProfileName("");
    setShowProfileModal(false);
    await setActiveProfile(newProfile.id);
    loadData();
    Alert.alert("Succès", `Profil "${newProfile.name}" créé !`);
  };

  // Changer de profil actif
  const handleSwitchProfile = async (profileId: string) => {
    await setActiveProfile(profileId);
    loadData();
  };

  // Supprimer un profil
  const handleDeleteProfile = (profile: UserProfile) => {
    if (profiles.length <= 1) {
      Alert.alert("Erreur", "Vous devez garder au moins un profil.");
      return;
    }

    Alert.alert(
      "Supprimer le profil",
      `Voulez-vous vraiment supprimer "${profile.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteProfile(profile.id);
            loadData();
          },
        },
      ]
    );
  };

  // Changer l'avatar
  const handleChangeAvatar = async (avatarId: AvatarId) => {
    if (!activeProfile) return;
    await updateProfile(activeProfile.id, { avatar: avatarId });
    setShowAvatarModal(false);
    loadData();
  };

  // Modifier le nom
  const handleUpdateName = async () => {
    if (!activeProfile || !editingName.trim()) return;
    await updateProfile(activeProfile.id, { name: editingName.trim() });
    setShowEditNameModal(false);
    loadData();
  };

  // Toggle cuisine
  const toggleCuisine = (cuisine: Cuisine) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // Sauvegarder les préférences
  const handleSavePreferences = async () => {
    if (!activeProfile) return;

    const newPrefs: UserPreferences = {
      ...activeProfile.preferences,
      diet: selectedDiet,
      cuisines: selectedCuisines,
      distanceKm: distanceKm,
    };

    await updateProfile(activeProfile.id, { preferences: newPrefs });
    Alert.alert("Succès", "Vos préférences ont été enregistrées !");
    loadData();
  };

  // Calculer le pourcentage de distance
  const getDistancePercentage = () => {
    return ((distanceKm - 1) / 19) * 100;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  // Si pas de profil, proposer d'en créer un
  if (!activeProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-add" size={64} color={colors.grayePurple} />
          <Text style={styles.emptyTitle}>Bienvenue !</Text>
          <Text style={styles.emptyText}>Créez votre premier profil pour commencer.</Text>
          <TouchableOpacity
            style={styles.createFirstProfileBtn}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.createFirstProfileText}>Créer un profil</Text>
          </TouchableOpacity>
        </View>

        {/* Modal création profil - inline pour l'early return */}
        <Modal visible={showProfileModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouveau Profil</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nom du profil..."
                value={newProfileName}
                onChangeText={setNewProfileName}
              />

              <Text style={styles.modalSubtitle}>Choisis un avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      selectedAvatarForNew === avatar.id && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setSelectedAvatarForNew(avatar.id)}
                  >
                    <Image source={AVATAR_IMAGES[avatar.id]} style={styles.avatarOptionImg} />
                    <Text style={styles.avatarOptionName}>{avatar.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => {
                    setShowProfileModal(false);
                    setNewProfileName("");
                  }}
                >
                  <Text style={styles.modalBtnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handleCreateProfile}
                >
                  <Text style={styles.modalBtnConfirmText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const levelProgress = getLevelProgress(activeProfile);
  const levelTitle = LEVEL_TITLES[Math.min(activeProfile.level - 1, LEVEL_TITLES.length - 1)];

  // Modal de sélection d'avatar
  const renderAvatarModal = () => (
    <Modal visible={showAvatarModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisis ton avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarOption,
                  activeProfile.avatar === avatar.id && styles.avatarOptionSelected,
                ]}
                onPress={() => handleChangeAvatar(avatar.id)}
              >
                <Image source={AVATAR_IMAGES[avatar.id]} style={styles.avatarOptionImg} />
                <Text style={styles.avatarOptionName}>{avatar.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setShowAvatarModal(false)}
          >
            <Text style={styles.modalCloseBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal création/gestion profils
  const renderProfileModal = () => (
    <Modal visible={showProfileModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nouveau Profil</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Nom du profil..."
            value={newProfileName}
            onChangeText={setNewProfileName}
          />

          <Text style={styles.modalSubtitle}>Choisis un avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarOption,
                  selectedAvatarForNew === avatar.id && styles.avatarOptionSelected,
                ]}
                onPress={() => setSelectedAvatarForNew(avatar.id)}
              >
                <Image source={AVATAR_IMAGES[avatar.id]} style={styles.avatarOptionImg} />
                <Text style={styles.avatarOptionName}>{avatar.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => {
                setShowProfileModal(false);
                setNewProfileName("");
              }}
            >
              <Text style={styles.modalBtnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnConfirm]}
              onPress={handleCreateProfile}
            >
              <Text style={styles.modalBtnConfirmText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal édition nom
  const renderEditNameModal = () => (
    <Modal visible={showEditNameModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Modifier le nom</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Nouveau nom..."
            value={editingName}
            onChangeText={setEditingName}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => setShowEditNameModal(false)}
            >
              <Text style={styles.modalBtnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnConfirm]}
              onPress={handleUpdateName}
            >
              <Text style={styles.modalBtnConfirmText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header avec profil */}
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil</Text>

        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarModal(true)}
          >
            <Image
              source={AVATAR_IMAGES[activeProfile.avatar]}
              style={styles.avatarImage}
            />
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TouchableOpacity
              onPress={() => {
                setEditingName(activeProfile.name);
                setShowEditNameModal(true);
              }}
              style={styles.profileNameContainer}
            >
              <Text style={styles.profileName}>{activeProfile.name}</Text>
              <Ionicons name="pencil" size={14} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.memberSince}>
              Membre depuis {formatMemberSince(activeProfile.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Contenu scrollable */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Section Profils */}
        {profiles.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="people" size={14} color={colors.grayePurple} /> Changer de profil
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.profilesRow}>
                {profiles.map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.profilePill,
                      profile.id === activeProfile.id && styles.profilePillActive,
                    ]}
                    onPress={() => handleSwitchProfile(profile.id)}
                  >
                    <Image
                      source={AVATAR_IMAGES[profile.avatar]}
                      style={styles.profilePillAvatar}
                    />
                    <Text
                      style={[
                        styles.profilePillName,
                        profile.id === activeProfile.id && styles.profilePillNameActive,
                      ]}
                    >
                      {profile.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.addProfileBtn}
                  onPress={() => setShowProfileModal(true)}
                >
                  <Ionicons name="add" size={20} color={colors.grayePurple} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Bouton ajouter profil si un seul */}
        {profiles.length === 1 && (
          <TouchableOpacity
            style={styles.addProfileSingleBtn}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name="person-add" size={18} color={colors.grayePurple} />
            <Text style={styles.addProfileSingleText}>Ajouter un profil</Text>
          </TouchableOpacity>
        )}

        {/* Section Régime */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="nutrition" size={14} color={colors.grayePurple} /> Régime Spécial
          </Text>
          <View style={styles.dietRow}>
            {DIETS.map((diet) => (
              <TouchableOpacity
                key={diet.id}
                style={[
                  styles.dietBtn,
                  selectedDiet === diet.id && styles.dietBtnSelected,
                ]}
                onPress={() => setSelectedDiet(selectedDiet === diet.id ? "Aucune" : diet.id)}
              >
                {selectedDiet === diet.id && (
                  <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />
                )}
                {diet.emoji && (
                  <Text style={{ marginRight: 4 }}>{diet.emoji}</Text>
                )}
                <Text
                  style={[
                    styles.dietText,
                    selectedDiet === diet.id && styles.dietTextSelected,
                  ]}
                >
                  {diet.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section Cuisines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="globe" size={14} color={colors.grayePurple} /> Cuisines Fav'
            </Text>
            <Text style={styles.sectionCount}>{selectedCuisines.length} sélectionnées</Text>
          </View>
          <View style={styles.cuisineGrid}>
            {CUISINES_WITH_EMOJIS.map((cuisine) => (
              <TouchableOpacity
                key={cuisine.id}
                style={[
                  styles.cuisineBtn,
                  selectedCuisines.includes(cuisine.id) && styles.cuisineBtnSelected,
                ]}
                onPress={() => toggleCuisine(cuisine.id)}
              >
                <Text
                  style={[
                    styles.cuisineEmoji,
                    !selectedCuisines.includes(cuisine.id) && styles.cuisineEmojiInactive,
                  ]}
                >
                  {cuisine.emoji}
                </Text>
                <Text
                  style={[
                    styles.cuisineLabel,
                    selectedCuisines.includes(cuisine.id) && styles.cuisineLabelSelected,
                  ]}
                >
                  {cuisine.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location" size={14} color={colors.grayePurple} /> Distance Max
          </Text>
          <View style={styles.distanceCard}>
            <View style={styles.distanceLabels}>
              <Text style={styles.distanceLabel}>1 km</Text>
              <Text style={[styles.distanceLabel, styles.distanceLabelActive]}>{distanceKm} km</Text>
              <Text style={styles.distanceLabel}>20 km</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${getDistancePercentage()}%` }]} />
              <View
                style={[styles.sliderThumb, { left: `${getDistancePercentage()}%` }]}
              />
            </View>
            <View style={styles.sliderButtons}>
              <TouchableOpacity
                style={styles.sliderBtn}
                onPress={() => setDistanceKm(Math.max(1, distanceKm - 1))}
              >
                <Ionicons name="remove" size={18} color={colors.grayePurple} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sliderBtn}
                onPress={() => setDistanceKm(Math.min(20, distanceKm + 1))}
              >
                <Ionicons name="add" size={18} color={colors.grayePurple} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bouton Sauvegarder */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePreferences}>
          <Text style={styles.saveBtnText}>Enregistrer mes goûts</Text>
        </TouchableOpacity>

        {/* Bouton Supprimer le profil */}
        {profiles.length > 1 && (
          <TouchableOpacity
            style={styles.deleteProfileBottomBtn}
            onPress={() => handleDeleteProfile(activeProfile)}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
            <Text style={styles.deleteProfileBottomText}>Supprimer ce profil</Text>
          </TouchableOpacity>
        )}

        {/* Mentions légales */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Mentions Légales</Text>
          <Text style={styles.footerText}>
            Graye - Application de découverte culinaire{"\n"}
            © 2025 Graye. Tous droits réservés.{"\n"}
            Données stockées localement sur votre appareil.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

      </ScrollView>

      {/* Modals */}
      {renderAvatarModal()}
      {renderProfileModal()}
      {renderEditNameModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.large,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.medium,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.small,
  },
  createFirstProfileBtn: {
    backgroundColor: colors.grayePurple,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: spacing.large,
  },
  createFirstProfileText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: spacing.large,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.medium,
  },

  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.grayeSurface,
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#fff",
  },
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.grayeOrange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  levelBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  profileNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.grayePurple,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  memberSince: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressBar: {
    width: 128,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.grayePurple,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    color: colors.grayePurple,
    fontWeight: "700",
    marginTop: 4,
  },

  // Scroll View
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.large,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
  },

  // Profiles Row
  profilesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profilePillContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteProfileBtn: {
    marginLeft: 4,
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#ffeeee",
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  profilePillActive: {
    backgroundColor: colors.grayePurple + "15",
    borderColor: colors.grayePurple,
  },
  profilePillAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profilePillName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  profilePillNameActive: {
    color: colors.grayePurple,
  },
  addProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.grayePurple,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addProfileSingleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.grayePurple,
    borderRadius: 12,
    borderStyle: "dashed",
  },
  addProfileSingleText: {
    color: colors.grayePurple,
    fontWeight: "600",
  },

  // Budget
  budgetRow: {
    flexDirection: "row",
    gap: 12,
  },
  budgetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  budgetBtnSelected: {
    borderWidth: 2,
    borderColor: colors.grayePurple,
    backgroundColor: colors.grayePurple + "15",
    transform: [{ scale: 1.02 }],
  },
  budgetSymbol: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textMuted,
  },
  budgetSymbolSelected: {
    color: colors.grayePurple,
  },
  budgetLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  budgetLabelSelected: {
    color: colors.grayePurple,
  },

  // Diet
  dietRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dietBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  dietBtnSelected: {
    backgroundColor: colors.grayePurple,
    borderColor: colors.grayePurple,
    shadowColor: colors.grayePurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dietText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  dietTextSelected: {
    color: "#fff",
  },

  // Cuisines Grid
  cuisineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cuisineBtn: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  cuisineBtnSelected: {
    backgroundColor: colors.grayePurple,
    borderColor: colors.grayePurple,
    shadowColor: colors.grayePurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cuisineEmoji: {
    fontSize: 24,
  },
  cuisineEmojiInactive: {
    opacity: 0.5,
  },
  cuisineLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  cuisineLabelSelected: {
    color: "#fff",
  },

  // Distance
  distanceCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    borderRadius: 16,
  },
  distanceLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  distanceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  distanceLabelActive: {
    color: colors.grayeOrange,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    position: "relative",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: colors.grayeOrange,
    borderRadius: 4,
  },
  sliderThumb: {
    position: "absolute",
    top: -8,
    marginLeft: -12,
    width: 24,
    height: 24,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: colors.grayeOrange,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 16,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.grayePurple + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  // Save Button
  saveBtn: {
    backgroundColor: colors.grayeOrange,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.grayeOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  deleteProfileBottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ffcccc",
    borderRadius: 12,
    backgroundColor: "#fff5f5",
  },
  deleteProfileBottomText: {
    color: "#ff4444",
    fontSize: 14,
    fontWeight: "600",
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
    paddingBottom: 120,
    alignItems: "center",
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    fontWeight: "600",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.large,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  avatarOption: {
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: colors.grayePurple,
    backgroundColor: colors.grayePurple + "15",
  },
  avatarOptionImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarOptionName: {
    fontSize: 16,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: colors.grayeSurface,
  },
  modalBtnCancelText: {
    color: colors.text,
    fontWeight: "600",
  },
  modalBtnConfirm: {
    backgroundColor: colors.grayePurple,
  },
  modalBtnConfirmText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});