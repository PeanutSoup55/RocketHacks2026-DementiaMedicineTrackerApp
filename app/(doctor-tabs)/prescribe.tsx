import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow, MinTouchTarget } from "@/constants/theme";
import { globalUserId } from "@/app/_layout";
import {
  getDoctorPatients,
  getPatientMedications,
  createMedication,
  deactivateMedication,
  Patient,
  Medication,
} from "@/services/api";

const PILL_COLORS = [
  { hex: "#4A90D9", name: "Blue" },
  { hex: "#E8C547", name: "Yellow" },
  { hex: "#F4A261", name: "Orange" },
  { hex: "#E07070", name: "Red" },
  { hex: "#7EC87E", name: "Green" },
  { hex: "#C084E0", name: "Purple" },
  { hex: "#EBEBEB", name: "White" },
  { hex: "#BBBBBB", name: "Gray" },
];

const FORMS = ["Tablet", "Capsule", "Liquid", "Patch", "Injection", "Inhaler", "Drops"];

interface NewMedForm {
  name: string;
  brandName: string;
  dosage: string;
  form: string;
  color: string;
  colorName: string;
  treatsCondition: string;
  sideEffects: string;    // comma-separated input, split on save
  instructions: string;
}

const EMPTY_FORM: NewMedForm = {
  name: "", brandName: "", dosage: "", form: "Tablet",
  color: "#4A90D9", colorName: "Blue",
  treatsCondition: "", sideEffects: "", instructions: "",
};

