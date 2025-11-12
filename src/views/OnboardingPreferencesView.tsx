import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { colors, spacing, fontSize } from "../styles/theme";
import { Ambiance, Cuisine, Diet, DEFAULT_PREFERENCES, UserPreferences } from "../models/PreferencesModel";
import { savePreferences, setOnboardingDone } from "../controllers/PreferencesController";

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

function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OnboardingPreferencesView({ onDone }: { onDone: () => void }) {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [budget, setBudget] = useState(String(DEFAULT_PREFERENCES.budgetEuro));
  const [distance, setDistance] = useState(String(DEFAULT_PREFERENCES.distanceKm));
  const [diet, setDiet] = useState<Diet>("Aucune");
  const [ambiance, setAmbiance] = useState<Ambiance | null>(null);
  const [options, setOptions] = useState(DEFAULT_PREFERENCES.options);

  const canContinue = useMemo(() => {
    const b = Number(budget);
    const d = Number(distance);
    const isValid = !Number.isNaN(b) && b > 0 && b < 200 && !Number.isNaN(d) && d > 0 && d <= 50;
    return cuisines.length > 0 && isValid;
  }, [budget, distance, cuisines.length]);

  const toggleCuisine = (c: Cuisine) =>
    setCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const toggleOption = (k: "surPlace" | "emporter" | "livraison") =>
    setOptions((prev) => ({ ...prev, [k]: !prev[k] }));

  const onSkip = async () => {
    await setOnboardingDone(true);
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
      await setOnboardingDone(true);
      onDone();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer vos préférences.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Bienvenue 👋</Text>
        <Text style={styles.subtitle}>Personnalise tes recommandations de restaurants.</Text>

        <Text style={styles.sectionTitle}>Cuisines préférées</Text>
        <View style={styles.wrap}>
          {CUISINES.map((c) => (
            <Chip key={c} label={c} selected={cuisines.includes(c)} onPress={() => toggleCuisine(c)} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Budget (€/pers.)</Text>
        <TextInput
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
          placeholder="ex: 15"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Distance max (km)</Text>
        <TextInput
          keyboardType="numeric"
          value={distance}
          onChangeText={setDistance}
          placeholder="ex: 5"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Régime/contraintes</Text>
        <View style={styles.wrap}>
          {DIETS.map((d) => (
            <Chip key={d} label={d} selected={diet === d} onPress={() => setDiet(d)} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ambiance</Text>
        <View style={styles.wrap}>
          {AMBIANCES.map((a) => (
            <Chip key={a} label={a} selected={ambiance === a} onPress={() => setAmbiance(a)} />
          ))}
          <Chip label="Peu importe" selected={!ambiance} onPress={() => setAmbiance(null)} />
        </View>

        <Text style={styles.sectionTitle}>Options</Text>
        <View style={styles.wrap}>
          <Chip label="Sur place" selected={options.surPlace} onPress={() => toggleOption("surPlace")} />
          <Chip label="À emporter" selected={options.emporter} onPress={() => toggleOption("emporter")} />
          <Chip label="Livraison" selected={options.livraison} onPress={() => toggleOption("livraison")} />
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity onPress={onSkip} style={[styles.button, styles.buttonGhost]}>
            <Text style={[styles.buttonText, styles.buttonTextGhost]}>Plus tard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canContinue}
            onPress={onContinue}
            style={[styles.button, !canContinue && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          Nous n'effectuons aucune inscription. Vos préférences sont stockées uniquement sur cet appareil.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.large },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: spacing.small },
  subtitle: { fontSize: 16, color: colors.inactive, marginBottom: spacing.large },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginVertical: spacing.medium },
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
  chipSelected: { backgroundColor: colors.primary + "22", borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextSelected: { color: colors.primary, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  ctaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.large },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    minWidth: 140,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  buttonText: { color: "#fff", fontWeight: "700" },
  buttonTextGhost: { color: colors.text, fontWeight: "600" },
  footnote: { color: colors.inactive, fontSize: 12, marginTop: spacing.medium },
});
