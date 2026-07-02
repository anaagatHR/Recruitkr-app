import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let configured = false;

// Show notifications even when the app is in the foreground.
function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for notification permission (Android 13+ requires this). Safe to call often. */
export async function ensureNotifPermission() {
  try {
    configure();
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "RecruitKR",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      return req.status === "granted";
    }
    return true;
  } catch (e) {
    return false;
  }
}

/** Fire a local notification immediately. Fails silently if not permitted. */
export async function notifyLocal(title, body) {
  try {
    configure();
    const ok = await ensureNotifPermission();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // immediately
    });
  } catch (e) {
    // ignore — notifications are best-effort
  }
}
