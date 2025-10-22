import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../styles/theme";

export const SearchView = () => {
  return (
    <View style={styles.content}>
      <Ionicons name="search" size={80} color={colors.primary} />
      <Text style={styles.contentText}>Search</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
  },
  contentText: {
    marginTop: spacing.large,
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
});