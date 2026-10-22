import { useEffect } from "react";
import { router } from "@/app/router";

export function ScrollToTop() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    let currentLocationKey = router.state.location.key;
    const unsubscribe = router.subscribe((state) => {
      if (state.location.key === currentLocationKey) return;
      currentLocationKey = state.location.key;

      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    });

    return () => {
      unsubscribe();
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return null;
}