export default function DoctorPrescribeTab() {
  const [patients, setPatients]             = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medications, setMedications]       = useState<Medication[]>([]);
  const [showForm, setShowForm]             = useState(false);
  const [form, setForm]                     = useState<NewMedForm>(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [loading, setLoading]               = useState(true);
  const doctorUid = globalUserId ?? "";

  const loadPatients = useCallback(async () => {
    const pts = await getDoctorPatients(doctorUid);
    setPatients(pts);
    if (pts.length > 0 && !selectedPatient) {
      setSelectedPatient(pts[0]);
    }
    setLoading(false);
  }, [doctorUid]);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  useEffect(() => {
    if (!selectedPatient) return;
    getPatientMedications(selectedPatient.id).then(setMedications);
  }, [selectedPatient]);

  const handleSave = async () => {
    if (!selectedPatient) return;
    if (!form.name.trim() || !form.dosage.trim() || !form.treatsCondition.trim()) {
      Alert.alert("Missing Fields", "Please fill in medication name, dosage, and condition treated.");
      return;
    }
    setSaving(true);
    try {
      const newMed = await createMedication({
        patientId:        selectedPatient.id,
        name:             form.name.trim(),
        brandName:        form.brandName.trim(),
        dosage:           form.dosage.trim(),
        form:             form.form,
        color:            form.color,
        colorName:        form.colorName,
        treatsCondition:  form.treatsCondition.trim(),
        sideEffects:      form.sideEffects.split(",").map((s) => s.trim()).filter(Boolean),
        instructions:     form.instructions.trim(),
        prescribedBy:     doctorUid,
      });
      if (newMed) {
        setMedications((prev) => [...prev, newMed]);
        setForm(EMPTY_FORM);
        setShowForm(false);
        Alert.alert("✅ Prescribed", `${newMed.name} has been added to ${selectedPatient.name}'s medications.`);
      }
    } catch (e) {
      Alert.alert("Error", "Could not save medication. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (med: Medication) => {
    Alert.alert(
      "Remove Medication?",
      `Stop prescribing ${med.name} to ${selectedPatient?.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const ok = await deactivateMedication(med.id);
            if (ok) setMedications((prev) => prev.filter((m) => m.id !== med.id));
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

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.pageTitle}>Prescribe Medications</Text>

        {/* Patient selector */}
        <Text style={styles.sectionLabel}>Select Patient</Text>
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
              <Text style={[styles.patientChipRoom, selectedPatient?.id === p.id && styles.patientChipTextActive]}>
                Room {p.roomNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {patients.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No patients assigned to you yet.</Text>
          </View>
        )}

        {/* Current medications */}
        {selectedPatient && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>
                Current Medications — {selectedPatient.name}
              </Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowForm(true)}
                accessibilityLabel="Add new medication"
              >
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {medications.length === 0 ? (
              <View style={styles.emptyMeds}>
                <Text style={styles.emptyText}>No medications prescribed yet.</Text>
              </View>
            ) : (
              medications.map((med) => (
                <View key={med.id} style={styles.medCard}>
                  <View style={styles.medCardLeft}>
                    <View style={[styles.pillDot, {
                      backgroundColor: med.color === "#FFFFFF" ? "#EBEBEB" : med.color,
                    }]} />
                    <View style={styles.medCardInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medBrand}>{med.brandName}</Text>
                      <Text style={styles.medDosage}>{med.dosage}  ·  {med.form}  ·  {med.colorName}</Text>
                      <Text style={styles.medCondition}>Treats: {med.treatsCondition}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleDeactivate(med)}
                    accessibilityLabel={`Remove ${med.name}`}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* New Medication Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Prescription</Text>
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

          <FormField label="Medication Name *" placeholder="e.g. Donepezil"
            value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <FormField label="Brand Name" placeholder="e.g. Aricept"
            value={form.brandName} onChangeText={(v) => setForm({ ...form, brandName: v })} />
          <FormField label="Dosage *" placeholder="e.g. 10 mg"
            value={form.dosage} onChangeText={(v) => setForm({ ...form, dosage: v })} />
          <FormField label="Treats Condition *" placeholder="e.g. Alzheimer's Disease"
            value={form.treatsCondition} onChangeText={(v) => setForm({ ...form, treatsCondition: v })} />
          <FormField label="Instructions" placeholder="e.g. Take with food"
            value={form.instructions} onChangeText={(v) => setForm({ ...form, instructions: v })}
            multiline />
          <FormField label="Side Effects (comma separated)"
            placeholder="e.g. Nausea, Headache, Fatigue"
            value={form.sideEffects} onChangeText={(v) => setForm({ ...form, sideEffects: v })}
            multiline />

          {/* Form selector */}
          <Text style={styles.fieldLabel}>Form</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            {FORMS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.formChip, form.form === f && styles.formChipActive]}
                onPress={() => setForm({ ...form, form: f })}
              >
                <Text style={[styles.formChipTxt, form.form === f && styles.formChipTxtActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pill color picker */}
          <Text style={styles.fieldLabel}>Pill Color</Text>
          <View style={styles.colorGrid}>
            {PILL_COLORS.map((c) => (
              <TouchableOpacity
                key={c.hex}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c.hex, borderWidth: form.color === c.hex ? 3 : 1 },
                  { borderColor: form.color === c.hex ? Colors.primary : Colors.border },
                ]}
                onPress={() => setForm({ ...form, color: c.hex, colorName: c.name })}
                accessibilityLabel={c.name}
              >
                {form.color === c.hex && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.colorLabel}>Selected: {form.colorName}</Text>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.textOnDark} />
              : <Text style={styles.saveBtnTxt}>Prescribe Medication</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

function FormField({ label, placeholder, value, onChangeText, multiline }: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; multiline?: boolean;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        autoCapitalize="words"
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },

  pageTitle: { fontSize: Typography.displayL, fontWeight: Typography.bold, color: Colors.primary, marginBottom: Spacing.xl },

  sectionLabel: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.sm, marginTop: Spacing.lg },

  patientScroll: { marginBottom: Spacing.lg },
  patientChip: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.border, minWidth: 140, ...Shadow.card },
  patientChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  patientChipText: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textPrimary },
  patientChipTextActive: { color: Colors.textOnDark },
  patientChipRoom: { fontSize: Typography.bodyS, color: Colors.textMuted, marginTop: 2 },

  addBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, minHeight: 40, justifyContent: "center" },
  addBtnText: { fontSize: Typography.bodyL, fontWeight: Typography.bold, color: Colors.textOnDark },

  empty: { alignItems: "center", paddingVertical: Spacing.xl },
  emptyMeds: { paddingVertical: Spacing.lg, alignItems: "center" },
  emptyText: { fontSize: Typography.bodyL, color: Colors.textMuted },

  medCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderLeftWidth: 4, borderLeftColor: Colors.primary, ...Shadow.card },
  medCardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: Spacing.sm },
  pillDot: { width: 20, height: 20, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, flexShrink: 0 },
  medCardInfo: { flex: 1 },
  medName: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textPrimary },
  medBrand: { fontSize: Typography.bodyM, color: Colors.textSecondary, fontStyle: "italic" },
  medDosage: { fontSize: Typography.bodyS, color: Colors.textMuted },
  medCondition: { fontSize: Typography.bodyS, color: Colors.primaryLight, marginTop: 2 },
  removeBtn: { width: MinTouchTarget, height: MinTouchTarget, alignItems: "center", justifyContent: "center" },
  removeBtnText: { fontSize: Typography.bodyXL, color: Colors.danger, fontWeight: Typography.bold },

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
  fieldInputMulti: { minHeight: 90, textAlignVertical: "top" },

  formChip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.sm, borderWidth: 2, borderColor: Colors.border, minHeight: 40, justifyContent: "center" },
  formChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formChipTxt: { fontSize: Typography.bodyM, color: Colors.textSecondary, fontWeight: Typography.semibold },
  formChipTxtActive: { color: Colors.textOnDark },

  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.xs },
  colorSwatch: { width: 48, height: 48, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  colorCheck: { fontSize: 20, color: Colors.primary, fontWeight: Typography.bold },
  colorLabel: { fontSize: Typography.bodyM, color: Colors.textMuted, marginBottom: Spacing.md },

  saveBtn: { backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: Spacing.lg, alignItems: "center", marginTop: Spacing.xl, minHeight: MinTouchTarget + 8, justifyContent: "center", ...Shadow.card },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnTxt: { fontSize: Typography.bodyXL, fontWeight: Typography.bold, color: Colors.textOnDark },
});