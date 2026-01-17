import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type TabType = "map" | "search" | "favorites" | "settings";

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavBar = ({ activeTab, onTabChange }: BottomNavBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        
        {/* Map */}
        <TouchableOpacity 
          onPress={() => onTabChange("map")}
          style={styles.button}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconContainer,
            activeTab === "map" && styles.iconContainerActive
          ]}>
            <FontAwesome 
              name="map" 
              size={18} 
              color={activeTab === "map" ? "#6B4EFF" : "#9CA3AF"} 
            />
          </View>
        </TouchableOpacity>

        {/* Home / Recommendations */}
        <TouchableOpacity 
          onPress={() => onTabChange("search")}
          style={styles.button}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconContainer,
            activeTab === "search" && styles.iconContainerActive
          ]}>
            <FontAwesome 
              name="home" 
              size={24} 
              color={activeTab === "search" ? "#6B4EFF" : "#9CA3AF"} 
            />
          </View>
        </TouchableOpacity>

        {/* Favorites - Cœur Violet */}
        <TouchableOpacity 
          onPress={() => onTabChange("favorites")}
          style={styles.button}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconContainer,
            activeTab === "favorites" && styles.iconContainerActivePurple
          ]}>
            <FontAwesome 
              name="heart" 
              size={20} 
              color={activeTab === "favorites" ? "#6B4EFF" : "#9CA3AF"} 
            />
          </View>
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity 
          onPress={() => onTabChange("settings")}
          style={styles.button}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconContainer,
            activeTab === "settings" && styles.iconContainerActive
          ]}>
            <FontAwesome 
              name="cog" 
              size={24} 
              color={activeTab === "settings" ? "#6B4EFF" : "#9CA3AF"} 
            />
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: 16,
    paddingTop: 6,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: '#F3F4F6',
  },
  iconContainerActivePurple: {
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
  },
});