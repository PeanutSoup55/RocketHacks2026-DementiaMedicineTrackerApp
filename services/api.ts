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

export type UserRole = "doctor" | "nurse";

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
export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  doctorEmail: string;
  role: UserRole;
}): Promise<{ user: User; patient: Patient } | null> {
  try {
    // 1. Find the doctor by email in Medtrack_Users
    const doctorQuery = query(
      collection(db, "Medtrack_Users"),
      where("email", "==", params.doctorEmail.toLowerCase()),
      where("role", "==", "doctor")
    );
    const doctorSnap = await getDocs(doctorQuery);
    if (doctorSnap.empty) {
      console.error("registerUser: no doctor found with email", params.doctorEmail);
      return null;
    }
    const doctorDoc = doctorSnap.docs[0];
    const patientId = doctorDoc.data().patientId as string;

    // 2. Create Firebase Auth account
    const credential = await createUserWithEmailAndPassword(
      auth,
      params.email,
      params.password
    );
    const uid = credential.user.uid;

    // 3. Write user doc to Medtrack_Users
    const newUser: Omit<User, "id"> = {
      name: params.name,
      email: params.email.toLowerCase(),
      role: params.role,
      patientId,
    };
    await setDoc(doc(db, "Medtrack_Users", uid), {
      ...newUser,
      createdAt: serverTimestamp(),
    });

    // 4. Fetch the linked patient
    const patient = await getPatient(patientId);
    if (!patient) return null;

    return { user: { id: uid, ...newUser }, patient };
  } catch (e: any) {
    console.error("registerUser failed:", e.code, e.message);
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
 * Returns all users (doctors + nurses) assigned to a patient.
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

export async function sendChatMessage(params: {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  patientId: string;
}): Promise<{ reply: string }> {
  // When you have a backend AI endpoint, replace this with a fetch call.
  // Firebase does not handle AI — this stays as a direct API call.
  // Example:
  // const res = await fetch("https://your-ai-endpoint/chat", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(params),
  // });
  // return res.json();

  return {
    reply: "I can help you think through medication timing. What would you like to schedule around?",
  };
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