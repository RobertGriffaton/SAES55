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
import { DietPreference, UserPreferences } from "../models/PreferencesModel";
import { colors, fontSize, spacing } from "../styles/theme";

interface Props {
  onDone: () => void;
}

// Types de lieux : tu peux adapter cette liste à ton dataset
const TYPE_OPTIONS = [
  "restaurant",
  "cafe",
  "fast_food",
  "bar",
  "pub",
  "food_court",
];

export const OnboardingPreferencesView: React.FC<Props> = ({ onDone }) => {
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  const [diet, setDiet] = useState<DietPreference>("none");
  const [takeawayPreferred, setTakeawayPreferred] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleType = (type: string) => {
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
      await setOnboardingDone(true);
      onDone();
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'enregistrer tes préférences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="restaurant" size={32} color={colors.primary} />
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Bienvenue sur Graye</Text>
          <Text style={styles.subtitle}>
            On personnalise tes recommandations en fonction de tes envies.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Types de lieux */}
        <Text style={styles.sectionTitle}>
          Quels types de lieux préfères-tu ?
        </Text>
        <Text style={styles.sectionSubtitle}>
          Tu peux en choisir plusieurs.
        </Text>
        <View style={styles.chipContainer}>
          {TYPE_OPTIONS.map((t) => {
            const active = preferredTypes.includes(t);
            return (
              <Pressable
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleType(t)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Régime */}
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Régime alimentaire</Text>
          <Text style={styles.sectionSubtitle}>
            On filtrera les lieux quand l’information est disponible.
          </Text>
          <View style={styles.chipContainer}>
            <Pressable
              style={[styles.chip, diet === "none" && styles.chipActive]}
              onPress={() => setDiet("none")}
            >
              <Text
                style={[
                  styles.chipText,
                  diet === "none" && styles.chipTextActive,
                ]}
              >
                Aucun
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, diet === "vegetarian" && styles.chipActive]}
              onPress={() => setDiet("vegetarian")}
            >
              <Text
                style={[
                  styles.chipText,
                  diet === "vegetarian" && styles.chipTextActive,
                ]}
              >
                Végétarien
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, diet === "vegan" && styles.chipActive]}
              onPress={() => setDiet("vegan")}
            >
              <Text
                style={[
                  styles.chipText,
                  diet === "vegan" && styles.chipTextActive,
                ]}
              >
                Végan
              </Text>
            </Pressable>
          </View>
        </View>

        {/* À emporter */}
        <View style={styles.block}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>À emporter en priorité</Text>
              <Text style={styles.sectionSubtitle}>
                On favorisera les lieux indiqués comme proposant la vente à
                emporter.
              </Text>
            </View>
            <Switch
              value={takeawayPreferred}
              onValueChange={setTakeawayPreferred}
              trackColor={{
                false: colors.border,
                true: colors.primarySoft,
              }}
              thumbColor={takeawayPreferred ? colors.primary : "#fff"}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bouton continuer */}
      <Pressable
        style={[
          styles.mainButton,
          (preferredTypes.length === 0 || saving) && styles.mainButtonDisabled,
        ]}
        onPress={onContinue}
        disabled={saving || preferredTypes.length === 0}
      >
        <Text style={styles.mainButtonText}>Continuer</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
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
