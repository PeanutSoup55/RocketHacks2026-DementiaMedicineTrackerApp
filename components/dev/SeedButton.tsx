// ============================================================
// DEV ONLY — Seed Button Component
// Drop this anywhere in your app during testing to populate
// Firestore with medications and dose logs.
// REMOVE before going to production.
//
// Usage in HomeScreen or any screen:
//   import SeedButton from "@/components/dev/SeedButton";
//   <SeedButton patientId={patientId} doctorUid={userId} />
// ============================================================

import React, { useState } from "react";
import { View, TouchableOpacity, Text, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { doc, setDoc, writeBatch, getFirestore } from "firebase/firestore";
import { db } from "@/config/firebase";

interface Props {
  patientId: string;
  doctorUid: string;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function SeedButton({ patientId, doctorUid }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    Alert.alert(
      "Seed Firestore?",
      "This will write medications and today's dose logs to Firestore. Run once only.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed",
          onPress: async () => {
            setLoading(true);
            try {
              await seedMedications(patientId, doctorUid);
              await seedDoseLogs(patientId);
              Alert.alert("✅ Done", "Medications and dose logs written to Firestore.");
            } catch (e: any) {
              Alert.alert("❌ Failed", e.message ?? "Unknown error");
              console.error("Seed failed:", e);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handleSeed} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.txt}>🌱 Seed Test Data (Dev Only)</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---- Medications ----

async function seedMedications(patientId: string, doctorUid: string) {
  const medications = [
    {
      id: "med_001",
      patientId,
      name: "Donepezil",
      brandName: "Aricept",
      dosage: "10 mg",
      form: "Tablet",
      color: "#4A90D9",
      colorName: "Blue",
      treatsCondition: "Alzheimer's Disease",
      sideEffects: [
        "Nausea or upset stomach",
        "Trouble sleeping",
        "Muscle cramps",
        "Fatigue or tiredness",
      ],
      instructions: "Take with a full glass of water. Can be taken with or without food.",
      prescribedBy: doctorUid,
      active: true,
    },
    {
      id: "med_002",
      patientId,
      name: "Lisinopril",
      brandName: "Prinivil",
      dosage: "5 mg",
      form: "Tablet",
      color: "#E8C547",
      colorName: "Yellow",
      treatsCondition: "High Blood Pressure",
      sideEffects: [
        "Dry cough",
        "Dizziness when standing",
        "Headache",
        "Mild skin rash",
      ],
      instructions: "Take at the same time each day. Avoid salt substitutes containing potassium.",
      prescribedBy: doctorUid,
      active: true,
    },
    {
      id: "med_003",
      patientId,
      name: "Metformin",
      brandName: "Glucophage",
      dosage: "500 mg",
      form: "Tablet",
      color: "#FFFFFF",
      colorName: "White",
      treatsCondition: "Type 2 Diabetes",
      sideEffects: [
        "Stomach upset or diarrhea (common when starting)",
        "Loss of appetite",
        "Metallic taste in mouth",
      ],
      instructions: "Take with meals to reduce stomach upset. Do not crush or chew.",
      prescribedBy: doctorUid,
      active: true,
    },
    {
      id: "med_004",
      patientId,
      name: "Memantine",
      brandName: "Namenda",
      dosage: "5 mg",
      form: "Tablet",
      color: "#F4A261",
      colorName: "Orange",
      treatsCondition: "Alzheimer's Disease (Moderate to Severe)",
      sideEffects: [
        "Dizziness",
        "Headache",
        "Confusion (mild)",
        "Constipation",
      ],
      instructions: "Can be taken with or without food. Take exactly as prescribed.",
      prescribedBy: doctorUid,
      active: true,
    },
  ];

  const batch = writeBatch(db);
  for (const med of medications) {
    const { id, ...data } = med;
    batch.set(doc(db, "Medtrack_Medications", id), data);
  }
  await batch.commit();
  console.log("✅ Medications seeded");
}

// ---- Dose Logs ----

async function seedDoseLogs(patientId: string) {
  const today = getTodayDate();

  const doseLogs = [
    { id: "dose_001", medicationId: "med_001", scheduledTime: "08:00", notes: null },
    { id: "dose_002", medicationId: "med_002", scheduledTime: "08:00", notes: null },
    { id: "dose_003", medicationId: "med_003", scheduledTime: "08:00", notes: "Take with breakfast" },
    { id: "dose_004", medicationId: "med_004", scheduledTime: "09:00", notes: null },
    { id: "dose_005", medicationId: "med_003", scheduledTime: "13:00", notes: "Take with lunch" },
    { id: "dose_006", medicationId: "med_003", scheduledTime: "19:00", notes: "Take with dinner" },
    { id: "dose_007", medicationId: "med_002", scheduledTime: "20:00", notes: null },
    { id: "dose_008", medicationId: "med_001", scheduledTime: "21:00", notes: "Bedtime dose" },
  ];

  const batch = writeBatch(db);
  for (const dose of doseLogs) {
    const { id, ...rest } = dose;
    batch.set(doc(db, "Medtrack_Doselogs", id), {
      ...rest,
      patientId,
      scheduledDate: today,
      taken: false,
      takenAt: null,
      administeredBy: null,
    });
  }
  await batch.commit();
  console.log("✅ Dose logs seeded");
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  btn: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  txt: { color: "#fff", fontWeight: "700", fontSize: 16 },
});