import { useEffect, useState } from "react";
import { getHealth } from "@/shared/api/health";

type HealthState = "checking" | "online" | "offline";

export function ApiStatus() {
  const [state, setState] = useState<HealthState>("checking");

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => active && setState("online"))
      .catch(() => active && setState("offline"));
    return () => {
      active = false;
    };
  }, []);

  const label = {
    checking: "Проверяю API…",
    online: "API подключён",
    offline: "API пока недоступен",
  }[state];

  return (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <span
        className={`size-2 rounded-full ${
          state === "online" ? "bg-emerald-600" : state === "offline" ? "bg-amber-500" : "bg-muted-foreground"
        }`}
      />
      {label}
    </span>
  );
}
