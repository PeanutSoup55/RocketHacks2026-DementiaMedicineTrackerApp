import React from "react";
import { View, StyleSheet } from "react-native";
import ChatbotScreen from "@/components/ChatbotScreen";
import { globalPatientId } from "@/app/_layout";
import { Colors } from "@/constants/theme";

export default function ChatTab() {
  // Falls back to dummy ID during layout testing — remove fallback when auth is live
  const patientId = globalPatientId ?? "pat_001";

  return (
    <View style={styles.container}>
      <ChatbotScreen patientId={patientId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});