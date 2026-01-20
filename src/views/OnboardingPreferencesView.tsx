import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { setOnboardingDone } from "../controllers/PreferencesController";
import {
  createProfile,
  updateProfile,
  setActiveProfile,
} from "../controllers/ProfileController";
import {
  Cuisine,
  Diet,
  DEFAULT_PREFERENCES,
  AVATARS,
  AvatarId,
} from "../models/PreferencesModel";
import { colors, spacing } from "../styles/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mapping des images avatars
const AVATAR_IMAGES: Record<AvatarId, any> = {
  burger: require("../../assets/avatar_burger.png"),
  pizza: require("../../assets/avatar_pizza.png"),
  sushi: require("../../assets/avatar_sushi.png"),
  taco: require("../../assets/avatar_taco.png"),
  cupcake: require("../../assets/avatar_cupcake.png"),
};

// Cuisines pour la grille (toutes les catégories)
const CUISINES_GRID: { id: Cuisine; emoji: string; label: string }[] = [
  { id: "Amérique", emoji: "🍔", label: "Burger" },
  { id: "Japonais", emoji: "🍣", label: "Japonais" },
  { id: "Italien", emoji: "🍕", label: "Pizza" },
  { id: "Europe", emoji: "🥗", label: "Healthy" },
  { id: "Maghreb", emoji: "🥙", label: "Kebab" },
  { id: "Mexique", emoji: "🌮", label: "Tacos" },
  // Page 2
  { id: "Français", emoji: "🧀", label: "Français" },
  { id: "Chinois", emoji: "🥡", label: "Chinois" },
  { id: "Asiatique", emoji: "🍜", label: "Asiatique" },
  { id: "Thai", emoji: "🍛", label: "Thaï" },
  { id: "Vietnamien", emoji: "🍲", label: "Vietnamien" },
  { id: "Coréen", emoji: "🍱", label: "Coréen" },
  // Page 3
  { id: "Afrique", emoji: "🥘", label: "Africain" },
  { id: "Oriental", emoji: "🧆", label: "Oriental" },
  { id: "Grec", emoji: "🥚", label: "Grec" },
  { id: "Latino", emoji: "🌶️", label: "Latino" },
  { id: "Poulet", emoji: "🍗", label: "Poulet" },
  { id: "Sandwich", emoji: "🥪", label: "Sandwich" },
  // Page 4
  { id: "FastFood", emoji: "🌟", label: "Fast Food" },
  { id: "Café", emoji: "☕", label: "Café" },
  { id: "Pâtisserie", emoji: "🧁", label: "Pâtisserie" },
  { id: "Crêperie", emoji: "🥞", label: "Crêperie" },
  { id: "Grill", emoji: "🥩", label: "Grill" },
  { id: "FruitsDeMer", emoji: "🦐", label: "Fruits de mer" },
  // Page 5
  { id: "Américain", emoji: "🍟", label: "Américain" },
  { id: "Espagnol", emoji: "🥘", label: "Espagnol" },
  { id: "Turc", emoji: "🧇", label: "Turc" },
  { id: "Créole", emoji: "🌴", label: "Créole" },
  { id: "Méditerranéen", emoji: "🌿", label: "Méditerranéen" },
  { id: "BubbleTea", emoji: "🧋", label: "Bubble Tea" },
];

// Contraintes alimentaires
const DIETS_LIST: { id: Diet; emoji: string; label: string }[] = [
  { id: "Végétarien", emoji: "🧀", label: "Végétarien" },
  { id: "Aucune", emoji: "🥩", label: "Aucune" },
  { id: "Végan", emoji: "🌱", label: "Végan" },
];

