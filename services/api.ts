// ============================================================
// MEDTRACK API SERVICE LAYER
// All functions mirror the AWS/Node.js backend contract.
// Each has a commented fetch() stub — uncomment and set API_BASE
// to go live. Dummy data is returned until then.
// ============================================================

import {
  DUMMY_PATIENT,
  DUMMY_DOCTOR,
  DUMMY_NURSE,
  DUMMY_MEDICATIONS,
  DUMMY_DOSE_SCHEDULE,
  DUMMY_LOGGED_IN_USER,
} from "../data/DummyData"

// Set this to your AWS endpoint when the backend is ready
const API_BASE = "https://blhqdgjflc.execute-api.us-east-1.amazonaws.com/default/medtrack-api";

// ---- Types matching your four DB tables ----

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

/** Medtrack_Medications row */
export interface Medication {
  id: string;
  patientId: string;
  name: string;
  brandName: string;
  dosage: string;
  form: string;
  color: string;      // hex
  colorName: string;  // human-readable e.g. "Blue"
  treatsCondition: string;
  sideEffects: string[];
  instructions: string;
  prescribedBy: string; // userId
  active: boolean;
}

/** Medtrack_Doselogs row */
export interface DoseLog {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledTime: string;  // "HH:mm"
  scheduledDate: string;  // "YYYY-MM-DD"
  taken: boolean;
  takenAt: string | null;
  administeredBy: string | null; // userId
  notes: string | null;
}

/** DoseLog joined with its Medication — used throughout the UI */
export interface DoseLogWithMed extends DoseLog {
  medication: Medication;
}

// ============================================================
// AUTH  (Medtrack_Users)
// ============================================================

/**
 * POST /auth/login
 * Returns authenticated user + their assigned patient record.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; patient: Patient } | null> {
  // const res = await fetch(`${API_BASE}/auth/login`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email, password }),
  // });
  // if (!res.ok) return null;
  // return res.json();
  await delay();
  return { user: DUMMY_LOGGED_IN_USER as User, patient: DUMMY_PATIENT };
}

/**
 * POST /auth/register
 * Creates a nurse/caregiver account linked to a doctor by doctorEmail.
 * Backend verifies the doctor exists and associates the correct patient.
 */
export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  doctorEmail: string;
  role: UserRole;
}): Promise<{ user: User; patient: Patient } | null> {
  // const res = await fetch(`${API_BASE}/auth/register`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(params),
  // });
  // if (!res.ok) return null;
  // return res.json();
  await delay();
  return { user: DUMMY_LOGGED_IN_USER as User, patient: DUMMY_PATIENT };
}

/**
 * POST /auth/logout
 * Invalidates the session token server-side.
 */
export async function logoutUser(): Promise<void> {
  // await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
  await delay(300);
}

// ============================================================
// PATIENTS  (Medtrack_Patients)
// ============================================================

/**
 * GET /patients/:patientId
 */
export async function getPatient(patientId: string): Promise<Patient | null> {
  // const res = await fetch(`${API_BASE}/patients/${patientId}`);
  // if (!res.ok) return null;
  // return res.json();
  await delay();
  return DUMMY_PATIENT;
}

// ============================================================
// USERS / CARE TEAM  (Medtrack_Users)
// ============================================================

/**
 * GET /users/:userId
 */
export async function getCareTeamMember(userId: string): Promise<User | null> {
  // const res = await fetch(`${API_BASE}/users/${userId}`);
  // if (!res.ok) return null;
  // return res.json();
  await delay();
  if (userId === "usr_001")
    return { ...DUMMY_DOCTOR, id: "usr_001", role: "doctor", patientId: "pat_001" };
  if (userId === "usr_002")
    return { ...DUMMY_NURSE, id: "usr_002", role: "nurse", patientId: "pat_001" };
  return null;
}

/**
 * GET /patients/:patientId/care-team
 * Returns all doctors and nurses assigned to a patient.
 */
export async function getCareTeam(patientId: string): Promise<User[]> {
  // const res = await fetch(`${API_BASE}/patients/${patientId}/care-team`);
  // return res.json();
  await delay();
  return [
    { ...DUMMY_DOCTOR, id: "usr_001", role: "doctor", patientId },
    { ...DUMMY_NURSE, id: "usr_002", role: "nurse", patientId },
  ];
}

// ============================================================
// MEDICATIONS  (Medtrack_Medications)
// ============================================================

/**
 * GET /patients/:patientId/medications
 * Returns all active medications for a patient.
 */
export async function getPatientMedications(patientId: string): Promise<Medication[]> {
  // const res = await fetch(`${API_BASE}/patients/${patientId}/medications`);
  // return res.json();
  await delay();
  return DUMMY_MEDICATIONS.filter((m) => m.patientId === patientId && m.active);
}

/**
 * GET /medications/:medicationId
 */
export async function getMedicationById(medicationId: string): Promise<Medication | null> {
  // const res = await fetch(`${API_BASE}/medications/${medicationId}`);
  // if (!res.ok) return null;
  // return res.json();
  await delay();
  return DUMMY_MEDICATIONS.find((m) => m.id === medicationId) ?? null;
}

// ============================================================
// DOSE LOGS  (Medtrack_Doselogs)
// ============================================================

