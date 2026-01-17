import React, { useEffect, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import { TabType } from "../models/TabModel";

// Importation des vues
import { BottomNavBar } from "../components/BottomNavBar";
import FavoritesView from "../views/FavoritesView";
import { MapView } from "../views/MapView.native";
import { OnboardingPreferencesView } from "../views/OnboardingPreferencesView";
import { RestaurantDetailView } from "../views/RestaurantDetailView";
// On importe aussi l'interface SearchSessionState
import { SearchView, SearchSessionState } from "../views/SearchView";
import { SettingsView } from "../views/SettingsView";
import { hasCompletedOnboarding, setOnboardingDone } from "./PreferencesController";

// --- ZONE DE DEBUG ---
console.log("--- DEBUG IMPORTS ---");
console.log("MapView:", MapView);
console.log("SearchView:", SearchView);
console.log("SettingsView:", SettingsView);
console.log("FavoritesView:", FavoritesView);
console.log("OnboardingPreferencesView:", OnboardingPreferencesView);
console.log("RestaurantDetailView:", RestaurantDetailView);
console.log("BottomNavBar:", BottomNavBar);
console.log("---------------------");
// ---------------------

export const NavigationController = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("map");
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

  // --- NOUVEAU : Stockage de la session de recherche ---
  const [searchSession, setSearchSession] = useState<SearchSessionState | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await hasCompletedOnboarding();
      setShowOnboarding(!completed);
    };
    checkOnboarding();

    const backAction = () => {
      if (selectedRestaurant) {
        setSelectedRestaurant(null);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [selectedRestaurant]);

  const handleOnboardingDone = async () => {
    await setOnboardingDone();
    setShowOnboarding(false);
  };

  const handleSelectRestaurant = (resto: any) => {
    setSelectedRestaurant(resto);
  };

  // VÉRIFICATION DE SÉCURITÉ
  // Si OnboardingPreferencesView est undefined, on affiche un message d'erreur au lieu de planter
  if (showOnboarding) {
    if (!OnboardingPreferencesView) return <Text style={{ marginTop: 50 }}>ERREUR: OnboardingPreferencesView est mal importé.</Text>;
    return <OnboardingPreferencesView onDone={handleOnboardingDone} />;
  }

  if (selectedRestaurant) {
    if (!RestaurantDetailView) return <Text style={{ marginTop: 50 }}>ERREUR: RestaurantDetailView est mal importé.</Text>;
    return <RestaurantDetailView restaurant={selectedRestaurant} onBack={() => setSelectedRestaurant(null)} />;
  }

  const renderActiveView = () => {
    // Vérifications de sécurité pour les onglets
    if (activeTab === "map") {
      if (!MapView) return <Text>ERREUR: MapView est mal importé.</Text>;
      return <MapView onRestaurantSelect={handleSelectRestaurant} />;
    }
    if (activeTab === "search") {
      if (!SearchView) return <Text>ERREUR: SearchView est mal importé.</Text>;
      // --- MODIFICATION : On passe l'état sauvegardé et la fonction de sauvegarde ---
      return (
        <SearchView
          onRestaurantSelect={handleSelectRestaurant}
          savedState={searchSession}
          onSaveState={setSearchSession}
        />
      );
    }
    if (activeTab === "favorites") {
      if (!FavoritesView) return <Text>ERREUR: FavoritesView est mal importé.</Text>;
      return <FavoritesView onRestaurantSelect={handleSelectRestaurant} />;
    }
    if (activeTab === "settings") {
      if (!SettingsView) return <Text>ERREUR: SettingsView est mal importé.</Text>;
      return <SettingsView />;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderActiveView()}
      </View>
      {BottomNavBar ? (
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <Text>ERREUR: BottomNavBar est mal importé.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
});