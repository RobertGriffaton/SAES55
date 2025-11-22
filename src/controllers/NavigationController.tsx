import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { TabType } from "../models/TabModel";
import { MapView } from "../views/MapView";
import { SearchView } from "../views/SearchView";
import { SettingsView } from "../views/SettingsView";
import { OnboardingPreferencesView } from "../views/OnboardingPreferencesView";
import { BottomNavBar } from "../components/BottomNavBar";
import { hasCompletedOnboarding, setOnboardingDone } from "./PreferencesController";

export const useNavigationController = () => {
  const [activeTab, setActiveTab] = useState<TabType>("map");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return {
    activeTab,
    handleTabChange,
  };
};

// Composant Navigation principal
export const NavigationController = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("map");

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await hasCompletedOnboarding();
      setShowOnboarding(!completed);
    };
    checkOnboarding();
  }, []);

  const handleOnboardingDone = async () => {
    await setOnboardingDone();
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingPreferencesView onDone={handleOnboardingDone} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "map":
        return <MapView />;
      case "search":
        return <SearchView />;
      case "settings":
        return <SettingsView />;
      default:
        return <MapView />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderActiveView()}
      </View>
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});