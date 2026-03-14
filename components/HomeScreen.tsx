import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Colors,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "../constants/theme";
import {
  DoseLogWithMed,
  Patient,
  User,
  getCareTeam,
  getDoseLogsForDate,
  getPatient,
  getUpcomingDoses,
  triggerPanicAlert,
} from "../services/api";
import MedicationCard from "./MedicationCard";

interface Props {
  userId: string;
  patientId: string;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function displayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function HomeScreen({ userId, patientId }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [careTeam, setCareTeam] = useState<User[]>([]);
  const [allDoses, setAllDoses] = useState<DoseLogWithMed[]>([]);
  const [upcomingDoses, setUpcomingDoses] = useState<DoseLogWithMed[]>([]);
  const [viewMode, setViewMode] = useState<"upcoming" | "all">("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [p, team, doses, upcoming] = await Promise.all([
        getPatient(patientId),
        getCareTeam(patientId),
        getDoseLogsForDate(patientId, todayStr()),
        getUpcomingDoses(patientId, 12),
      ]);
      setPatient(p);
      setCareTeam(team);
      setAllDoses(doses);
      setUpcomingDoses(upcoming);
    } catch {
      Alert.alert(
        "Error",
        "Could not load medication data. Pull down to retry.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleDoseChange = (updated: DoseLogWithMed) => {
    setAllDoses((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setUpcomingDoses((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d)),
    );
  };

  const callMember = (phone: string, name: string) => {
    Alert.alert(`Call ${name}?`, phone, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () => Linking.openURL(`tel:${phone.replace(/\D/g, "")}`),
      },
    ]);
  };

  const handlePanic = () => {
    Alert.alert(
      "🚨 Send Emergency Alert?",
      "This will immediately notify the doctor and nurse on duty.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SEND ALERT",
          style: "destructive",
          onPress: async () => {
            setPanicLoading(true);
            try {
              const result = await triggerPanicAlert(patientId, userId);
              Alert.alert(
                "✓ Alert Sent",
                `The care team has been notified:\n\n${result.sentTo.join("\n")}`,
              );
            } finally {
              setPanicLoading(false);
            }
          },
        },
      ],
    );
  };

  const displayed = viewMode === "upcoming" ? upcomingDoses : allDoses;
  const takenCount = allDoses.filter((d) => d.taken).length;
  const totalCount = allDoses.length;
  const pct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading medications…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* ── Patient header ── */}
      <View style={styles.header}>
        <Text style={styles.patientName}>{patient?.name ?? "—"}</Text>
        <Text style={styles.dateTxt}>{displayDate()}</Text>
        {patient?.roomNumber && (
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeTxt}>Room {patient.roomNumber}</Text>
          </View>
        )}
      </View>

      {/* ── Progress card ── */}
      <View style={styles.progressCard}>
        <View style={styles.statsRow}>
          <Stat value={takenCount} label="Taken Today" color={Colors.accent} />
          <View style={styles.statDivider} />
          <Stat
            value={totalCount - takenCount}
            label="Remaining"
            color={Colors.upcoming}
          />
          <View style={styles.statDivider} />
          <Stat value={totalCount} label="Total" color={Colors.textSecondary} />
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.barLabel}>{pct}% complete today</Text>
      </View>

      {/* ── PANIC BUTTON ── */}
      <TouchableOpacity
        style={[styles.panic, panicLoading && styles.panicLoading]}
        onPress={handlePanic}
        disabled={panicLoading}
        accessibilityRole="button"
        accessibilityLabel="Emergency alert — notifies care team immediately"
      >
        {panicLoading ? (
          <ActivityIndicator size="large" color={Colors.textOnDark} />
        ) : (
          <>
            <Text style={styles.panicIcon}>🚨</Text>
            <Text style={styles.panicTitle}>EMERGENCY ALERT</Text>
            <Text style={styles.panicSub}>
              Tap to notify care team immediately
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ── Care team ── */}
      <Text style={styles.sectionTitle}>Care Team</Text>
      <View style={styles.careRow}>
        {careTeam.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.careCard}
            onPress={() => callMember(m.phone ?? "", m.name)}
            accessibilityLabel={`Call ${m.name}`}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.careAvatar,
                {
                  backgroundColor:
                    m.role === "doctor" ? Colors.primary : Colors.accent,
                },
              ]}
            >
              <Text style={styles.careEmoji}>
                {m.role === "doctor" ? "👨‍⚕️" : "👩‍⚕️"}
              </Text>
            </View>
            <Text style={styles.careName}>{m.name}</Text>
            <Text style={styles.careRole}>
              {m.role === "doctor" ? (m.specialty ?? "Doctor") : "Nurse"}
            </Text>
            {m.phone && <Text style={styles.carePhone}>{m.phone}</Text>}
            <View style={styles.callBtn}>
              <Text style={styles.callBtnTxt}>📞 Call</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Medications ── */}
      <View style={styles.medHeader}>
        <Text style={styles.sectionTitle}>Medications</Text>
        <View style={styles.viewToggle}>
          <ToggleBtn
            label="Next Up"
            active={viewMode === "upcoming"}
            onPress={() => setViewMode("upcoming")}
          />
          <ToggleBtn
            label="All Day"
            active={viewMode === "all"}
            onPress={() => setViewMode("all")}
          />
        </View>
      </View>

      <Text style={styles.medSubtitle}>
        {viewMode === "upcoming"
          ? upcomingDoses.length > 3
            ? `${upcomingDoses.length} medications due in the next 12 hours`
            : "Next 3 medications due"
          : `All ${totalCount} medications scheduled today`}
      </Text>

      {displayed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>
            {viewMode === "upcoming"
              ? "No upcoming medications in the next 12 hours."
              : "No medications scheduled for today."}
          </Text>
        </View>
      ) : (
        displayed.map((dose) => (
          <MedicationCard
            key={dose.id}
            doseLog={dose}
            userId={userId}
            onStatusChange={handleDoseChange}
          />
        ))
      )}

      {/* ── Medical info ── */}
      {patient && (
        <>
          <Text style={styles.sectionTitle}>Medical Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoSectionLabel}>
              Conditions Being Treated
            </Text>
            {patient.conditions.map((c, i) => (
              <Text key={i} style={styles.infoItem}>
                • {c}
              </Text>
            ))}
            <View style={styles.infoDivider} />
            <Text style={[styles.infoSectionLabel, { color: Colors.danger }]}>
              ⚠️ Allergies
            </Text>
            {patient.allergies.map((a, i) => (
              <Text key={i} style={[styles.infoItem, { color: Colors.danger }]}>
                • {a}
              </Text>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: Typography.displayM,
          fontWeight: Typography.bold,
          color,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: Typography.bodyS,
          color: Colors.textSecondary,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ToggleBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[toggleBtnStyle, active && toggleBtnActiveStyle]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[toggleTxtStyle, active && toggleTxtActiveStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const toggleBtnStyle: import("react-native").ViewStyle = {
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
  borderRadius: Radius.sm,
  minHeight: 40,
  justifyContent: "center",
};
const toggleBtnActiveStyle: import("react-native").ViewStyle = {
  backgroundColor: Colors.surface,
  ...Shadow.card,
};
const toggleTxtStyle: import("react-native").TextStyle = {
  fontSize: Typography.bodyM,
  color: Colors.textMuted,
  fontWeight: Typography.semibold,
};
const toggleTxtActiveStyle: import("react-native").TextStyle = {
  color: Colors.primary,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  loaderText: { fontSize: Typography.bodyL, color: Colors.textSecondary },

  // Header
  header: { marginBottom: Spacing.lg },
  greetTxt: { fontSize: Typography.bodyL, color: Colors.textSecondary },
  patientName: {
    fontSize: Typography.displayXL,
    fontWeight: Typography.bold,
    color: Colors.primary,
    lineHeight: Typography.displayXL * 1.2,
  },
  dateTxt: {
    fontSize: Typography.bodyM,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  roomBadge: {
    backgroundColor: Colors.primary + "20",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  roomBadgeTxt: {
    fontSize: Typography.bodyS,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },

  // Progress
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.md,
  },
  statDivider: { width: 1, backgroundColor: Colors.border },
  barTrack: {
    height: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  barLabel: {
    fontSize: Typography.bodyS,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  // Panic
  panic: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    minHeight: 110,
    justifyContent: "center",
    ...Shadow.card,
  },
  panicLoading: { opacity: 0.75 },
  panicIcon: { fontSize: 44, marginBottom: Spacing.xs },
  panicTitle: {
    fontSize: Typography.displayM,
    fontWeight: Typography.bold,
    color: Colors.textOnDark,
    letterSpacing: 1.5,
  },
  panicSub: {
    fontSize: Typography.bodyM,
    color: Colors.textOnDark + "BB",
    marginTop: 4,
  },

  // Section
  sectionTitle: {
    fontSize: Typography.displayM,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Care team
  careRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  careCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.card,
  },
  careAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  careEmoji: { fontSize: 30 },
  careName: {
    fontSize: Typography.bodyM,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  careRole: {
    fontSize: Typography.bodyS,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 2,
  },
  carePhone: {
    fontSize: Typography.bodyS,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  callBtn: {
    backgroundColor: Colors.primary + "18",
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  callBtnTxt: {
    fontSize: Typography.bodyM,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },

  // Med header
  medHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: 3,
  },
  medSubtitle: {
    fontSize: Typography.bodyM,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  // Empty
  empty: { alignItems: "center", paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 72, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: Typography.displayM,
    fontWeight: Typography.bold,
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.bodyL,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: Typography.bodyL * 1.6,
    maxWidth: 280,
  },

  // Medical info
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  infoSectionLabel: {
    fontSize: Typography.bodyL,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    fontSize: Typography.bodyM,
    color: Colors.textSecondary,
    lineHeight: Typography.bodyM * 1.6,
    marginBottom: 4,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
});
