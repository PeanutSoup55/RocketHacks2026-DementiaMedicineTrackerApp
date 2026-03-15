import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import HomeScreen from "@/components/HomeScreen";
import { globalUserId, globalPatientId, globalUserRole } from "@/app/_layout";
import { Colors } from "@/constants/theme";

export default function HomeTab() {
  const router = useRouter();

  // Doctors get their own tab group — patients and nurses both see this screen
  useEffect(() => {
    if (globalUserRole === "doctor") {
      router.replace("/(doctor-tabs)");
    }
  }, []);

  const userId    = globalUserId    ?? "";
  const patientId = globalPatientId ?? "";

  return (
    <View style={styles.container}>
      <HomeScreen userId={userId} patientId={patientId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});