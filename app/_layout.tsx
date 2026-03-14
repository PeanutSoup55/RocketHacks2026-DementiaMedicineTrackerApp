import React, { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthScreen from "@/components/AuthScreen";
import { Colors } from "@/constants/theme";

// Global auth state — swap for a proper context/store when backend is live
export let globalUserId: string | null = null;
export let globalPatientId: string | null = null;

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  const handleAuthSuccess = (uid: string, pid: string) => {
    globalUserId = uid;
    globalPatientId = pid;
    setUserId(uid);
    setPatientId(pid);
  };

  // Show auth wall until logged in
  if (!userId || !patientId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="dark" />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
    </>
  );
}