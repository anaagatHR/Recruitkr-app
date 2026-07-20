import { Alert } from "react-native";
import { isWeb } from "./webAnim";

/**
 * react-native-web ships Alert as a no-op:
 *
 *     class Alert { static alert() {} }
 *
 * So on web every `Alert.alert(...)` in the app silently does nothing — no
 * dialog, no callback, no error. That breaks any flow whose action lives in a
 * button handler (logout, delete job) and hides every success/error message.
 *
 * Rather than rewrite 40+ call sites, we install a browser-backed implementation
 * onto the same Alert object once at startup. Native is untouched — React
 * Native's own Alert is already correct there.
 *
 * Supported shape (what this app actually uses):
 *   Alert.alert(title)
 *   Alert.alert(title, message)
 *   Alert.alert(title, message, [{ text, style, onPress }, ...])
 */
export function installWebAlert() {
  if (!isWeb || typeof window === "undefined") return;

  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join("\n\n");

    // No buttons (or a single acknowledge button) → plain notice.
    if (!Array.isArray(buttons) || buttons.length === 0) {
      window.alert(text);
      return;
    }

    // The button the user is agreeing to: the first one that isn't Cancel.
    const confirmBtn = buttons.find((b) => b?.style !== "cancel") || buttons[0];
    const cancelBtn = buttons.find((b) => b?.style === "cancel");

    if (buttons.length === 1) {
      window.alert(text);
      confirmBtn?.onPress?.();
      return;
    }

    // window.confirm gives us OK/Cancel, which maps onto the confirm/cancel
    // pair every multi-button Alert in this app uses.
    const label = confirmBtn?.text ? `\n\n[OK = ${confirmBtn.text}]` : "";
    if (window.confirm(text + label)) confirmBtn?.onPress?.();
    else cancelBtn?.onPress?.();
  };
}
