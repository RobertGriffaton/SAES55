import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { TabType } from "../models/TabModel";

// Importation des vues
import { MapView } from "../views/MapView";
import { SearchView } from "../views/SearchView";
import { SettingsView } from "../views/SettingsView";
import { OnboardingPreferencesView } from "../views/OnboardingPreferencesView";
import { RestaurantDetailView } from "../views/RestaurantDetailView";
import { BottomNavBar } from "../components/BottomNavBar";
import { hasCompletedOnboarding, setOnboardingDone } from "./PreferencesController";

// --- ZONE DE DEBUG ---
console.log("--- DEBUG IMPORTS ---");
console.log("MapView:", MapView);
console.log("SearchView:", SearchView);
console.log("SettingsView:", SettingsView);
console.log("OnboardingPreferencesView:", OnboardingPreferencesView);
console.log("RestaurantDetailView:", RestaurantDetailView);
console.log("BottomNavBar:", BottomNavBar);
console.log("---------------------");
// ---------------------

export const NavigationController = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("search"); 
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

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
    if (!OnboardingPreferencesView) return <Text style={{marginTop: 50}}>ERREUR: OnboardingPreferencesView est mal importé.</Text>;
    return <OnboardingPreferencesView onDone={handleOnboardingDone} />;
  }

  if (selectedRestaurant) {
    if (!RestaurantDetailView) return <Text style={{marginTop: 50}}>ERREUR: RestaurantDetailView est mal importé.</Text>;
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
        return <SearchView onRestaurantSelect={handleSelectRestaurant} />;
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