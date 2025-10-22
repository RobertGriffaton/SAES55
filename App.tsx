import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { BottomNavBar } from "./src/components/BottomNavBar";
import { useNavigationController } from "./src/controllers/NavigationController";
import { MapView } from "./src/views/MapView";
import { SearchView } from "./src/views/SearchView";
import { SettingsView } from "./src/views/SettingsView";
import { colors } from "./src/styles/theme";

export default function App() {
  const { activeTab, handleTabChange } = useNavigationController();

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return <MapView />;
      case "search":
        return <SearchView />;
      case "settings":
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

      <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
