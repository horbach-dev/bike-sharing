import React from "react";
import ReactDOM from "react-dom/client";
import { initFp } from "@tma.js/sdk-react";
import { App } from "@/app/app";
import { ErrorBoundary } from "@/app/providers/error-boundary";
import { ErrorScreen } from "@/app/ui/error-screen";
import { initializeI18n } from "@/shared/i18n";
import { isTelegramMiniApp } from "@/shared/lib/telegram";
import "@/app/styles/globals.css";
import "@/app/styles/mini-app-safe-area.css";
import "@/app/styles/error-boundary.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Application root element was not found");
const appRoot = ReactDOM.createRoot(rootElement);

if (isTelegramMiniApp()) {
  try {
    initFp({ acceptCustomStyles: false });
  } catch (error) {
    console.warn("Telegram Mini App SDK initialization failed", error);
  }
}

async function startApp() {
  try {
    await initializeI18n();
    appRoot.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Application startup error", error);
    appRoot.render(<ErrorScreen />);
  }
}

void startApp();
