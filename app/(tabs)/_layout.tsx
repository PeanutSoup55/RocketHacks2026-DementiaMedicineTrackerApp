import { ReactNode } from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { Colors, Typography } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: Typography.bodyM,
          fontWeight: Typography.semibold,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Assistant",
          tabBarLabel: "Assistant",
        tabBarIcon: ({ color }) => (
          <MaterialIcons name="chat" size={24} color={color} />
        ),
        }}
      />
    </Tabs>
  );
}