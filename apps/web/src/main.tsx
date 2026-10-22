import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/app";
import "@/app/styles/globals.css";
import "@/app/styles/mini-app-safe-area.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