export function OnboardingPreferencesView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // États
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>("burger");
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>([]);
  const [surPlace, setSurPlace] = useState(true);
  const [emporter, setEmporter] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState<Diet>("Aucune");

  // Toggle cuisine
  const toggleCuisine = (cuisine: Cuisine) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // Terminer l'onboarding et créer le profil
  const handleComplete = async () => {
    if (!username.trim()) {
      Alert.alert("Erreur", "Entre ton prénom pour continuer.");
      return;
    }

    try {
      // Créer le profil
      const profile = await createProfile(username.trim(), selectedAvatar);

      // Mettre à jour avec les préférences
      await updateProfile(profile.id, {
        preferences: {
          ...DEFAULT_PREFERENCES,
          cuisines: selectedCuisines,
          diet: selectedDiet,
          options: {
            surPlace: surPlace,
            emporter: emporter,
            livraison: false,
          },
        },
      });

      // Définir comme profil actif
      await setActiveProfile(profile.id);

      // Marquer l'onboarding comme terminé
      await setOnboardingDone();

      // Naviguer vers l'app
      onDone();
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer ton profil.");
    }
  };

  // Écran 1: Prénom + Avatar
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Blobs décoratifs */}
      <View style={styles.blobPurple} />
      <View style={styles.blobOrange} />

      <View style={styles.step1Content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NOUVEAU PROFIL</Text>
        </View>

        {/* Titre */}
        <Text style={styles.title}>
          Comment on{"\n"}t'appelle ? 👋
        </Text>

        {/* Avatar selector */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.mainAvatarContainer}>
            <Image
              source={AVATAR_IMAGES[selectedAvatar]}
              style={styles.mainAvatar}
            />
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Avatar choices */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.avatarScroll}
            contentContainerStyle={styles.avatarScrollContent}
          >
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarChoice,
                  selectedAvatar === avatar.id && styles.avatarChoiceSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
              >
                <Image
                  source={AVATAR_IMAGES[avatar.id]}
                  style={styles.avatarChoiceImg}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input prénom */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>PSEUDONYME</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ex: Chef_Cuisisto"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
            />
            <Ionicons name="person" size={20} color={colors.textMuted} style={styles.inputIcon} />
          </View>
          <Text style={styles.inputHint}>
            Ce nom sera utilisé pour ton profil Graye.{"\n"}
            Tu pourras créer d'autres profils plus tard.
          </Text>
        </View>

        {/* Bouton Continuer */}
        <TouchableOpacity
          style={[styles.continueBtn, !username.trim() && styles.continueBtnDisabled]}
          onPress={() => username.trim() && setStep(2)}
          disabled={!username.trim()}
        >
          <Text style={styles.continueBtnText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Écran 2: Cuisines
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.stepTitle}>Tes Cibles 🎯</Text>
      <Text style={styles.stepSubtitle}>Sélectionne tes cuisines préférées.</Text>

      {/* Grille cuisines avec pagination horizontale */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.cuisineScrollView}
        contentContainerStyle={{ paddingRight: 0 }}
      >
        {Array.from({ length: Math.ceil(CUISINES_GRID.length / 6) }).map((_, pageIndex) => (
          <View key={pageIndex} style={styles.cuisinePage}>
            <View style={styles.cuisineGrid}>
              {CUISINES_GRID.slice(pageIndex * 6, (pageIndex + 1) * 6).map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine.id);
                return (
                  <TouchableOpacity
                    key={cuisine.id}
                    style={[
                      styles.cuisineCard,
                      isSelected && styles.cuisineCardSelected,
                    ]}
                    onPress={() => toggleCuisine(cuisine.id)}
                  >
                    {isSelected && (
                      <View style={styles.cuisineCheck}>
                        <Ionicons name="checkmark" size={12} color={colors.grayePurple} />
                      </View>
                    )}
                    <Text style={[styles.cuisineEmoji, !isSelected && styles.cuisineEmojiInactive]}>
                      {cuisine.emoji}
                    </Text>
                    <Text style={[styles.cuisineLabel, isSelected && styles.cuisineLabelSelected]}>
                      {cuisine.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Indicateur de page */}
            <View style={styles.pageIndicator}>
              {Array.from({ length: Math.ceil(CUISINES_GRID.length / 6) }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.pageDot, i === pageIndex && styles.pageDotActive]}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, selectedCuisines.length === 0 && styles.fabDisabled]}
        onPress={() => selectedCuisines.length > 0 && setStep(3)}
        disabled={selectedCuisines.length === 0}
      >
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Écran 3: Réglages
  const renderStep3 = () => (
    <View style={[styles.stepContainer, { backgroundColor: colors.grayeSurface }]}>
      {/* Header */}
      <View style={styles.settingsHeader}>
        <Text style={styles.stepTitle}>Derniers réglages ⚙️</Text>
      </View>

      <ScrollView
        style={styles.settingsScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode repas */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsCardHeader}>
            <View style={[styles.settingsIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="restaurant" size={14} color={colors.grayeOrange} />
            </View>
            <Text style={styles.settingsCardTitle}>Tu manges comment ?</Text>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                surPlace && styles.toggleOptionSelected,
              ]}
              onPress={() => setSurPlace(!surPlace)}
            >
              <Ionicons
                name="restaurant"
                size={14}
                color={surPlace ? "#fff" : colors.textMuted}
              />
              <Text style={[
                styles.toggleText,
                surPlace && styles.toggleTextSelected,
              ]}>
                Sur place
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                emporter && styles.toggleOptionSelected,
              ]}
              onPress={() => setEmporter(!emporter)}
            >
              <Ionicons
                name="bag-handle"
                size={14}
                color={emporter ? "#fff" : colors.textMuted}
              />
              <Text style={[
                styles.toggleText,
                emporter && styles.toggleTextSelected,
              ]}>
                À Emporter
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contraintes */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsCardHeader}>
            <View style={[styles.settingsIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="leaf" size={14} color={colors.grayePurple} />
            </View>
            <Text style={styles.settingsCardTitle}>Des contraintes ?</Text>
          </View>

          <View style={styles.dietList}>
            {DIETS_LIST.map((diet) => {
              const isSelected = selectedDiet === diet.id;
              return (
                <TouchableOpacity
                  key={diet.id}
                  style={[
                    styles.dietItem,
                    isSelected && styles.dietItemSelected,
                    !isSelected && styles.dietItemInactive,
                  ]}
                  onPress={() => setSelectedDiet(diet.id)}
                >
                  <View style={styles.dietLeft}>
                    <Text style={styles.dietEmoji}>{diet.emoji}</Text>
                    <Text style={[
                      styles.dietLabel,
                      isSelected && styles.dietLabelSelected,
                    ]}>
                      {diet.label}
                    </Text>
                  </View>
                  <View style={[
                    styles.dietCheck,
                    isSelected && styles.dietCheckSelected,
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.settingsFooter}>
        <TouchableOpacity style={styles.profileBtn} onPress={() => setStep(4)}>
          <Text style={styles.profileBtnText}>Voir mon profil</Text>
          <Ionicons name="id-card" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Écran 4: GRAYE CARD
  const renderStep4 = () => (
    <View style={[styles.stepContainer, styles.cardScreen]}>
      {/* Pattern background */}
      <View style={styles.patternBg} />

      {/* Card */}
      <View style={styles.grayeCard}>
        {/* Header noir */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>GRAYE CARD</Text>
          <Ionicons name="wifi" size={16} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: "90deg" }] }} />
        </View>

        {/* Avatar sur la bordure */}
        <View style={styles.cardAvatarContainer}>
          <Image source={AVATAR_IMAGES[selectedAvatar]} style={styles.cardAvatar} />
        </View>

        {/* Contenu */}
        <View style={styles.cardContent}>
          <View style={styles.cardMember}>
            <Text style={styles.cardMemberLabel}>MEMBRE</Text>
            <Text style={styles.cardMemberName}>{username || "Chef"}</Text>
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoLabel}>CUISINES</Text>
              <View style={styles.cardTags}>
                {selectedCuisines.slice(0, 3).map((c) => {
                  const cuisine = CUISINES_GRID.find((cg) => cg.id === c);
                  return (
                    <View key={c} style={styles.cardTag}>
                      <Text style={styles.cardTagText}>{cuisine?.label || c}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoLabel}>MODE</Text>
              <View style={styles.cardInfoValue}>
                <Ionicons
                  name={emporter ? "bag-handle" : "restaurant"}
                  size={14}
                  color={colors.grayeOrange}
                />
                <Text style={styles.cardInfoText}>
                  {surPlace && emporter ? "Les deux" : emporter ? "Emporter" : "Sur place"}
                </Text>
              </View>
            </View>

            <View style={styles.cardInfoItem}>
              <Text style={styles.cardInfoLabel}>RÉGIME</Text>
              <View style={styles.cardInfoValue}>
                <Ionicons name="leaf" size={14} color="#4CAF50" />
                <Text style={styles.cardInfoText}>{selectedDiet}</Text>
              </View>
            </View>
          </View>

          {/* Espace décoratif */}
          <View style={styles.cardBarcode} />
        </View>

        {/* Déco dots */}
        <View style={[styles.dot, { top: 120, right: 16, backgroundColor: "#FFEB3B" }]} />
        <View style={[styles.dot, { top: 140, right: 32, backgroundColor: colors.grayePurple, width: 6, height: 6 }]} />
        <View style={[styles.dot, { top: 110, right: 40, backgroundColor: colors.grayeOrange }]} />
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.launchBtn} onPress={handleComplete}>
        <Text style={styles.launchBtnText}>C'est parti !</Text>
        <Ionicons name="rocket" size={20} color={colors.grayePurple} />
      </TouchableOpacity>
    </View>
  );

  // Render
  return (
    <View style={styles.container}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  stepContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Blobs décoratifs
  blobPurple: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: colors.grayePurple + "15",
  },
  blobOrange: {
    position: "absolute",
    bottom: -50,
    left: -50,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: colors.grayeOrange + "15",
  },

  // Step 1
  step1Content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: colors.grayeSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: colors.grayePurple,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 32,
  },

  // Avatar section
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  mainAvatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.grayeSurface,
    overflow: "visible",
    marginBottom: 16,
  },
  mainAvatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grayeOrange,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarScroll: {
    maxHeight: 70,
  },
  avatarScrollContent: {
    paddingHorizontal: 8,
    gap: 12,
    flexDirection: "row",
  },
  avatarChoice: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "transparent",
    overflow: "hidden",
  },
  avatarChoiceSelected: {
    borderColor: colors.grayePurple,
  },
  avatarChoiceImg: {
    width: "100%",
    height: "100%",
  },

  // Input
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    backgroundColor: colors.grayeSurface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputIcon: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -10,
  },
  inputHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
  },

  // Continue button
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: "auto",
    marginBottom: 40,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grayeSurface,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBar: {
    width: 96,
    height: 8,
    backgroundColor: colors.grayeSurface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.grayePurple,
    borderRadius: 4,
  },

  // Step titles
  stepTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    paddingHorizontal: 24,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 16,
  },

  // Cuisines
  cuisineScrollView: {
    flex: 1,
  },
  cuisineScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cuisinePage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grayeSurface,
  },
  pageDotActive: {
    backgroundColor: colors.grayePurple,
    width: 24,
  },
  cuisineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cuisineCard: {
    width: "47%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.grayeSurface,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cuisineCardSelected: {
    backgroundColor: colors.grayePurple,
    borderColor: colors.grayePurple,
    shadowColor: colors.grayePurple,
    shadowOpacity: 0.3,
  },
  cuisineCheck: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  cuisineEmoji: {
    fontSize: 40,
  },
  cuisineEmojiInactive: {
    opacity: 0.8,
  },
  cuisineLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  cuisineLabelSelected: {
    color: "#fff",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.grayeOrange,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.grayeOrange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabDisabled: {
    opacity: 0.5,
  },

  // Settings (Step 3)
  settingsHeader: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  settingsScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  settingsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  settingsIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  // Toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.grayeSurface,
    borderRadius: 16,
    padding: 6,
    height: 64,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  toggleOptionSelected: {
    backgroundColor: colors.grayeOrange,
    shadowColor: colors.grayeOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  toggleTextSelected: {
    color: "#fff",
  },

  // Diet list
  dietList: {
    gap: 12,
  },
  dietItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  dietItemSelected: {
    borderColor: colors.grayePurple,
    backgroundColor: colors.grayePurple + "10",
  },
  dietItemInactive: {
    opacity: 0.6,
  },
  dietLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dietEmoji: {
    fontSize: 20,
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  dietLabelSelected: {
    color: colors.grayePurple,
  },
  dietCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  dietCheckSelected: {
    backgroundColor: colors.grayePurple,
    borderColor: colors.grayePurple,
  },

  // Settings footer
  settingsFooter: {
    padding: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  profileBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // Card screen (Step 4)
  cardScreen: {
    backgroundColor: colors.grayePurple,
    justifyContent: "center",
    alignItems: "center",
  },
  patternBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  grayeCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  cardHeader: {
    backgroundColor: colors.text,
    padding: 24,
    paddingBottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  cardAvatarContainer: {
    position: "absolute",
    top: 56,
    left: 24,
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
    zIndex: 10,
  },
  cardAvatar: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cardMember: {
    marginBottom: 24,
  },
  cardMemberLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardMemberName: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  cardInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  cardInfoItem: {
    width: "45%",
  },
  cardInfoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  cardTag: {
    backgroundColor: colors.grayePurple + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cardTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.grayePurple,
  },
  cardInfoValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardInfoText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  cardBarcode: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderStyle: "dashed",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    opacity: 0.5,
  },
  barcodeLines: {
    width: 96,
    height: 24,
    backgroundColor: colors.text,
  },
  cardId: {
    fontSize: 10,
    fontFamily: "monospace",
    color: colors.textMuted,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Launch button
  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginTop: 32,
    gap: 12,
  },
  launchBtnText: {
    color: colors.grayePurple,
    fontSize: 20,
    fontWeight: "900",
  },
});
