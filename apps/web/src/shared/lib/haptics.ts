import { hapticFeedback } from "@tma.js/sdk-react";
import { getTelegramWebApp } from "@/shared/lib/telegram";

export function triggerTapHaptic() {
  try {
    if (hapticFeedback.isSupported()) {
      hapticFeedback.impactOccurred("light");
      return;
    }
  } catch {
    // Keep optional haptics from ever interrupting an interaction.
  }

  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred?.("light");
  } catch {
    // Older Telegram clients may not expose haptic feedback.
  }
}
