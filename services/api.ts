// ============================================================
// MEDTRACK API SERVICE LAYER — Firebase Edition
// Auth:      Firebase Authentication (email/password)
// Database:  Firestore
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

// ---- Types ----

export type UserRole = "doctor" | "patient";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
  email?: string;
  specialty?: string;
  patientId: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  roomNumber: string;
  profilePhoto: string | null;
  conditions: string[];
  allergies: string[];
  emergencyContact: { name: string; phone: string };
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  brandName: string;
  dosage: string;
  form: string;
  color: string;
  colorName: string;
  treatsCondition: string;
  sideEffects: string[];
  instructions: string;
  prescribedBy: string;
  active: boolean;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledTime: string;
  scheduledDate: string;
  taken: boolean;
  takenAt: string | null;
  administeredBy: string | null;
  notes: string | null;
}

export interface DoseLogWithMed extends DoseLog {
  medication: Medication;
}

// ============================================================
// AUTH  →  Firebase Authentication + Medtrack_Users collection
// ============================================================

/**
 * Login with Firebase Auth, then fetch the user doc from Firestore.
 * The user doc in Medtrack_Users contains the patientId link.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; patient: Patient } | null> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Fetch user record from Medtrack_Users
    const userSnap = await getDoc(doc(db, "Medtrack_Users", uid));
    if (!userSnap.exists()) {
      console.error("loginUser: no user doc found for uid", uid);
      return null;
    }
    const userData = { id: uid, ...userSnap.data() } as User;

    // Fetch linked patient
    const patient = await getPatient(userData.patientId);
    if (!patient) {
      console.error("loginUser: no patient found for patientId", userData.patientId);
      return null;
    }

    return { user: userData, patient };
  } catch (e: any) {
    console.error("loginUser failed:", e.code, e.message);
    return null;
  }
}

/**
 * Register with Firebase Auth, create a doc in Medtrack_Users,
 * then look up the doctor by email to find the patientId.
 */
/**
 * Register a PATIENT — creates their own Auth account and a
 * Medtrack_Users doc linked to their existing Medtrack_Patients record.
 * The patient must already exist in Medtrack_Patients (created by doctor).
 * They identify themselves by the patientId the doctor gives them.
 */
export async function registerPatient(params: {
  name: string;
  email: string;
  password: string;
  patientId: string;  // given to them by their doctor
}): Promise<{ user: User; patient: Patient } | null> {
  try {
    // 1. Verify the patient record exists
    const patient = await getPatient(params.patientId);
    if (!patient) {
      console.error("registerPatient: no patient found with id", params.patientId);
      return null;
    }

    // 2. Create Firebase Auth account
    const credential = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const uid = credential.user.uid;

    // 3. Write Medtrack_Users doc with role: patient
    const newUser: Omit<User, "id"> = {
      name: params.name,
      email: params.email.toLowerCase(),
      role: "patient",
      patientId: params.patientId,
    };
    await setDoc(doc(db, "Medtrack_Users", uid), { ...newUser, createdAt: serverTimestamp() });

    return { user: { id: uid, ...newUser }, patient };
  } catch (e: any) {
    console.error("registerPatient failed:", e.code, e.message);
    return null;
  }
}

/**
 * Sign out of Firebase Auth.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("logoutUser failed:", e);
  }
}

// ============================================================
// PATIENTS  →  Medtrack_Patients collection
// ============================================================

export async function getPatient(patientId: string): Promise<Patient | null> {
  try {
    const snap = await getDoc(doc(db, "Medtrack_Patients", patientId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Patient;
  } catch (e) {
    console.error("getPatient failed:", e);
    return null;
  }
}

// ============================================================
// CARE TEAM  →  Medtrack_Users collection
// ============================================================

export async function getCareTeamMember(userId: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, "Medtrack_Users", userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as User;
  } catch (e) {
    console.error("getCareTeamMember failed:", e);
    return null;
  }
}

/**
 * Returns all users (doctors) assigned to a patient.
 * Queries Medtrack_Users where patientId == patientId.
 */
