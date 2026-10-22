import { useEffect } from "react";
import { router } from "@/app/router";

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

      if (typeof window.history.state?.idx === "number" && window.history.state.idx > 0) {
        void router.navigate(-1);
      } else if (router.state.location.pathname !== "/") {
        void router.navigate("/");
      }
    };

    const onTouchCancel = () => {
      swipeStart = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  return null;
}
