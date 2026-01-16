import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  savePreferences,
  setOnboardingDone,
} from "../controllers/PreferencesController";
import {
  Ambiance,
  Cuisine,
  DEFAULT_PREFERENCES,
  Diet,
  UserPreferences,
} from "../models/PreferencesModel";
import { colors, spacing } from "../styles/theme";

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
const AMBIANCES: Ambiance[] = [
  "Calme",
  "Familial",
  "Branché",
  "Traditionnel",
  "Romantique",
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function OnboardingPreferencesView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);

  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [budget, setBudget] = useState(String(DEFAULT_PREFERENCES.budgetEuro));
  const [distance, setDistance] = useState(
    String(DEFAULT_PREFERENCES.distanceKm)
  );
  const [diet, setDiet] = useState<Diet>("Aucune");
  const [ambiance, setAmbiance] = useState<Ambiance | null>(null);
  const [options, setOptions] = useState(DEFAULT_PREFERENCES.options);

  // Validations budget / distance + flags d'erreur
  const {
    isValid: isBudgetDistanceValid,
    budgetError,
    distanceError,
  } = useMemo(() => {
    const b = Number(budget);
    const d = Number(distance);

    const budgetError = Number.isNaN(b) || b <= 0 || b >= 200;
    const distanceError = Number.isNaN(d) || d <= 0 || d > 50;

    return {
      isValid: !budgetError && !distanceError,
      budgetError,
      distanceError,
    };
  }, [budget, distance]);

  const hasAtLeastOneCuisine = cuisines.length > 0;
  const canContinue = hasAtLeastOneCuisine && isBudgetDistanceValid;

  const toggleCuisine = (c: Cuisine) =>
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const toggleOption = (k: "surPlace" | "emporter" | "livraison") =>
    setOptions((prev) => ({ ...prev, [k]: !prev[k] }));

  const onSkip = async () => {
    await setOnboardingDone();
    onDone();
  };

  const onContinue = async () => {
    const prefs: UserPreferences = {
      cuisines,
      budgetEuro: Number(budget),
      distanceKm: Number(distance),
      diet,
      ambiance,
      options,
    };
    try {
      await savePreferences(prefs);
      await setOnboardingDone();
      onDone();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer vos préférences.");
    }
  };

  // Progression
  const totalSteps = 4;
  const filledFlex = step;
  const emptyFlex = totalSteps - step;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Bande violette + logo */}
        <View style={styles.topBanner}>
          <Image
            source={require("../../assets/LogoGrayeLong.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Titre + sous-titre */}
        <Text style={styles.title}>Dis-nous comment tu aimes manger 🍽️</Text>
        <Text style={styles.subtitle}>
          Choisis tes préférences pour que Graye te recommande les meilleures
          adresses.
        </Text>

        {/* Indicateur d'étape + barre de progression */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepText}>
            Étape {step}/{totalSteps}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: filledFlex }]} />
            <View style={{ flex: emptyFlex }} />
          </View>
        </View>

        {/* Étape 1 : cuisines */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Cuisines préférées</Text>
            <Text style={styles.stepDescription}>
              Sélectionne au moins une cuisine que tu apprécies.
            </Text>
            <View style={styles.wrap}>
              {CUISINES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={cuisines.includes(c)}
                  onPress={() => toggleCuisine(c)}
                />
              ))}
            </View>
          </>
        )}

        {/* Étape 2 : budget + distance */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Budget (€/pers.)</Text>
            <Text style={styles.stepDescription}>
              Indique ton budget moyen par personne.
            </Text>
            <TextInput
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
              placeholder="ex: 15"
              style={[styles.input, budgetError && styles.inputError]}
            />
            <Text
              style={[styles.helperText, budgetError && styles.helperTextError]}
            >
              Budget entre 1 et 199 € par personne.
            </Text>

            <Text style={styles.sectionTitle}>Distance max (km)</Text>
            <Text style={styles.stepDescription}>
              Jusqu’à quelle distance es-tu prêt à te déplacer ?
            </Text>
            <TextInput
              keyboardType="numeric"
              value={distance}
              onChangeText={setDistance}
              placeholder="ex: 5"
              style={[styles.input, distanceError && styles.inputError]}
            />
            <Text
              style={[
                styles.helperText,
                distanceError && styles.helperTextError,
              ]}
            >
              Distance entre 1 et 50 km.
            </Text>
          </>
        )}

        {/* Étape 3 : régime */}
        {step === 3 && (
          <>
            <Text style={styles.sectionTitle}>Régime/contraintes</Text>
            <Text style={styles.stepDescription}>
              Précise tes habitudes ou contraintes alimentaires.
            </Text>
            <View style={styles.wrap}>
              {DIETS.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  selected={diet === d}
                  onPress={() => setDiet(d)}
                />
              ))}
            </View>
          </>
        )}

        {/* Étape 4 : ambiance + options + récap */}
        {step === 4 && (
          <>
            <Text style={styles.sectionTitle}>Ambiance</Text>
            <Text style={styles.stepDescription}>
              Choisis le type d’ambiance que tu préfères.
            </Text>
            <View style={styles.wrap}>
              {AMBIANCES.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  selected={ambiance === a}
                  onPress={() => setAmbiance(a)}
                />
              ))}
              <Chip
                label="Peu importe"
                selected={!ambiance}
                onPress={() => setAmbiance(null)}
              />
            </View>

            <Text style={styles.sectionTitle}>Options</Text>
            <Text style={styles.stepDescription}>
              Comment veux-tu profiter de ton repas ?
            </Text>
            <View style={styles.wrap}>
              <Chip
                label="Sur place"
                selected={options.surPlace}
                onPress={() => toggleOption("surPlace")}
              />
              <Chip
                label="À emporter"
                selected={options.emporter}
                onPress={() => toggleOption("emporter")}
              />
              <Chip
                label="Livraison"
                selected={options.livraison}
                onPress={() => toggleOption("livraison")}
              />
            </View>

            {/* Récapitulatif */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>

              <Text style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Cuisines : </Text>
                {cuisines.length > 0 ? cuisines.join(", ") : "Non précisé"}
              </Text>

              <Text style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Budget : </Text>
                {budget ? `${budget} € / pers.` : "Non précisé"}
              </Text>

              <Text style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Distance max : </Text>
                {distance ? `${distance} km` : "Non précisé"}
              </Text>

              <Text style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Régime : </Text>
                {diet}
              </Text>

              <Text style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Ambiance : </Text>
                {ambiance ?? "Peu importe"}
              </Text>

              <Text style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Options : </Text>
                {[
                  options.surPlace && "Sur place",
                  options.emporter && "À emporter",
                  options.livraison && "Livraison",
                ]
                  .filter(Boolean)
                  .join(", ") || "Non précisé"}
              </Text>
            </View>
          </>
        )}

        {/* CTA */}
        <View style={styles.ctaRow}>
          {/* Étape 1 */}
          {step === 1 && (
            <>
              <TouchableOpacity
                onPress={onSkip}
                style={[styles.button, styles.buttonGhost]}
              >
                <Text style={[styles.buttonText, styles.buttonTextGhost]}>
                  Plus tard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!hasAtLeastOneCuisine}
                onPress={() => setStep(2)}
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  !hasAtLeastOneCuisine && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>Suivant</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Étapes 2 et 3 */}
          {step > 1 && step < 4 && (
            <>
              <TouchableOpacity
                onPress={() => setStep(step - 1)}
                style={[styles.button, styles.buttonGhost]}
              >
                <Text style={[styles.buttonText, styles.buttonTextGhost]}>
                  Retour
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={step === 2 && !isBudgetDistanceValid}
                onPress={() => setStep(step + 1)}
                style={[
                  styles.button,
                  styles.buttonSecondary,
                  step === 2 && !isBudgetDistanceValid && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>Suivant</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Étape 4 */}
          {step === 4 && (
            <>
              <TouchableOpacity
                onPress={() => setStep(3)}
                style={[styles.button, styles.buttonGhost]}
              >
                <Text style={[styles.buttonText, styles.buttonTextGhost]}>
                  Retour
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!canContinue}
                onPress={onContinue}
                style={[styles.button, !canContinue && styles.buttonDisabled]}
              >
                <Text style={styles.buttonText}>Terminer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footnote}>
          Nous n'effectuons aucune inscription. Vos préférences sont stockées
          uniquement sur cet appareil.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.large },

  topBanner: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.medium,
    marginHorizontal: -spacing.large,
    marginTop: -spacing.large,
    marginBottom: spacing.medium,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  logo: {
    width: 210,
    height: 70,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: colors.inactive,
    marginBottom: spacing.large,
  },

  // Indicateur d'étapes
  stepHeader: {
    marginBottom: spacing.medium,
  },
  stepText: {
    color: colors.primary,
    marginBottom: spacing.small,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.inactive,
    marginBottom: spacing.small,
  },

  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.small },

  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: spacing.small,
    marginBottom: spacing.small,
  },
  chipSelected: {
    backgroundColor: (colors as any).primary + "22",
    borderColor: colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipText: { color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  helperText: {
    fontSize: 12,
    color: colors.inactive,
    marginTop: 4,
  },
  helperTextError: {
    color: "#EF4444",
  },

  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.large,
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    minWidth: 140,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor:
      // @ts-ignore - secondary peut ne pas être défini dans le thème historique
      (colors as any).secondary ?? "#4C956C",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonTextGhost: { color: colors.text, fontWeight: "600" },

  summaryCard: {
    marginTop: spacing.large,
    padding: spacing.medium,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.small,
  },
  summaryItem: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  summaryLabel: {
    fontWeight: "600",
  },

  footnote: { color: colors.inactive, fontSize: 12, marginTop: spacing.medium },
});
