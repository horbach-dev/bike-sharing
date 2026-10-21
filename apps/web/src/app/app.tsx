import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { TelegramProvider } from "@/app/providers/telegram-provider";

export function App() {
  return (
    <TelegramProvider>
      <RouterProvider router={router} />
    </TelegramProvider>
  );
}
