import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { Colors, Typography, Spacing, MinTouchTarget } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? Spacing.lg : Spacing.sm,
          height: Platform.OS === "ios" ? MinTouchTarget + 28 : MinTouchTarget + 12,
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
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {/* Simple emoji icons — swap for IconSymbol if you prefer SF Symbols */}
              <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                {/* Using a Text emoji as icon — works cross-platform without extra deps */}
                <TabIcon label="🏠" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Assistant",
          tabBarLabel: "Assistant",
          tabBarIcon: () => (
            <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
              <TabIcon label="💬" />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ label }: { label: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 24 }}>{label}</Text>;
}