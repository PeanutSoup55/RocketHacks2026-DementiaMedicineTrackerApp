import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "@/constants/theme";
import { globalUserId } from "@/app/_layout";
import {
  getDoctorPatients,
  getPatientMedications,
  getDoseLogsForDate,
  createDoseLog,
  deleteDoseLog,
  Patient,
  Medication,
  DoseLogWithMed,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { scheduleDoseNotification } from "@/services/notifications";

const TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function DoctorScheduleTab() {
  const [patients, setPatients]           = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medications, setMedications]     = useState<Medication[]>([]);
  const [doses, setDoses]                 = useState<DoseLogWithMed[]>([]);
  const [showForm, setShowForm]           = useState(false);
  const [selectedMed, setSelectedMed]     = useState<Medication | null>(null);
  const [selectedTime, setSelectedTime]   = useState("08:00");
  const [selectedDate, setSelectedDate]   = useState(todayStr());
  const [notes, setNotes]                 = useState("");
  const [saving, setSaving]               = useState(false);
  const [loading, setLoading]             = useState(true);
  const doctorUid = globalUserId ?? "";

  const loadAll = useCallback(async () => {
    const pts = await getDoctorPatients(doctorUid);
    setPatients(pts);
    if (pts.length > 0 && !selectedPatient) setSelectedPatient(pts[0]);
    setLoading(false);
  }, [doctorUid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!selectedPatient) return;
    Promise.all([
      getPatientMedications(selectedPatient.id),
      getDoseLogsForDate(selectedPatient.id, todayStr()),
    ]).then(([meds, d]) => {
      setMedications(meds);
      setDoses(d);
      if (meds.length > 0) setSelectedMed(meds[0]);
    });
  }, [selectedPatient]);

  const handleAddDose = async () => {
    if (!selectedPatient || !selectedMed) return;
    setSaving(true);
    try {
      const newDose = await createDoseLog({
        patientId:     selectedPatient.id,
        medicationId:  selectedMed.id,
        scheduledTime: selectedTime,
        scheduledDate: selectedDate,
        notes:         notes.trim() || undefined,
      });
      if (newDose) {
        const doseWithMed = { ...newDose, medication: selectedMed };
        setDoses((prev) => [...prev, doseWithMed]
          .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));
        setNotes("");
        setShowForm(false);
        // Schedule 30-min reminder notification for the new dose
        scheduleDoseNotification(doseWithMed);
        Alert.alert("✅ Scheduled", `${selectedMed.name} added at ${formatTime(selectedTime)}.`);
      }
    } catch (e) {
      Alert.alert("Error", "Could not create dose log. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDose = (dose: DoseLogWithMed) => {
    Alert.alert(
      "Remove Dose?",
      `Remove ${dose.medication.name} at ${formatTime(dose.scheduledTime)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteDoseLog(dose.id);
            if (ok) setDoses((prev) => prev.filter((d) => d.id !== dose.id));
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Group doses by time for display
  const sortedDoses = [...doses].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Dose Schedule</Text>

        {/* Patient selector */}
        <Text style={styles.sectionLabel}>Patient</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientScroll}>
          {patients.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.patientChip, selectedPatient?.id === p.id && styles.patientChipActive]}
              onPress={() => setSelectedPatient(p)}
            >
              <Text style={[styles.patientChipText, selectedPatient?.id === p.id && styles.patientChipTextActive]}>
                {p.name}
              </Text>
              <Text style={[styles.patientChipRoom, selectedPatient?.id === p.id && { color: Colors.textOnDark + "BB" }]}>
                Room {p.roomNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPatient && (
          <>
            {/* Today's schedule header */}
            <View style={styles.sectionRow}>
              <View>
                <Text style={styles.sectionLabel}>Today's Schedule</Text>
                <Text style={styles.sectionSub}>{selectedDate}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.addBtnText}>+ Add Dose</Text>
              </TouchableOpacity>
            </View>

            {sortedDoses.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>No doses scheduled today.</Text>
                <Text style={styles.emptySubText}>Tap "+ Add Dose" to schedule one.</Text>
              </View>
            ) : (
              sortedDoses.map((dose) => (
                <View key={dose.id} style={[styles.doseCard, dose.taken && styles.doseCardTaken]}>
                  <View style={styles.doseTime}>
                    <Text style={styles.doseTimeText}>{formatTime(dose.scheduledTime)}</Text>
                    <View style={[styles.takenDot, { backgroundColor: dose.taken ? Colors.taken : Colors.border }]} />
                  </View>
                  <View style={styles.doseLine} />
                  <View style={styles.doseInfo}>
                    <View style={[styles.pillDot, { backgroundColor: dose.medication.color === "#FFFFFF" ? "#EBEBEB" : dose.medication.color }]} />
                    <View style={styles.doseText}>
                      <Text style={styles.doseMedName}>{dose.medication.name}</Text>
                      <Text style={styles.doseMedDetail}>{dose.medication.dosage}  ·  {dose.medication.form}</Text>
                      {dose.notes && <Text style={styles.doseNotes}>📝 {dose.notes}</Text>}
                      {dose.taken && (
                        <Text style={styles.doseTakenLabel}>
                          ✓ Taken at {dose.takenAt}{dose.administeredBy ? " by care team" : ""}
                        </Text>
                      )}
                    </View>
                    {!dose.taken && (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteDose(dose)}
                        accessibilityLabel="Delete dose"
                      >
                        <Ionicons name="close-circle" size={28} color={Colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Dose Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule a Dose</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedPatient && (
            <View style={styles.modalPatientBadge}>
              <Text style={styles.modalPatientBadgeTxt}>
                For: {selectedPatient.name}  ·  Room {selectedPatient.roomNumber}
              </Text>
            </View>
          )}

          {/* Medication picker */}
          <Text style={styles.fieldLabel}>Medication</Text>
          {medications.length === 0 ? (
            <Text style={styles.noMedsText}>No medications prescribed yet. Go to the Prescribe tab first.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {medications.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  style={[styles.medChip, selectedMed?.id === med.id && styles.medChipActive]}
                  onPress={() => setSelectedMed(med)}
                >
                  <View style={[styles.medChipDot, { backgroundColor: med.color === "#FFFFFF" ? "#EBEBEB" : med.color }]} />
                  <View>
                    <Text style={[styles.medChipName, selectedMed?.id === med.id && { color: Colors.textOnDark }]}>
                      {med.name}
                    </Text>
                    <Text style={[styles.medChipDose, selectedMed?.id === med.id && { color: Colors.textOnDark + "BB" }]}>
                      {med.dosage}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Time picker */}
          <Text style={styles.fieldLabel}>Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            {TIMES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeChipText, selectedTime === t && styles.timeChipTextActive]}>
                  {formatTime(t)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date */}
          <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.fieldInput}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="2026-03-14"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldInputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Take with breakfast"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <TouchableOpacity
            style={[styles.saveBtn, (saving || !selectedMed || medications.length === 0) && styles.saveBtnDisabled]}
            onPress={handleAddDose}
            disabled={saving || !selectedMed || medications.length === 0}
          >
            {saving
              ? <ActivityIndicator color={Colors.textOnDark} />
              : <Text style={styles.saveBtnTxt}>Add to Schedule</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  pageTitle: { fontSize: Typography.displayL, fontWeight: Typography.bold, color: Colors.primary, marginBottom: Spacing.xl },
  sectionLabel: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: Typography.bodyM, color: Colors.textMuted },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md, marginTop: Spacing.lg },

  patientScroll: { marginBottom: Spacing.lg },
  patientChip: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.border, minWidth: 140, ...Shadow.card },
  patientChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  patientChipText: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textPrimary },
  patientChipTextActive: { color: Colors.textOnDark },
  patientChipRoom: { fontSize: Typography.bodyS, color: Colors.textMuted, marginTop: 2 },

  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, minHeight: 44, justifyContent: "center" },
  addBtnText: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textOnDark },

  empty: { alignItems: "center", paddingVertical: Spacing.xl },
  emptyText: { fontSize: Typography.bodyXL, fontWeight: Typography.semibold, color: Colors.textSecondary },
  emptySubText: { fontSize: Typography.bodyM, color: Colors.textMuted, marginTop: 4 },

  // Timeline dose cards
  doseCard: { flexDirection: "row", alignItems: "flex-start", marginBottom: Spacing.md },
  doseCardTaken: { opacity: 0.6 },
  doseTime: { width: 72, alignItems: "flex-end", paddingRight: Spacing.sm, paddingTop: 4 },
  doseTimeText: { fontSize: Typography.bodyM, fontWeight: Typography.bold, color: Colors.primary },
  takenDot: { width: 12, height: 12, borderRadius: Radius.full, marginTop: 4 },
  doseLine: { width: 2, backgroundColor: Colors.border, alignSelf: "stretch", marginHorizontal: Spacing.sm },
  doseInfo: { flex: 1, flexDirection: "row", backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: "flex-start", gap: Spacing.sm, ...Shadow.card },
  pillDot: { width: 16, height: 16, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, marginTop: 3, flexShrink: 0 },
  doseText: { flex: 1 },
  doseMedName: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textPrimary },
  doseMedDetail: { fontSize: Typography.bodyS, color: Colors.textMuted },
  doseNotes: { fontSize: Typography.bodyS, color: Colors.warning, marginTop: 2 },
  doseTakenLabel: { fontSize: Typography.bodyS, color: Colors.taken, fontWeight: Typography.semibold, marginTop: 2 },
  deleteBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalContent: { padding: Spacing.lg, paddingTop: Spacing.xl },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.displayM, fontWeight: Typography.bold, color: Colors.textPrimary },
  modalClose: { width: MinTouchTarget, height: MinTouchTarget, alignItems: "center", justifyContent: "center" },
  modalCloseTxt: { fontSize: Typography.bodyXL, color: Colors.textMuted },
  modalPatientBadge: { backgroundColor: Colors.primary + "18", borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  modalPatientBadgeTxt: { fontSize: Typography.bodyL, fontWeight: Typography.semibold, color: Colors.primary },

  fieldLabel: { fontSize: Typography.bodyL, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  fieldInput: { borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Typography.bodyL, color: Colors.textPrimary, backgroundColor: Colors.surface, minHeight: MinTouchTarget },
  fieldInputMulti: { minHeight: 80, textAlignVertical: "top" },
  noMedsText: { fontSize: Typography.bodyM, color: Colors.warning, marginBottom: Spacing.md },

  medChip: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.border, flexDirection: "row", alignItems: "center", gap: Spacing.sm, minWidth: 140 },
  medChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  medChipDot: { width: 14, height: 14, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border + "80" },
  medChipName: { fontSize: Typography.bodyM, fontWeight: Typography.bold, color: Colors.textPrimary },
  medChipDose: { fontSize: Typography.bodyS, color: Colors.textMuted },

  timeChip: { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.border, minHeight: 44, justifyContent: "center" },
  timeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeChipText: { fontSize: Typography.bodyM, fontWeight: Typography.semibold, color: Colors.textSecondary },
  timeChipTextActive: { color: Colors.textOnDark },

  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.xl, minHeight: MinTouchTarget + 8, justifyContent: "center", ...Shadow.card },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnTxt: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textOnDark },
});