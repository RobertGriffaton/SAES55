export type TabType = "map" | "search" | "favorites" | "settings";

export interface Tab {
  id: TabType;
  label: string;
  iconName: string;
}

export const tabs: Tab[] = [
  { id: "map", label: "Map", iconName: "map" },
  { id: "search", label: "Search", iconName: "search" },
  { id: "favorites", label: "Favorites", iconName: "heart" },
  { id: "settings", label: "Settings", iconName: "cog" },
];