export async function getCareTeam(patientId: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, "Medtrack_Users"),
      where("patientId", "==", patientId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
  } catch (e) {
    console.error("getCareTeam failed:", e);
    return [];
  }
}

// ============================================================
// MEDICATIONS  →  Medtrack_Medications collection
// ============================================================

export async function getPatientMedications(patientId: string): Promise<Medication[]> {
  try {
    const q = query(
      collection(db, "Medtrack_Medications"),
      where("patientId", "==", patientId),
      where("active", "==", true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Medication));
  } catch (e) {
    console.error("getPatientMedications failed:", e);
    return [];
  }
}

export async function getMedicationById(medicationId: string): Promise<Medication | null> {
  try {
    const snap = await getDoc(doc(db, "Medtrack_Medications", medicationId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Medication;
  } catch (e) {
    console.error("getMedicationById failed:", e);
    return null;
  }
}

// ============================================================
// DOSE LOGS  →  Medtrack_Doselogs collection
// ============================================================

/**
 * Returns all dose logs for a patient on a given date,
 * joined with their medication data.
 */
export async function getDoseLogsForDate(
  patientId: string,
  date: string
): Promise<DoseLogWithMed[]> {
  try {
    const q = query(
      collection(db, "Medtrack_Doselogs"),
      where("patientId", "==", patientId),
      where("scheduledDate", "==", date)
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DoseLog));

    // Join with medication data
    const withMeds = await Promise.all(
      logs.map(async (log) => {
        const med = await getMedicationById(log.medicationId);
        return { ...log, medication: med! };
      })
    );
    return withMeds.filter((l) => l.medication != null);
  } catch (e) {
    console.error("getDoseLogsForDate failed:", e);
    return [];
  }
}

/**
 * Returns upcoming doses using the display rule:
 * - If MORE than 3 doses in the next windowHours → return ALL of them
 * - If 3 or fewer in window → return the next 3 doses
 */
export async function getUpcomingDoses(
  patientId: string,
  windowHours = 12
): Promise<DoseLogWithMed[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const allToday = await getDoseLogsForDate(patientId, today);

    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const windowEndMins = nowMins + windowHours * 60;

    const pending = allToday
      .filter((d) => !d.taken)
      .map((d) => {
        const [h, m] = d.scheduledTime.split(":").map(Number);
        return { dose: d, mins: h * 60 + m };
      })
      .sort((a, b) => a.mins - b.mins);

    const future = pending.filter((x) => x.mins >= nowMins);
    const inWindow = future.filter((x) => x.mins <= windowEndMins);
    const toShow = inWindow.length > 3 ? inWindow : future.slice(0, 3);

    return toShow.map((x) => x.dose);
  } catch (e) {
    console.error("getUpcomingDoses failed:", e);
    return [];
  }
}

/**
 * Marks a dose as taken — updates the Medtrack_Doselogs document.
 */
export async function markDoseTaken(
  doseLogId: string,
  administeredBy: string
): Promise<DoseLog | null> {
  try {
    const now = new Date();
    const takenAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const ref = doc(db, "Medtrack_Doselogs", doseLogId);
    await updateDoc(ref, { taken: true, takenAt, administeredBy });
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() } as DoseLog;
  } catch (e) {
    console.error("markDoseTaken failed:", e);
    return null;
  }
}

/**
 * Reverts an accidental taken mark.
 */
export async function undoMarkDoseTaken(doseLogId: string): Promise<DoseLog | null> {
  try {
    const ref = doc(db, "Medtrack_Doselogs", doseLogId);
    await updateDoc(ref, { taken: false, takenAt: null, administeredBy: null });
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() } as DoseLog;
  } catch (e) {
    console.error("undoMarkDoseTaken failed:", e);
    return null;
  }
}

// ============================================================
// AI CHATBOT  →  still hits your backend endpoint if you add one
//               for now returns a helpful scheduling message
// ============================================================
// AI CHATBOT  →  Claude claude-haiku-4-5-20251001
// ============================================================

// Store your key in a .env file as EXPO_PUBLIC_ANTHROPIC_KEY
// For now paste your new key here after rotating it:
const ANTHROPIC_KEY = "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";

