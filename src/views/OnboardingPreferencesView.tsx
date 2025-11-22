import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  savePreferences,
  setOnboardingDone,
} from "../controllers/PreferencesController";
import {
  DEFAULT_PREFERENCES,
  DietPreference,
  RestaurantType,
  UserPreferences,
} from "../models/PreferencesModel";
import { colors, fontSize, spacing } from "../styles/theme";

interface Props {
  onDone: () => void;
}

const TYPE_OPTIONS: { value: RestaurantType; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "fast_food", label: "Fast food" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar" },
  { value: "pub", label: "Pub" },
  { value: "ice_cream", label: "Glacier" },
  { value: "food_court", label: "Food court" },
  { value: "biergarten", label: "Biergarten" },
];

const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: "none", label: "Aucune preference" },
  { value: "vegetarian", label: "Vegetarien" },
  { value: "vegan", label: "Vegan" },
];

export const OnboardingPreferencesView: React.FC<Props> = ({ onDone }) => {
  const [preferredTypes, setPreferredTypes] = useState<RestaurantType[]>(
    DEFAULT_PREFERENCES.preferredTypes
  );
  const [diet, setDiet] = useState<DietPreference>(DEFAULT_PREFERENCES.diet);
  const [takeawayPreferred, setTakeawayPreferred] = useState(
    DEFAULT_PREFERENCES.takeawayPreferred
  );
  const [saving, setSaving] = useState(false);

  const toggleType = (type: RestaurantType) => {
    setPreferredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const onContinue = async () => {
    if (preferredTypes.length === 0) {
      Alert.alert("Choisis au moins un type de lieu.");
      return;
    }

    const prefs: UserPreferences = {
      preferredTypes,
      diet,
      takeawayPreferred,
    };

    try {
      setSaving(true);
      await savePreferences(prefs);
      await setOnboardingDone();
      onDone();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer tes preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons
            name="restaurant-outline"
            size={32}
            color={colors.primary}
          />
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>On garde l'essentiel</Text>
            <Text style={styles.subtitle}>
              Types de lieux, regime (vege/vegan) et a emporter pour adapter les
              suggestions.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Types de lieux</Text>
        <Text style={styles.sectionSubtitle}>
          Tu peux en choisir plusieurs.
        </Text>
        <View style={styles.chipContainer}>
          {TYPE_OPTIONS.map((t) => {
            const active = preferredTypes.includes(t.value);
            return (
              <Pressable
                key={t.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleType(t.value)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Restrictions alimentaires</Text>
        <Text style={styles.sectionSubtitle}>
          Nous filtrons seulement quand l'info existe dans le jeu de donnees.
        </Text>
        <View style={styles.chipContainer}>
          {DIET_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, diet === option.value && styles.chipActive]}
              onPress={() => setDiet(option.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  diet === option.value && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Vente à emporter</Text>
          <Text style={styles.sectionSubtitle}>
            Choisis si tu veux privilegier les lieux qui proposent l'emporter.
          </Text>
          <View style={styles.chipContainer}>
            <Pressable
              style={[styles.chip, !takeawayPreferred && styles.chipActive]}
              onPress={() => setTakeawayPreferred(false)}
            >
              <Text
                style={[
                  styles.chipText,
                  !takeawayPreferred && styles.chipTextActive,
                ]}
              >
                Peu importe
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, takeawayPreferred && styles.chipActive]}
              onPress={() => setTakeawayPreferred(true)}
            >
              <Text
                style={[
                  styles.chipText,
                  takeawayPreferred && styles.chipTextActive,
                ]}
              >
                Favoriser à emporter
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Pressable
        style={[
          styles.mainButton,
          (preferredTypes.length === 0 || saving) && styles.mainButtonDisabled,
        ]}
        onPress={onContinue}
        disabled={saving || preferredTypes.length === 0}
      >
        <Text style={styles.mainButtonText}>
          {saving ? "Enregistrement..." : "Continuer"}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xlarge,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.large,
    marginBottom: spacing.large,
  },
  headerTextBlock: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xsmall,
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xsmall,
  },
  sectionSubtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    marginBottom: spacing.medium,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
    marginBottom: spacing.large,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSize.small,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  block: {
    marginTop: spacing.medium,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.medium,
  },
  mainButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    borderRadius: 999,
    alignItems: "center",
    marginHorizontal: spacing.large,
    marginBottom: spacing.large,
  },
  mainButtonDisabled: {
    opacity: 0.5,
  },
  mainButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: fontSize.body,
  },
});
