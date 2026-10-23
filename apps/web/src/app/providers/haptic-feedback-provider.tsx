import { useEffect, type PropsWithChildren } from "react";
import { triggerTapHaptic } from "@/shared/lib/haptics";

const interactiveSelector = [
  "button:not(:disabled)",
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  'input[type="checkbox"]:not(:disabled)',
  'input[type="radio"]:not(:disabled)',
  "summary",
].join(",");

export function HapticFeedbackProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest(interactiveSelector);
      if (!control || control.getAttribute("aria-disabled") === "true" || control.hasAttribute("data-no-haptic")) return;
      triggerTapHaptic();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return children;
}
