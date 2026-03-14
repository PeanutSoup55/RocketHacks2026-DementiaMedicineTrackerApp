import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import AuthScreen from "@/components/AuthScreen";
import { Colors } from "@/constants/theme";

export let globalUserId: string | null = null;
export let globalPatientId: string | null = null;

export default function RootLayout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true); // true while Firebase checks persisted session

  // Listen to Firebase auth state — handles auto-login on app restart
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is already logged in — fetch their patientId from Firestore
        try {
          const snap = await getDoc(doc(db, "Medtrack_Users", firebaseUser.uid));
          if (snap.exists()) {
            const pid = snap.data().patientId as string;
            globalUserId = firebaseUser.uid;
            globalPatientId = pid;
            setUserId(firebaseUser.uid);
            setPatientId(pid);
          }
        } catch (e) {
          console.error("Auth state restore failed:", e);
        }
      }
      setChecking(false);
    });
    return unsub; // unsubscribe on unmount
  }, []);

  const handleAuthSuccess = (uid: string, pid: string) => {
    globalUserId = uid;
    globalPatientId = pid;
    setUserId(uid);
    setPatientId(pid);
  };

  // Show spinner while Firebase checks for a persisted session
  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Show auth screen if not logged in
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