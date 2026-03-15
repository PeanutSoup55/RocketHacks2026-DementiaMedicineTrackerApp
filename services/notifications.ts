// ============================================================
// MEDTRACK NOTIFICATION SERVICE
// Schedules local push notifications 30 minutes before each dose.
// Called on app open (HomeScreen) and when doctor creates a new dose.
// ============================================================

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { DoseLogWithMed } from "./api";

// How many minutes before the dose to notify
const NOTIFY_BEFORE_MINUTES = 30;

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
});

// ============================================================
// PERMISSIONS
// ============================================================

/**
 * Request notification permissions.
 * Returns true if granted, false if denied.
 * Must be called before scheduling any notifications.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Simulator/emulator — notifications don't work, skip silently
    console.log("Notifications: skipping on simulator");
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.log("Notifications: permission denied");
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medications", {
      name:             "Medication Reminders",
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       "#1A5276",
      sound:            "default",
    });
  }

  return true;
}

// ============================================================
// SCHEDULE
// ============================================================

/**
 * Schedules a single notification 30 minutes before a dose.
 * Uses the doseLogId as the notification identifier so we can
 * cancel it later if needed.
 *
 * Skips if:
 * - The dose is already taken
 * - The notification time is in the past
 * - The scheduledDate is not today
 */
export async function scheduleDoseNotification(dose: DoseLogWithMed): Promise<string | null> {
  // Don't notify for taken doses
  if (dose.taken) return null;

  // Only schedule for today
  const today = new Date().toISOString().split("T")[0];
  if (dose.scheduledDate !== today) return null;

  // Build the trigger time = scheduledTime minus 30 minutes
  const [h, m] = dose.scheduledTime.split(":").map(Number);
  const triggerDate = new Date();
  triggerDate.setHours(h, m - NOTIFY_BEFORE_MINUTES, 0, 0);

  // If the trigger time is already in the past, skip
  if (triggerDate <= new Date()) return null;

  try {
    // Cancel any existing notification for this dose first (avoid duplicates)
    await cancelDoseNotification(dose.id);

    const notifId = await Notifications.scheduleNotificationAsync({
      identifier: dose.id, // use doseLogId so we can cancel by dose
      content: {
        title: "💊 Medication Due Soon",
        body:  `${dose.medication.name} ${dose.medication.dosage} is due in 30 minutes (${formatTime(dose.scheduledTime)})`,
        data:  { doseLogId: dose.id, patientId: dose.patientId },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`Notification scheduled for ${dose.medication.name} at ${formatTime(dose.scheduledTime)} (notif fires at ${triggerDate.toLocaleTimeString()})`);
    return notifId;
  } catch (e) {
    console.error("scheduleDoseNotification failed:", e);
    return null;
  }
}

/**
 * Schedules notifications for ALL untaken doses in a list.
 * Call this on app open with today's full dose list.
 */
export async function scheduleAllDoseNotifications(doses: DoseLogWithMed[]): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const pending = doses.filter((d) => !d.taken);
  console.log(`Scheduling notifications for ${pending.length} untaken doses`);

  await Promise.all(pending.map((dose) => scheduleDoseNotification(dose)));
}

/**
 * Cancels the notification for a specific dose.
 * Call this when a dose is marked as taken.
 */
export async function cancelDoseNotification(doseLogId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(doseLogId);
  } catch {
    // Silently ignore if notification doesn't exist
  }
}

/**
 * Cancels ALL scheduled medication notifications.
 * Call this on logout.
 */
export async function cancelAllDoseNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications cancelled");
  } catch (e) {
    console.error("cancelAllDoseNotifications failed:", e);
  }
}

// ---- helper ----
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}