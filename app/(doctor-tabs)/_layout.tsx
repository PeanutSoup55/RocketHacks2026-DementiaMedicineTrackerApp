import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HapticTab } from "@/components/haptic-tab";
import { Colors, Typography } from "@/constants/theme";

export default function DoctorTabLayout() {
  return (
    <Tabs
      initialRouteName="index"
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prescribe"
        options={{
          title: "Prescribe",
          tabBarLabel: "Prescribe",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarLabel: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size ?? 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: "Sign Out",
          tabBarLabel: "Sign Out",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size ?? 26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}