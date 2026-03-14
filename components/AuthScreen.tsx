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
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "../constants/theme";
import { loginUser, registerUser } from "../services/api";

interface Props {
  onAuthSuccess: (userId: string, patientId: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Information", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email.trim(), password);
      if (result) {
        onAuthSuccess(result.user.id, result.patient.id);
      } else {
        Alert.alert("Login Failed", "Incorrect email or password. Please try again.");
      }
    } catch {
      Alert.alert("Connection Error", "Could not reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !doctorEmail.trim()) {
      Alert.alert("Missing Information", "Please fill in all fields to create your account.");
      return;
    }
    setLoading(true);
    try {
      const result = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        doctorEmail: doctorEmail.trim(),
        role: "nurse",
      });
      if (result) {
        onAuthSuccess(result.user.id, result.patient.id);
      } else {
        Alert.alert(
          "Registration Failed",
          "Could not find a doctor with that email address. Please check with your supervisor."
        );
      }
    } catch {
      Alert.alert("Connection Error", "Could not reach the server. Please check your connection.");
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
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "login" && styles.toggleBtnOn]}
            onPress={() => setMode("login")}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "login" }}
          >
            <Text style={[styles.toggleTxt, mode === "login" && styles.toggleTxtOn]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "register" && styles.toggleBtnOn]}
            onPress={() => setMode("register")}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === "register" }}
          >
            <Text style={[styles.toggleTxt, mode === "register" && styles.toggleTxtOn]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {mode === "login" ? (
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
                accessibilityLabel="Email address"
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
                accessibilityLabel="Password"
              />

              <PrimaryButton label="Sign In" loading={loading} onPress={handleLogin} />
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Create Your Account</Text>
              <Text style={styles.hint}>
                You'll need your supervising doctor's email address to get started.
              </Text>

              <Label text="Your Full Name" />
              <TextInput
                style={styles.input}
                value={regName}
                onChangeText={setRegName}
                placeholder="Patricia Okafor"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Your full name"
              />

              <Label text="Your Email Address" />
              <TextInput
                style={styles.input}
                value={regEmail}
                onChangeText={setRegEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Your email"
              />

              <Label text="Create a Password" />
              <TextInput
                style={styles.input}
                value={regPassword}
                onChangeText={setRegPassword}
                placeholder="Choose a secure password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                returnKeyType="next"
                accessibilityLabel="Password"
              />

              <Label text="Doctor's Email Address" />
              <TextInput
                style={styles.input}
                value={doctorEmail}
                onChangeText={setDoctorEmail}
                placeholder="doctor@hospital.org"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                accessibilityLabel="Supervising doctor email"
              />

              <PrimaryButton label="Create Account" loading={loading} onPress={handleRegister} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={labelStyle}>{text}</Text>;
}
const labelStyle: import("react-native").TextStyle = {
  fontSize: Typography.bodyL,
  fontWeight: Typography.semibold,
  color: Colors.textPrimary,
  marginBottom: Spacing.sm,
  marginTop: Spacing.md,
};

function PrimaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[btnStyle, loading && btnDisabledStyle]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textOnDark} />
      ) : (
        <Text style={btnTextStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
const btnStyle: import("react-native").ViewStyle = {
  backgroundColor: Colors.primary,
  borderRadius: Radius.md,
  paddingVertical: Spacing.md,
  alignItems: "center",
  marginTop: Spacing.xl,
  minHeight: MinTouchTarget + 8,
  justifyContent: "center",
  ...Shadow.card,
};
const btnDisabledStyle: import("react-native").ViewStyle = { opacity: 0.6 };
const btnTextStyle: import("react-native").TextStyle = {
  fontSize: Typography.bodyXL,
  fontWeight: Typography.bold,
  color: Colors.textOnDark,
  letterSpacing: 0.5,
};

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xxl },

  logoArea: { alignItems: "center", marginBottom: Spacing.xl },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: Typography.displayL,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  tagline: { fontSize: Typography.bodyM, color: Colors.textSecondary, marginTop: Spacing.xs },

  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: Radius.md,
    minHeight: MinTouchTarget,
    justifyContent: "center",
  },
  toggleBtnOn: { backgroundColor: Colors.surface, ...Shadow.card },
  toggleTxt: { fontSize: Typography.bodyL, color: Colors.textMuted, fontWeight: Typography.semibold },
  toggleTxtOn: { color: Colors.primary },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: Typography.displayM,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: Typography.bodyM,
    color: Colors.textSecondary,
    lineHeight: Typography.bodyM * 1.6,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.bodyL,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: MinTouchTarget,
  },
});