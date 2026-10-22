import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { TelegramProvider } from "@/app/providers/telegram-provider";
import { ScrollToTop } from "@/app/providers/scroll-to-top";
import { QueryProvider } from "@/app/providers/query-provider";

export function App() {
  return (
    <QueryProvider>
      <TelegramProvider>
        <RouterProvider router={router} />
        <ScrollToTop />
      </TelegramProvider>
    </QueryProvider>
  );
}
