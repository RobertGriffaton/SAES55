import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { BottomNavBar } from "./src/components/BottomNavBar";
import { useNavigationController } from "./src/controllers/NavigationController";
import { MapView } from "./src/views/MapView";
import { SearchView } from "./src/views/SearchView";
import { SettingsView } from "./src/views/SettingsView";
import { colors } from "./src/styles/theme";
import { isOnboardingDone } from "./src/controllers/PreferencesController";
import { OnboardingPreferencesView } from "./src/views/OnboardingPreferencesView";

export default function App() {
  const { activeTab, handleTabChange } = useNavigationController();

  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const done = await isOnboardingDone();
      setOnboarded(done);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!onboarded) {
    return (
      <View style={styles.container}>
        <OnboardingPreferencesView onDone={() => setOnboarded(true)} />
        <StatusBar style="auto" />
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return <MapView />;
      case "search":
        return <SearchView />;
      case "settings":
        return <SettingsView />;
      default:
        return <SearchView />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>{renderContent()}</View>
      <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mainContent: { flex: 1 },                               // ✅ manquait
  center: { justifyContent: "center", alignItems: "center" }, // ✅ manquait
});
