import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { TelegramProvider } from "@/app/providers/telegram-provider";
import { QueryProvider } from "@/app/providers/query-provider";

export function App() {
  return (
    <QueryProvider>
      <TelegramProvider>
        <RouterProvider router={router} />
      </TelegramProvider>
    </QueryProvider>
  );
}
