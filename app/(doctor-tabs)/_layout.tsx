import { Tabs } from "expo-router";
import { View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { Colors, Typography } from "@/constants/theme";

export default function DoctorTabLayout() {
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
        },
        tabBarLabelStyle: {
          fontSize: Typography.bodyM,
          fontWeight: Typography.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Patients",
          tabBarLabel: "Patients",
          tabBarIcon: () => <TabIcon label="👥" />,
        }}
      />
      <Tabs.Screen
        name="prescribe"
        options={{
          title: "Prescribe",
          tabBarLabel: "Prescribe",
          tabBarIcon: () => <TabIcon label="💊" />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarLabel: "Schedule",
          tabBarIcon: () => <TabIcon label="🗓️" />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ label }: { label: string }) {
  const { Text } = require("react-native");
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 22 }}>{label}</Text>
    </View>
  );
}