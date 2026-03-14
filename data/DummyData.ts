// ============================================================
// MEDTRACK DUMMY DATA — swap out with real API calls when backend is live
// ============================================================

export const DUMMY_PATIENT = {
  id: "pat_001",
  name: "Dorothy Mae Williams",
  dateOfBirth: "1942-03-18",
  roomNumber: "204B",
  profilePhoto: null,
  conditions: ["Alzheimer's Disease (Moderate)", "Hypertension", "Type 2 Diabetes"],
  allergies: ["Penicillin", "Sulfa drugs"],
  emergencyContact: {
    name: "Robert Williams (Son)",
    phone: "+1 (419) 555-0182",
  },
};

export const DUMMY_DOCTOR = {
  id: "usr_001",
  name: "Dr. Margaret Chen, MD",
  specialty: "Geriatric Medicine",
  phone: "+1 (419) 555-0199",
  email: "m.chen@toledocare.org",
  photo: null,
};

export const DUMMY_NURSE = {
  id: "usr_002",
  name: "Nurse Patricia Okafor, RN",
  phone: "+1 (419) 555-0211",
  email: "p.okafor@toledocare.org",
};

// Medtrack_Medications rows
export const DUMMY_MEDICATIONS = [
  {
    id: "med_001",
    patientId: "pat_001",
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
    prescribedBy: "usr_001",
    active: true,
  },
  {
    id: "med_002",
    patientId: "pat_001",
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
    prescribedBy: "usr_001",
    active: true,
  },
  {
    id: "med_003",
    patientId: "pat_001",
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
    prescribedBy: "usr_001",
    active: true,
  },
  {
    id: "med_004",
    patientId: "pat_001",
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
    prescribedBy: "usr_001",
    active: true,
  },
];

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Medtrack_Doselogs rows — mutable so markDoseTaken can update in-memory
export const DUMMY_DOSE_SCHEDULE = [
  {
    id: "dose_001",
    medicationId: "med_001",
    patientId: "pat_001",
    scheduledTime: "08:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: null as string | null,
  },
  {
    id: "dose_002",
    medicationId: "med_002",
    patientId: "pat_001",
    scheduledTime: "08:00",
    scheduledDate: getTodayDate(),
    taken: true,
    takenAt: "08:04",
    administeredBy: "usr_002",
    notes: null as string | null,
  },
  {
    id: "dose_003",
    medicationId: "med_003",
    patientId: "pat_001",
    scheduledTime: "08:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: "Take with breakfast",
  },
  {
    id: "dose_004",
    medicationId: "med_003",
    patientId: "pat_001",
    scheduledTime: "13:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: "Take with lunch",
  },
  {
    id: "dose_005",
    medicationId: "med_004",
    patientId: "pat_001",
    scheduledTime: "09:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: null as string | null,
  },
  {
    id: "dose_006",
    medicationId: "med_002",
    patientId: "pat_001",
    scheduledTime: "20:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: null as string | null,
  },
  {
    id: "dose_007",
    medicationId: "med_001",
    patientId: "pat_001",
    scheduledTime: "21:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: "Bedtime dose",
  },
  {
    id: "dose_008",
    medicationId: "med_003",
    patientId: "pat_001",
    scheduledTime: "19:00",
    scheduledDate: getTodayDate(),
    taken: false,
    takenAt: null as string | null,
    administeredBy: null as string | null,
    notes: "Take with dinner",
  },
];

export const DUMMY_LOGGED_IN_USER = {
  id: "usr_002",
  role: "nurse" as "nurse" | "doctor",
  name: "Patricia Okafor",
  patientId: "pat_001",
  phone: "+1 (419) 555-0211",
  email: "p.okafor@toledocare.org",
};