/**
 * GET /patients/:patientId/doselogs?date=YYYY-MM-DD
 * Returns all dose logs for a patient on a given date, joined with medication data.
 */
export async function getDoseLogsForDate(
  patientId: string,
  date: string
): Promise<DoseLogWithMed[]> {
  // const res = await fetch(`${API_BASE}/patients/${patientId}/doselogs?date=${date}`);
  // return res.json();
  await delay();
  const logs = DUMMY_DOSE_SCHEDULE.filter(
    (d) => d.patientId === patientId && d.scheduledDate === date
  );
  return logs.map((log) => ({
    ...log,
    medication: DUMMY_MEDICATIONS.find((m) => m.id === log.medicationId)!,
  }));
}

/**
 * GET /patients/:patientId/doselogs/upcoming?windowHours=12
 *
 * Display logic:
 *   - If there are MORE than 3 doses in the next `windowHours`, return ALL of them.
 *   - If there are 3 or fewer in the window, return the next 3 doses (even past the window).
 */
export async function getUpcomingDoses(
  patientId: string,
  windowHours = 12
): Promise<DoseLogWithMed[]> {
  // const res = await fetch(`${API_BASE}/patients/${patientId}/doselogs/upcoming?windowHours=${windowHours}`);
  // return res.json();
  await delay();

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const windowEndMins = nowMins + windowHours * 60;
  const todayStr = now.toISOString().split("T")[0];

  const todayPending = DUMMY_DOSE_SCHEDULE.filter(
    (d) => d.patientId === patientId && d.scheduledDate === todayStr && !d.taken
  );

  const withMins = todayPending
    .map((log) => {
      const [h, m] = log.scheduledTime.split(":").map(Number);
      return { log, mins: h * 60 + m };
    })
    .sort((a, b) => a.mins - b.mins);

  const future = withMins.filter((x) => x.mins >= nowMins);
  const inWindow = future.filter((x) => x.mins <= windowEndMins);
  const toShow = inWindow.length > 3 ? inWindow : future.slice(0, 3);

  return toShow.map(({ log }) => ({
    ...log,
    medication: DUMMY_MEDICATIONS.find((m) => m.id === log.medicationId)!,
  }));
}

/**
 * PATCH /doselogs/:doseLogId/taken
 * Marks a dose as taken. Sets taken=true, takenAt, and administeredBy in Medtrack_Doselogs.
 */
export async function markDoseTaken(
  doseLogId: string,
  administeredBy: string
): Promise<DoseLog | null> {
  // const res = await fetch(`${API_BASE}/doselogs/${doseLogId}/taken`, {
  //   method: "PATCH",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ administeredBy, takenAt: new Date().toISOString() }),
  // });
  // if (!res.ok) return null;
  // return res.json();
  await delay(800);
  const log = DUMMY_DOSE_SCHEDULE.find((d) => d.id === doseLogId);
  if (!log) return null;
  const now = new Date();
  log.taken = true;
  log.takenAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  log.administeredBy = administeredBy;
  return { ...log };
}

/**
 * PATCH /doselogs/:doseLogId/undo
 * Reverts an accidental "taken" mark.
 */
export async function undoMarkDoseTaken(doseLogId: string): Promise<DoseLog | null> {
  // const res = await fetch(`${API_BASE}/doselogs/${doseLogId}/undo`, { method: "PATCH" });
  // if (!res.ok) return null;
  // return res.json();
  await delay(600);
  const log = DUMMY_DOSE_SCHEDULE.find((d) => d.id === doseLogId);
  if (!log) return null;
  log.taken = false;
  log.takenAt = null;
  log.administeredBy = null;
  return { ...log };
}

// ============================================================
// AI CHATBOT
// ============================================================

/**
 * POST /ai/chat
 * Sends a message to the scheduling assistant.
 * The Node.js backend enforces the no-medical-advice system prompt.
 * Frontend should never send or display medical recommendations.
 */
export async function sendChatMessage(params: {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  patientId: string;
}): Promise<{ reply: string }> {
  // const res = await fetch(`${API_BASE}/ai/chat`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(params),
  // });
  // return res.json();
  await delay(1200);
  return {
    reply:
      "I can help you think through medication timing. For example, if Dorothy has physical therapy at 10:00 AM, we could shift her 9:00 AM Memantine to 8:30 AM to avoid any drowsiness during the session. Would you like me to map out her full day schedule?",
  };
}

// ============================================================
// EMERGENCY
// ============================================================

/**
 * POST /emergency/alert
 * Triggers an immediate SMS + push notification to the full care team.
 * Backend logs the alert with timestamp and triggeredBy userId.
 */
export async function triggerPanicAlert(
  patientId: string,
  triggeredBy: string
): Promise<{ alertId: string; sentTo: string[] }> {
  // const res = await fetch(`${API_BASE}/emergency/alert`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ patientId, triggeredBy, timestamp: new Date().toISOString() }),
  // });
  // return res.json();
  await delay(500);
  return {
    alertId: `alert_${Date.now()}`,
    sentTo: [
      "Dr. Margaret Chen — +1 (419) 555-0199",
      "Nurse Patricia Okafor — +1 (419) 555-0211",
    ],
  };
}

// ---- internal ----
function delay(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
