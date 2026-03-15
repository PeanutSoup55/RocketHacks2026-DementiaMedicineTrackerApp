import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "../constants/theme";
import { loginUser, registerPatient } from "../services/api";
import DoctorApplicationModal from "./DoctorApplicationModal";
import type { UserRole } from "../services/api";

// ---- EmailJS config ----
const EMAILJS_SERVICE_ID  = "service_q1w59tm";
const EMAILJS_TEMPLATE_ID = "template_n1wp9hh";
const EMAILJS_PUBLIC_KEY  = "ZXR66beteMu3B0cEi";

interface Props {
  onAuthSuccess: (userId: string, patientId: string, role: UserRole) => void;
}

type Mode = "login" | "register-patient";

export default function AuthScreen({ onAuthSuccess }: Props) {
  const [mode, setMode]       = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showApply, setShowApply] = useState(false);

  // Login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // Patient register
  const [patientName, setPatientName]         = useState("");
  const [patientEmail, setPatientEmail]       = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [patientId, setPatientId]             = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email.trim(), password);
      if (result) {
        onAuthSuccess(result.user.id, result.patient.id, result.user.role);
      } else {
        Alert.alert("Login Failed", "Incorrect email or password. Please try again.");
      }
    } catch {
      Alert.alert("Connection Error", "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientRegister = async () => {
    if (!patientName.trim() || !patientEmail.trim() || !patientPassword.trim() || !patientId.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const result = await registerPatient({
        name: patientName.trim(),
        email: patientEmail.trim(),
        password: patientPassword,
        patientId: patientId.trim(),
      });
      if (result) {
        onAuthSuccess(result.user.id, result.patient.id, result.user.role);
      } else {
        Alert.alert("Registration Failed", "Could not find a patient record with that ID. Please check with your doctor.");
      }
    } catch {
      Alert.alert("Connection Error", "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.outer}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💊</Text>
          </View>
          <Text style={styles.appName}>MedTrack</Text>
          <Text style={styles.tagline}>Medication Care Assistant</Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.toggle}>
          <ToggleBtn label="Sign In"  active={mode === "login"}            onPress={() => setMode("login")} />
          <ToggleBtn label="Register" active={mode === "register-patient"} onPress={() => setMode("register-patient")} />
        </View>

        <View style={styles.card}>
          {/* ── LOGIN ── */}
          {mode === "login" && (
            <>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Label text="Email Address" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Label text="Password" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <PrimaryButton label="Sign In" loading={loading} onPress={handleLogin} />
            </>
          )}

          {/* ── PATIENT REGISTER ── */}
          {mode === "register-patient" && (
            <>
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.hint}>
                You'll need your Patient ID from your doctor to get started.
              </Text>
              <Label text="Your Full Name" />
              <TextInput
                style={styles.input}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Dorothy Williams"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
              <Label text="Your Email Address" />
              <TextInput
                style={styles.input}
                value={patientEmail}
                onChangeText={setPatientEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Label text="Create a Password" />
              <TextInput
                style={styles.input}
                value={patientPassword}
                onChangeText={setPatientPassword}
                placeholder="Choose a secure password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
              <Label text="Your Patient ID" />
              <Text style={styles.subHint}>Your doctor will give you this ID.</Text>
              <TextInput
                style={styles.input}
                value={patientId}
                onChangeText={setPatientId}
                placeholder="Paste your Patient ID here"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handlePatientRegister}
              />
              <PrimaryButton label="Create Account" loading={loading} onPress={handlePatientRegister} />
            </>
          )}
        </View>

        {/* ── SUBTLE DOCTOR APPLY BUTTON ── */}
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => setShowApply(true)}
          accessibilityLabel="Apply for doctor position"
        >
          <Text style={styles.applyBtnTxt}>Are you a doctor? Apply here</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Doctor Application Modal */}
      <DoctorApplicationModal
        visible={showApply}
        onClose={() => setShowApply(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ---- Sub-components ----

function ToggleBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.toggleBtn, active && styles.toggleBtnOn]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.toggleTxt, active && styles.toggleTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function PrimaryButton({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
    >
      {loading
        ? <ActivityIndicator color={Colors.textOnDark} />
        : <Text style={styles.primaryBtnTxt}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xxl },

  logoArea: { alignItems: "center", marginBottom: Spacing.xl },
  logoCircle: {
    width: 84, height: 84, borderRadius: Radius.xl,
    backgroundColor: Colors.primary, alignItems: "center",
    justifyContent: "center", marginBottom: Spacing.md, ...Shadow.card,
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: Typography.displayL, fontWeight: Typography.bold, color: Colors.primary, letterSpacing: 1 },
  tagline: { fontSize: Typography.bodyM, color: Colors.textSecondary, marginTop: Spacing.xs },

  toggle: {
    flexDirection: "row", backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.lg,
  },
  toggleBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: "center",
    borderRadius: Radius.md, minHeight: MinTouchTarget, justifyContent: "center",
  },
  toggleBtnOn: { backgroundColor: Colors.surface, ...Shadow.card },
  toggleTxt: { fontSize: Typography.bodyM, color: Colors.textMuted, fontWeight: Typography.semibold },
  toggleTxtOn: { color: Colors.primary },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.card },
  cardTitle: { fontSize: Typography.displayM, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  hint: { fontSize: Typography.bodyM, color: Colors.textSecondary, lineHeight: Typography.bodyM * 1.6, marginBottom: Spacing.sm },
  subHint: { fontSize: Typography.bodyS, color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: -Spacing.xs },

  label: {
    fontSize: Typography.bodyL, fontWeight: Typography.semibold,
    color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },
  input: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Typography.bodyL, color: Colors.textPrimary,
    backgroundColor: Colors.background, minHeight: MinTouchTarget,
  },
  inputMulti: { minHeight: 100, textAlignVertical: "top" },

  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: "center",
    marginTop: Spacing.xl, minHeight: MinTouchTarget + 8,
    justifyContent: "center", ...Shadow.card,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnTxt: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textOnDark, letterSpacing: 0.5 },

  // Subtle apply button — deliberately small and low-contrast for elderly UX
  applyBtn: {
    alignSelf: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  applyBtnTxt: {
    fontSize: Typography.tiny,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalContent: { padding: Spacing.lg, paddingTop: Spacing.xl },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm },
  modalTitle: { fontSize: Typography.displayM, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalCloseBtn: { width: MinTouchTarget, height: MinTouchTarget, alignItems: "center", justifyContent: "center" },
  modalSubtitle: { fontSize: Typography.bodyM, color: Colors.textSecondary, lineHeight: Typography.bodyM * 1.6, marginBottom: Spacing.sm },

  // Image picker
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  imageThumb: { width: 100, alignItems: "center" },
  thumbImg: { width: 100, height: 100, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  thumbRemove: { position: "absolute", top: -8, right: -8 },
  thumbLabel: { fontSize: Typography.tiny, color: Colors.textMuted, marginTop: 4, textAlign: "center", maxWidth: 100 },
  addImageBtn: {
    width: 100, height: 100, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  addImageTxt: { fontSize: Typography.tiny, color: Colors.primaryLight, textAlign: "center" },

  // Submit button
  submitBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    paddingVertical: Spacing.lg, alignItems: "center",
    marginTop: Spacing.xl, flexDirection: "row",
    justifyContent: "center", gap: Spacing.sm,
    minHeight: MinTouchTarget + 8, ...Shadow.card,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnTxt: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textOnDark },
});