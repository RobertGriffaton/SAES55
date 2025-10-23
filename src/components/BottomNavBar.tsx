import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";

type TabType = "map" | "search" | "settings";

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "map", label: "Map", iconName: "map" },
  { id: "search", label: "Search", iconName: "search" },
  { id: "settings", label: "Settings", iconName: "settings" },
];

export const BottomNavBar = ({ activeTab, onTabChange }: BottomNavBarProps) => {
  return (
    <View style={styles.navbar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => onTabChange(tab.id as TabType)}
        >
          <Ionicons
            name={tab.iconName as any}
            size={24}
            color={activeTab === tab.id ? colors.primary : colors.inactive}
          />
          <Text
            style={[
              styles.navText,
              activeTab === tab.id && styles.navTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingVertical: spacing.medium,
    paddingBottom: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.large,
  },
  navText: {
    marginTop: spacing.small,
    fontSize: fontSize.small,
    color: colors.inactive,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});