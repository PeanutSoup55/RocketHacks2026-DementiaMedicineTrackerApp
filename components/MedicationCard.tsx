import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { DoseLogWithMed, markDoseTaken, undoMarkDoseTaken } from "../services/api";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  doseLog: DoseLogWithMed;
  userId: string;
  onStatusChange: (updated: DoseLogWithMed) => void;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function isOverdue(scheduledTime: string): boolean {
  const now = new Date();
  const [h, m] = scheduledTime.split(":").map(Number);
  return h * 60 + m < now.getHours() * 60 + now.getMinutes();
}

export default function MedicationCard({ doseLog, userId, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { medication } = doseLog;

  const overdue = !doseLog.taken && isOverdue(doseLog.scheduledTime);
  const statusColor = doseLog.taken ? Colors.taken : overdue ? Colors.overdue : Colors.upcoming;
  const statusLabel = doseLog.taken
    ? `✓  Taken at ${doseLog.takenAt}`
    : overdue
    ? "⚠️  Overdue"
    : "⏰  Upcoming";

  const handleCheck = async () => {
    if (doseLog.taken) {
      Alert.alert(
        "Undo Dose?",
        `Mark ${medication.name} as NOT taken?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Undo",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                const updated = await undoMarkDoseTaken(doseLog.id);
                if (updated) onStatusChange({ ...updated, medication });
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Medication Given",
      `Mark ${medication.name} ${medication.dosage} as taken?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            try {
              const updated = await markDoseTaken(doseLog.id, userId);
              if (updated) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onStatusChange({ ...updated, medication });
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  // pill color indicator — white pills get a grey outline so they're visible
  const pillBg = medication.color === "#FFFFFF" ? "#EBEBEB" : medication.color;

  return (
    <View style={[styles.card, { borderLeftColor: statusColor }, doseLog.taken && styles.cardTaken]}>
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        <View style={[styles.pillDot, { backgroundColor: pillBg }]} />

        <View style={styles.medInfo}>
          <Text style={[styles.medName, doseLog.taken && styles.strikethrough]}>
            {medication.name}
          </Text>
          <Text style={styles.brandName}>{medication.brandName}</Text>
          <Text style={styles.dosage}>
            {medication.dosage}  ·  {medication.form}  ·  {medication.colorName} pill
          </Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={[styles.time, { color: statusColor }]}>
            {formatTime(doseLog.scheduledTime)}
          </Text>
          <TouchableOpacity
            style={[
              styles.checkbox,
              doseLog.taken && styles.checkboxOn,
              loading && styles.checkboxLoading,
            ]}
            onPress={handleCheck}
            disabled={loading}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: doseLog.taken }}
            accessibilityLabel={
              doseLog.taken
                ? `Undo: ${medication.name} taken`
                : `Mark ${medication.name} as taken`
            }
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.textOnDark} />
            ) : doseLog.taken ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Status strip ── */}
      <View style={[styles.statusStrip, { backgroundColor: statusColor + "1A" }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* ── Expand toggle ── */}
      <TouchableOpacity
        style={styles.expandBtn}
        onPress={toggleExpanded}
        accessibilityLabel={expanded ? "Hide medication details" : "Show medication details"}
      >
        <Text style={styles.expandBtnTxt}>{expanded ? "Hide Details" : "Show Details"}</Text>
      </TouchableOpacity>

      {/* ── Expanded detail ── */}
      {expanded && (
        <View style={styles.details}>
          <DetailRow label="Treats" value={medication.treatsCondition} />
          <DetailRow label="Instructions" value={medication.instructions} />

          <Text style={styles.detailLabel}>Side Effects to Watch For:</Text>
          {medication.sideEffects.map((se, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{se}</Text>
            </View>
          ))}

          {doseLog.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>📝  Nurse Notes</Text>
              <Text style={styles.notesText}>{doseLog.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <Text style={detailLabelStyle}>{label}:</Text>
      <Text style={detailValueStyle}>{value}</Text>
    </View>
  );
}
const detailLabelStyle: import("react-native").TextStyle = {
  fontSize: Typography.bodyM,
  fontWeight: Typography.bold,
  color: Colors.textPrimary,
  marginBottom: 2,
};
const detailValueStyle: import("react-native").TextStyle = {
  fontSize: Typography.bodyM,
  color: Colors.textSecondary,
  lineHeight: Typography.bodyM * 1.6,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 5,
    overflow: "hidden",
    ...Shadow.card,
  },
  cardTaken: { opacity: 0.78 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  pillDot: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  medInfo: { flex: 1 },
  medName: {
    fontSize: Typography.bodyXL,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.bodyXL * 1.2,
  },
  strikethrough: { textDecorationLine: "line-through", color: Colors.textMuted },
  brandName: { fontSize: Typography.bodyM, color: Colors.textSecondary, fontStyle: "italic" },
  dosage: { fontSize: Typography.bodyS, color: Colors.textMuted, marginTop: 2 },

  rightCol: { alignItems: "center", gap: Spacing.sm, flexShrink: 0 },
  time: { fontSize: Typography.bodyL, fontWeight: Typography.bold },
  checkbox: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: Radius.md,
    borderWidth: 3,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxLoading: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  checkmark: {
    fontSize: 30,
    color: Colors.textOnDark,
    fontWeight: Typography.bold,
    lineHeight: 34,
  },

  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: Radius.full },
  statusText: { fontSize: Typography.bodyS, fontWeight: Typography.semibold },

  expandBtn: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
    minHeight: MinTouchTarget,
    justifyContent: "center",
  },
  expandBtnTxt: { fontSize: Typography.bodyM, color: Colors.primaryLight, fontWeight: Typography.semibold },

  details: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceAlt,
  },
  detailLabel: {
    fontSize: Typography.bodyM,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  bulletRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: 4 },
  bulletDot: { fontSize: Typography.bodyM, color: Colors.warning, lineHeight: Typography.bodyM * 1.6 },
  bulletText: { flex: 1, fontSize: Typography.bodyM, color: Colors.textSecondary, lineHeight: Typography.bodyM * 1.6 },

  notesBox: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  notesLabel: { fontSize: Typography.bodyM, fontWeight: Typography.bold, color: Colors.warning, marginBottom: Spacing.xs },
  notesText: { fontSize: Typography.bodyM, color: Colors.textSecondary, lineHeight: Typography.bodyM * 1.6 },
});