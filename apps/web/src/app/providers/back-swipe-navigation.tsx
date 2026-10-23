import { useEffect } from "react";
import { backButton } from "@tma.js/sdk-react";
import { router } from "@/app/router";
import { isTelegramMiniApp } from "@/shared/lib/telegram";
import { navigateBackWithinApp } from "@/shared/lib/navigation";

const EDGE_START_PX = 28;
const BACK_SWIPE_PX = 76;
const VERTICAL_CANCEL_PX = 32;

type SwipeStart = {
  x: number;
  y: number;
  cancelled: boolean;
};

function isExcludedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  if (target.closest(
    "input, textarea, select, [contenteditable='true'], [data-no-back-swipe], " +
      ".leaflet-container, .map-frame, .place-map-pick",
  )) {
    return true;
  }

  let element: Element | null = target;
  while (element) {
    const style = window.getComputedStyle(element);
    const overflowX = style.overflowX;
    if (
      (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") &&
      element.scrollWidth > element.clientWidth + 1
    ) {
      return true;
    }
    element = element.parentElement;
  }

  return false;
}

export function BackSwipeNavigation() {
  useEffect(() => {
    let swipeStart: SwipeStart | null = null;
    let unbindTelegramBackButton: VoidFunction | undefined;
    let unsubscribeRouter: VoidFunction | undefined;
    let telegramBackButtonMounted = false;

    const navigateBack = () => navigateBackWithinApp(router.navigate, router.state.location.pathname);
    const syncTelegramBackButton = (pathname: string) => {
      if (!telegramBackButtonMounted) return;
      if (pathname === "/") backButton.hide.ifAvailable();
      else backButton.show.ifAvailable();
    };

    if (isTelegramMiniApp()) {
      try {
        if (backButton.isSupported()) {
          backButton.mount();
          telegramBackButtonMounted = true;
          unbindTelegramBackButton = backButton.onClick(navigateBack);
          syncTelegramBackButton(router.state.location.pathname);
          unsubscribeRouter = router.subscribe((state) => syncTelegramBackButton(state.location.pathname));
        }
      } catch {
        // Telegram clients without native BackButton support keep swipe navigation.
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isExcludedTarget(event.target)) {
        swipeStart = null;
        return;
      }

      const touch = event.touches[0];
      swipeStart = touch.clientX <= EDGE_START_PX
        ? { x: touch.clientX, y: touch.clientY, cancelled: false }
        : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!swipeStart || event.touches.length !== 1) {
        swipeStart = null;
        return;
      }

      const touch = event.touches[0];
      const dx = touch.clientX - swipeStart.x;
      const dy = touch.clientY - swipeStart.y;
      if (Math.abs(dy) > VERTICAL_CANCEL_PX || dx < -8) {
        swipeStart.cancelled = true;
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!swipeStart || swipeStart.cancelled) {
        swipeStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      const dx = touch.clientX - swipeStart.x;
      const dy = touch.clientY - swipeStart.y;
      swipeStart = null;

      if (dx < BACK_SWIPE_PX || Math.abs(dy) > VERTICAL_CANCEL_PX || dx < Math.abs(dy) * 1.2) {
        return;
      }

      navigateBack();
    };

    const onTouchCancel = () => {
      swipeStart = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      unsubscribeRouter?.();
      unbindTelegramBackButton?.();
      if (telegramBackButtonMounted) {
        backButton.hide.ifAvailable();
        backButton.unmount();
      }
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  return null;
}
