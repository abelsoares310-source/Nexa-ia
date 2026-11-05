import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent unhandled browser IndexedDB / lifecycle errors from interrupting the UI in iframe environments
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = (reason?.message || reason || "").toString();
    if (
      msg.includes("Database is closing") ||
      msg.includes("Database is hidden") ||
      msg.includes("The database connection is closing") ||
      msg.includes("IDBDatabase")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = (event?.message || "").toString();
    if (
      msg.includes("Database is closing") ||
      msg.includes("Database is hidden") ||
      msg.includes("The database connection is closing") ||
      msg.includes("IDBDatabase")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
