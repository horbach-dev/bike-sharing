import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { TelegramProvider } from "@/app/providers/telegram-provider";
import { HapticFeedbackProvider } from "@/app/providers/haptic-feedback-provider";
import { ScrollToTop } from "@/app/providers/scroll-to-top";
import { BackSwipeNavigation } from "@/app/providers/back-swipe-navigation";
import { QueryProvider } from "@/app/providers/query-provider";

export function App() {
  return (
    <QueryProvider>
      <TelegramProvider>
        <HapticFeedbackProvider>
          <Suspense fallback={<div role="status">Scoot Nha Trang</div>}>
            <RouterProvider router={router} />
          </Suspense>
          <ScrollToTop />
          <BackSwipeNavigation />
        </HapticFeedbackProvider>
      </TelegramProvider>
    </QueryProvider>
  );
}
