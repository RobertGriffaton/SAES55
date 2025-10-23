import { useState } from "react";
import { TabType } from "../models/TabModel";

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