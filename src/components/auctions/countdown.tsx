"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";

export function Countdown({ closesAt }: { closesAt: string }) {
  const { locale } = useLocale();
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(closesAt).getTime() - Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [closesAt]);
  if (remaining === null) return <span>{locale === "es" ? "Calculando…" : "Calculating…"}</span>;
  if (remaining === 0) return <span>{locale === "es" ? "Finalizada" : "Ended"}</span>;
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return <span suppressHydrationWarning>{days > 0 ? `${days}d ` : ""}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>;
}
