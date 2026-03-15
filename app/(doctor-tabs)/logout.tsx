import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { logoutUser } from "@/services/api";
import { cancelAllDoseNotifications } from "@/services/notifications";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "@/constants/theme";

export default function LogoutScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await cancelAllDoseNotifications();
              await logoutUser(); // calls Firebase signOut()
              // onAuthStateChanged in _layout.tsx fires automatically
              // and resets state — no manual navigation needed
            } catch (e) {
              Alert.alert("Error", "Could not sign out. Please try again.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="hand-left-outline" size={72} color={Colors.primary} style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Sign Out</Text>
        <Text style={styles.subtitle}>
          You'll need to sign in again to access MedTrack.
        </Text>
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogout}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign out of MedTrack"
        >
          {loading
            ? <ActivityIndicator color={Colors.textOnDark} />
            : <Text style={styles.btnTxt}>Sign Out</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    width: "100%",
    ...Shadow.card,
  },
  title: {
    fontSize: Typography.displayM,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.bodyL,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: Typography.bodyL * 1.6,
    marginBottom: Spacing.xl,
  },
  btn: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    minHeight: MinTouchTarget + 8,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    ...Shadow.card,
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: {
    fontSize: Typography.bodyXL,
    fontWeight: Typography.bold,
    color: Colors.textOnDark,
    letterSpacing: 0.5,
  },
});