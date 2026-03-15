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
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "../constants/theme";

const EMAILJS_SERVICE_ID  = "service_q1w59tm";
const EMAILJS_TEMPLATE_ID = "template_n1wp9hh";
const EMAILJS_PUBLIC_KEY  = "ZXR66beteMu3B0cEi";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DoctorApplicationModal({ visible, onClose }: Props) {
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [specialty, setSpecialty]   = useState("");
  const [hospital, setHospital]     = useState("");
  const [message, setMessage]       = useState("");
  const [images, setImages]         = useState<{ uri: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert("Maximum 3 documents", "Please remove one before adding another.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,          // aggressive compression
      allowsMultipleSelection: false,
      exif: false,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.fileName ?? `document_${Date.now()}.jpg`;
      setImages((prev) => [...prev, { uri: asset.uri, name: fileName }]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toBase64 = async (uri: string): Promise<string> => {
    // Resize to max 600px wide before encoding to keep payload small
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 600 } }],
      { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return manipulated.base64 ?? "";
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setSpecialty("");
    setHospital("");
    setMessage("");
    setImages([]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !specialty.trim() || !hospital.trim()) {
      Alert.alert("Missing Information", "Please fill in your name, email, specialty, and hospital.");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Documents Required", "Please attach at least one credential document.");
      return;
    }

    setSubmitting(true);
    try {
      // Convert each image to base64 and build HTML img tags for the email body
      const imageHtmlParts: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const base64 = await toBase64(images[i].uri);
        imageHtmlParts.push(
          `<p><strong>Document ${i + 1}:</strong> ${images[i].name}</p>` +
          `<img src="data:image/jpeg;base64,${base64}" style="max-width:600px;width:100%;border-radius:8px;margin-bottom:16px;" />`
        );
      }
      const documentsHtml = imageHtmlParts.join("\n");

      // Send via EmailJS REST API
      const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            applicant_name:  name.trim(),
            applicant_email: email.trim(),
            specialty:       specialty.trim(),
            hospital:        hospital.trim(),
            message:         message.trim() || "No additional notes.",
            documents:       documentsHtml,
            time:            new Date().toLocaleString(),
          },
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error("EmailJS full error:", emailRes.status, errText);
        Alert.alert("EmailJS Error", `Status: ${emailRes.status}\n\n${errText}`);
        throw new Error(`EmailJS ${emailRes.status}`);
      }

      Alert.alert(
        "Application Submitted ✓",
        "Your application has been received. We'll review your credentials and be in touch within 2–3 business days.",
        [{ text: "OK", onPress: () => { resetForm(); onClose(); } }]
      );
    } catch (e) {
      console.error("Application submit failed:", e);
      Alert.alert("Submission Failed", "Could not send your application. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Doctor Application</Text>
          <TouchableOpacity
            onPress={() => { resetForm(); onClose(); }}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Submit your credentials for review. We'll be in touch within 2–3 business days.
        </Text>

        {/* Fields */}
        <Label text="Full Name *" />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Dr. Jane Smith"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
        />

        <Label text="Email Address *" />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="doctor@hospital.org"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Label text="Medical Specialty *" />
        <TextInput
          style={styles.input}
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="e.g. Geriatric Medicine"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
        />

        <Label text="Hospital / Clinic *" />
        <TextInput
          style={styles.input}
          value={hospital}
          onChangeText={setHospital}
          placeholder="e.g. Toledo General Hospital"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
        />

        <Label text="Additional Notes" />
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={message}
          onChangeText={setMessage}
          placeholder="Any additional information about your qualifications..."
          placeholderTextColor={Colors.textMuted}
          multiline
        />

        {/* Document upload */}
        <Label text="Credential Documents * (up to 3)" />
        <Text style={styles.hint}>
          Photos of your degree, certifications, or medical license
        </Text>

        <View style={styles.imageGrid}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri: img.uri }} style={styles.thumbImg} />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => removeImage(i)}
                accessibilityLabel={`Remove document ${i + 1}`}
              >
                <Ionicons name="close-circle" size={24} color={Colors.danger} />
              </TouchableOpacity>
              <Text style={styles.thumbLabel} numberOfLines={1}>{img.name}</Text>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={pickImage}
              accessibilityLabel="Add document photo"
            >
              <Ionicons name="camera-outline" size={32} color={Colors.primaryLight} />
              <Text style={styles.addImageTxt}>Add Document</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit doctor application"
        >
          {submitting ? (
            <ActivityIndicator color={Colors.textOnDark} size="large" />
          ) : (
            <>
              <Ionicons name="send-outline" size={22} color={Colors.textOnDark} />
              <Text style={styles.submitBtnTxt}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </Modal>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.displayM,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: Typography.bodyM,
    color: Colors.textSecondary,
    lineHeight: Typography.bodyM * 1.6,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.bodyL,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  hint: {
    fontSize: Typography.bodyS,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.bodyL,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: MinTouchTarget,
  },
  inputMulti: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  imageThumb: {
    width: 100,
    alignItems: "center",
  },
  thumbImg: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumbRemove: {
    position: "absolute",
    top: -10,
    right: -10,
  },
  thumbLabel: {
    fontSize: Typography.tiny,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 100,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.primary + "08",
  },
  addImageTxt: {
    fontSize: Typography.tiny,
    color: Colors.primaryLight,
    textAlign: "center",
    fontWeight: Typography.semibold,
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    minHeight: MinTouchTarget + 8,
    ...Shadow.card,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnTxt: {
    fontSize: Typography.bodyXL,
    fontWeight: Typography.bold,
    color: Colors.textOnDark,
  },
});