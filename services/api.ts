// ============================================================
// MEDTRACK API SERVICE LAYER
// Wired to AWS API Gateway → Lambda
// ============================================================

import {
  DUMMY_PATIENT,
  DUMMY_DOCTOR,
  DUMMY_NURSE,
  DUMMY_MEDICATIONS,
  DUMMY_DOSE_SCHEDULE,
  DUMMY_LOGGED_IN_USER,
} from "../data/DummyData";

const API_BASE = "https://blhqdgjflc.execute-api.us-east-1.amazonaws.com/default/medtrack-api";

// Set this to your AWS endpoint when the backend is ready
// const API_BASE = "https://your-api.execute-api.us-east-1.amazonaws.com/prod";

// ---- Types ----
const headers = {
  "Content-Type": "application/json",
};
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
// AUTH
// ============================================================

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; patient: Patient } | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("loginUser failed:", e);
    return null;
  }
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  doctorEmail: string;
  role: UserRole;
}): Promise<{ user: User; patient: Patient } | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("registerUser failed:", e);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers });
  } catch (e) {
    console.error("logoutUser failed:", e);
  }
}

// ============================================================
// PATIENTS
// ============================================================

export async function getPatient(patientId: string): Promise<Patient | null> {
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("getPatient failed:", e);
    return null;
  }
}

// ============================================================
// CARE TEAM
// ============================================================

export async function getCareTeamMember(userId: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("getCareTeamMember failed:", e);
    return null;
  }
}

export async function getCareTeam(patientId: string): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/care-team`, { headers });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("getCareTeam failed:", e);
    return [];
  }
}

// ============================================================
// MEDICATIONS
// ============================================================

export async function getPatientMedications(patientId: string): Promise<Medication[]> {
  try {
    const res = await fetch(`${API_BASE}/patients/${patientId}/medications`, { headers });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("getPatientMedications failed:", e);
    return [];
  }
}

export async function getMedicationById(medicationId: string): Promise<Medication | null> {
  try {
    const res = await fetch(`${API_BASE}/medications/${medicationId}`, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("getMedicationById failed:", e);
    return null;
  }
}

// ============================================================
// DOSE LOGS
// ============================================================

export async function getDoseLogsForDate(
  patientId: string,
  date: string
): Promise<DoseLogWithMed[]> {
  try {
    const res = await fetch(
      `${API_BASE}/patients/${patientId}/doselogs?date=${date}`,
      { headers }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("getDoseLogsForDate failed:", e);
    return [];
  }
}

export async function getUpcomingDoses(
  patientId: string,
  windowHours = 12
): Promise<DoseLogWithMed[]> {
  try {
    const res = await fetch(
      `${API_BASE}/patients/${patientId}/doselogs/upcoming?windowHours=${windowHours}`,
      { headers }
    );
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("getUpcomingDoses failed:", e);
    return [];
  }
}

export async function markDoseTaken(
  doseLogId: string,
  administeredBy: string
): Promise<DoseLog | null> {
  try {
    const res = await fetch(`${API_BASE}/doselogs/${doseLogId}/taken`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ administeredBy, takenAt: new Date().toISOString() }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("markDoseTaken failed:", e);
    return null;
  }
}

export async function undoMarkDoseTaken(doseLogId: string): Promise<DoseLog | null> {
  try {
    const res = await fetch(`${API_BASE}/doselogs/${doseLogId}/undo`, {
      method: "PATCH",
      headers,
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.error("undoMarkDoseTaken failed:", e);
    return null;
  }
}

// ============================================================
// AI CHATBOT
// ============================================================

export async function sendChatMessage(params: {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  patientId: string;
}): Promise<{ reply: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Chat request failed");
    return res.json();
  } catch (e) {
    console.error("sendChatMessage failed:", e);
    return { reply: "I'm having trouble connecting right now. Please try again in a moment." };
  }
}

// ============================================================
// EMERGENCY
// ============================================================

export async function triggerPanicAlert(
  patientId: string,
  triggeredBy: string
): Promise<{ alertId: string; sentTo: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/emergency/alert`, {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId, triggeredBy, timestamp: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error("Alert failed");
    return res.json();
  } catch (e) {
    console.error("triggerPanicAlert failed:", e);
    return { alertId: `alert_${Date.now()}`, sentTo: [] };
  }
}
