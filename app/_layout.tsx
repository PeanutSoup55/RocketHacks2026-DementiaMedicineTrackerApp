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
import type { UserRole } from "@/services/api";

export let globalUserId: string | null = null;
export let globalPatientId: string | null = null;
export let globalUserRole: UserRole | null = null;

// Called by logout screen to reset all auth state
export function clearGlobalAuth() {
  globalUserId    = null;
  globalPatientId = null;
  globalUserRole  = null;
}

export default function RootLayout() {
  const [userId, setUserId]       = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [role, setRole]           = useState<UserRole | null>(null);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "Medtrack_Users", firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            globalUserId    = firebaseUser.uid;
            globalPatientId = data.patientId as string;
            globalUserRole  = data.role as UserRole;
            setUserId(firebaseUser.uid);
            setPatientId(data.patientId as string);
            setRole(data.role as UserRole);
          }
        } catch (e) {
          console.error("Auth state restore failed:", e);
        }
      } else {
        // User signed out — reset all state, AuthScreen will show automatically
        globalUserId    = null;
        globalPatientId = null;
        globalUserRole  = null;
        setUserId(null);
        setPatientId(null);
        setRole(null);
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  const handleAuthSuccess = (uid: string, pid: string, userRole: UserRole) => {
    globalUserId    = uid;
    globalPatientId = pid;
    globalUserRole  = userRole;
    setUserId(uid);
    setPatientId(pid);
    setRole(userRole);
  };

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!userId || !patientId || !role) {
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
        {/* Patient + Nurse app — medication home view */}
        <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
        {/* Doctor app — patient/prescription management */}
        <Stack.Screen name="(doctor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal"         options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
    </>
  );
}