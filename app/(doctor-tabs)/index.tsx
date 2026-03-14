import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "@/constants/theme";
import { globalUserId } from "@/app/_layout";
import {
  getDoctorPatients,
  getPatientMedications,
  getDoseLogsForDate,
  Patient,
  Medication,
} from "@/services/api";

interface PatientSummary {
  patient: Patient;
  medications: Medication[];
  takenToday: number;
  totalToday: number;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function DoctorPatientsTab() {
  const [summaries, setSummaries] = useState<PatientSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const doctorUid = globalUserId ?? "";

  const loadData = useCallback(async () => {
    try {
      const patients = await getDoctorPatients(doctorUid);
      const results = await Promise.all(
        patients.map(async (patient) => {
          const [medications, doses] = await Promise.all([
            getPatientMedications(patient.id),
            getDoseLogsForDate(patient.id, todayStr()),
          ]);
          return {
            patient,
            medications,
            takenToday: doses.filter((d) => d.taken).length,
            totalToday: doses.length,
          };
        })
      );
      setSummaries(results);
    } catch (e) {
      console.error("DoctorPatientsTab load failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorUid]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading patients…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Patients</Text>
        <Text style={styles.headerSub}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
      </View>

      {summaries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No patients yet</Text>
          <Text style={styles.emptyText}>
            Patients will appear here once they are assigned to you in Firestore.
          </Text>
        </View>
      ) : (
        summaries.map(({ patient, medications, takenToday, totalToday }) => {
          const pct = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;
          const allTaken = takenToday === totalToday && totalToday > 0;

          return (
            <View key={patient.id} style={styles.card}>
              {/* Patient name + room */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientMeta}>
                    Room {patient.roomNumber}  ·  DOB {patient.dateOfBirth}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: allTaken ? Colors.accent + "22" : Colors.warning + "22" }]}>
                  <Text style={[styles.statusBadgeText, { color: allTaken ? Colors.accent : Colors.warning }]}>
                    {allTaken ? "✓ All taken" : `${takenToday}/${totalToday}`}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: allTaken ? Colors.accent : Colors.upcoming }]} />
              </View>
              <Text style={styles.progressLabel}>{pct}% of today's medications taken</Text>

              {/* Conditions */}
              <View style={styles.conditionsRow}>
                {patient.conditions.slice(0, 2).map((c, i) => (
                  <View key={i} style={styles.conditionChip}>
                    <Text style={styles.conditionChipText}>{c}</Text>
                  </View>
                ))}
                {patient.conditions.length > 2 && (
                  <View style={styles.conditionChip}>
                    <Text style={styles.conditionChipText}>+{patient.conditions.length - 2} more</Text>
                  </View>
                )}
              </View>

              {/* Medication count */}
              <Text style={styles.medCount}>
                💊  {medications.length} active medication{medications.length !== 1 ? "s" : ""}
              </Text>

              {/* Allergies warning */}
              {patient.allergies.length > 0 && (
                <View style={styles.allergyRow}>
                  <Text style={styles.allergyText}>
                    ⚠️  Allergies: {patient.allergies.join(", ")}
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background, gap: Spacing.md },
  loaderText: { fontSize: Typography.bodyL, color: Colors.textSecondary },

  header: { marginBottom: Spacing.xl },
  headerTitle: { fontSize: Typography.displayL, fontWeight: Typography.bold, color: Colors.primary },
  headerSub: { fontSize: Typography.bodyM, color: Colors.textMuted, marginTop: 4 },

  empty: { alignItems: "center", paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.displayM, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.bodyL, color: Colors.textSecondary, textAlign: "center", lineHeight: Typography.bodyL * 1.6, maxWidth: 280 },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.md },
  avatarCircle: { width: 52, height: 52, borderRadius: Radius.full, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textOnDark },
  cardHeaderText: { flex: 1 },
  patientName: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textPrimary },
  patientMeta: { fontSize: Typography.bodyS, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  statusBadgeText: { fontSize: Typography.bodyS, fontWeight: Typography.bold },

  progressTrack: { height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: Radius.full },
  progressLabel: { fontSize: Typography.bodyS, color: Colors.textMuted, marginBottom: Spacing.sm },

  conditionsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.sm },
  conditionChip: { backgroundColor: Colors.primary + "18", borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  conditionChipText: { fontSize: Typography.bodyS, color: Colors.primary, fontWeight: Typography.semibold },

  medCount: { fontSize: Typography.bodyM, color: Colors.textSecondary, marginBottom: Spacing.xs },
  allergyRow: { backgroundColor: Colors.dangerLight, borderRadius: Radius.md, padding: Spacing.sm, marginTop: Spacing.xs },
  allergyText: { fontSize: Typography.bodyM, color: Colors.danger },
});