const SYSTEM_PROMPT = `You are MedTrack Scheduling Assistant, a helpful tool for caregivers and patients at a nursing home.

Your ONLY role is to help with MEDICATION SCHEDULING — timing medications around meals, physical therapy, appointments, sleep, and other daily activities.

STRICT RULES:
- You NEVER give medical advice, diagnoses, or treatment recommendations
- You NEVER suggest changing dosages or medications
- You NEVER comment on whether a medication is appropriate
- If asked for medical advice, firmly but kindly redirect: "I can only help with scheduling. Please contact your doctor for medical questions."
- Keep responses concise and clear — many users are elderly or caregivers

You have access to the patient's current medication schedule which will be provided in the first message.`;

export async function sendChatMessage(params: {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  patientId: string;
}): Promise<{ reply: string }> {
  try {
    // Fetch patient + full medication schedule fresh every message
    const today = new Date().toISOString().split("T")[0];
    const [patient, doses, medications] = await Promise.all([
      getPatient(params.patientId),
      getDoseLogsForDate(params.patientId, today),
      getPatientMedications(params.patientId),
    ]);

    // Build schedule summary
    const scheduleLines = doses.length === 0
      ? "No medications scheduled today."
      : doses
          .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
          .map((d) => {
            const [h, m] = d.scheduledTime.split(":").map(Number);
            const ampm = h >= 12 ? "PM" : "AM";
            const hour = h % 12 === 0 ? 12 : h % 12;
            const time = `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
            const status = d.taken ? "already taken" : "pending";
            return `  ${time} — ${d.medication.name} ${d.medication.dosage} (${status})${d.notes ? `, note: ${d.notes}` : ""}`;
          })
          .join("\n");

    // Build full medication list with details
    const medLines = medications.length === 0
      ? "No active medications."
      : medications.map((m) =>
          `  - ${m.name} (${m.brandName}) ${m.dosage} ${m.form} — treats: ${m.treatsCondition} — instructions: ${m.instructions}`
        ).join("\n");

    // Inject patient context into the system prompt on every request
    const systemWithContext = `${SYSTEM_PROMPT}

--- PATIENT CONTEXT (do not repeat this back to the user) ---
Patient name: ${patient?.name ?? "Unknown"}
Room: ${patient?.roomNumber ?? "Unknown"}
Conditions: ${patient?.conditions?.join(", ") ?? "Unknown"}
Allergies: ${patient?.allergies?.join(", ") ?? "None"}

TODAY'S DOSE SCHEDULE (${today}):
${scheduleLines}

ALL ACTIVE MEDICATIONS:
${medLines}
--- END PATIENT CONTEXT ---`;

    // Build message array — history first, then new message
    const apiMessages = [
      ...params.conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: params.message },
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-calls": "true",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system:     systemWithContext,
        messages:   apiMessages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Claude API error:", res.status, err);
      return { reply: "I\'m having trouble connecting right now. Please try again in a moment." };
    }

    const data = await res.json();
    const reply = data?.content?.[0]?.text ?? "I didn\'t get a response. Please try again.";
    return { reply };
  } catch (e) {
    console.error("sendChatMessage failed:", e);
    return { reply: "I\'m having trouble connecting right now. Please try again in a moment." };
  }
}

// ============================================================
// EMERGENCY  →  writes an alert doc to Firestore + notifies care team
// ============================================================

export async function triggerPanicAlert(
  patientId: string,
  triggeredBy: string
): Promise<{ alertId: string; sentTo: string[] }> {
  try {
    // Write alert to Firestore for logging
    const alertRef = doc(collection(db, "Medtrack_Alerts"));
    await setDoc(alertRef, {
      patientId,
      triggeredBy,
      timestamp: serverTimestamp(),
      resolved: false,
    });

    // Fetch care team to return who was notified
    const careTeam = await getCareTeam(patientId);
    const sentTo = careTeam.map((m) => `${m.name}${m.phone ? ` — ${m.phone}` : ""}`);

    return { alertId: alertRef.id, sentTo };
  } catch (e) {
    console.error("triggerPanicAlert failed:", e);
    return { alertId: `alert_${Date.now()}`, sentTo: [] };
  }
}

// ============================================================
// DOCTOR — Patient management
// ============================================================

/**
 * GET all patients assigned to a doctor
 * Queries Medtrack_Patients where doctorId == doctorUid
 */
export async function getDoctorPatients(doctorUid: string): Promise<Patient[]> {
  try {
    const q = query(
      collection(db, "Medtrack_Patients"),
      where("doctorId", "==", doctorUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Patient));
  } catch (e) {
    console.error("getDoctorPatients failed:", e);
    return [];
  }
}

/**
 * POST — Create a new patient and assign to doctor
 */
export async function createPatient(params: {
  name: string;
  dateOfBirth: string;
  roomNumber: string;
  conditions: string[];
  allergies: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  doctorUid: string;
}): Promise<Patient | null> {
  try {
    const ref = doc(collection(db, "Medtrack_Patients"));
    const newPatient = {
      name: params.name,
      dateOfBirth: params.dateOfBirth,
      roomNumber: params.roomNumber,
      profilePhoto: null,
      conditions: params.conditions,
      allergies: params.allergies,
      emergencyContact: {
        name: params.emergencyContactName,
        phone: params.emergencyContactPhone,
      },
      doctorId: params.doctorUid,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newPatient);
    return { id: ref.id, ...newPatient } as unknown as Patient;
  } catch (e) {
    console.error("createPatient failed:", e);
    return null;
  }
}

// ============================================================
// DOCTOR — Medication management
// ============================================================

/**
 * POST — Create a new medication and prescribe to patient
 */
export async function createMedication(params: {
  patientId: string;
  name: string;
  brandName: string;
  dosage: string;
  form: string;
  color: string;
  colorName: string;
  treatsCondition: string;
  sideEffects: string[];
  instructions: string;
  prescribedBy: string;
}): Promise<Medication | null> {
  try {
    const ref = doc(collection(db, "Medtrack_Medications"));
    const newMed = { ...params, active: true, createdAt: serverTimestamp() };
    await setDoc(ref, newMed);
    return { id: ref.id, ...newMed } as unknown as Medication;
  } catch (e) {
    console.error("createMedication failed:", e);
    return null;
  }
}

/**
 * PATCH — Update an existing medication
 */
export async function updateMedication(
  medicationId: string,
  updates: Partial<Omit<Medication, "id">>
): Promise<Medication | null> {
  try {
    const ref = doc(db, "Medtrack_Medications", medicationId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() } as Medication;
  } catch (e) {
    console.error("updateMedication failed:", e);
    return null;
  }
}

/**
 * PATCH — Deactivate (soft delete) a medication
 */
export async function deactivateMedication(medicationId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, "Medtrack_Medications", medicationId), {
      active: false,
      deactivatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error("deactivateMedication failed:", e);
    return false;
  }
}

// ============================================================
// DOCTOR — Dose schedule management
// ============================================================

/**
 * POST — Create a dose log entry (schedule a dose)
 */
export async function createDoseLog(params: {
  patientId: string;
  medicationId: string;
  scheduledTime: string;
  scheduledDate: string;
  notes?: string;
}): Promise<DoseLog | null> {
  try {
    const ref = doc(collection(db, "Medtrack_Doselogs"));
    const newDose = {
      patientId: params.patientId,
      medicationId: params.medicationId,
      scheduledTime: params.scheduledTime,
      scheduledDate: params.scheduledDate,
      notes: params.notes ?? null,
      taken: false,
      takenAt: null,
      administeredBy: null,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newDose);
    return { id: ref.id, ...newDose } as unknown as DoseLog;
  } catch (e) {
    console.error("createDoseLog failed:", e);
    return null;
  }
}

/**
 * DELETE — Remove a scheduled dose
 */
export async function deleteDoseLog(doseLogId: string): Promise<boolean> {
  try {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "Medtrack_Doselogs", doseLogId));
    return true;
  } catch (e) {
    console.error("deleteDoseLog failed:", e);
    return false;
  }
}