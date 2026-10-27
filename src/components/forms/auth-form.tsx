"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { useState, type FormEvent } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { t } = useLocale();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { error?: { message?: string } };
      if (!response.ok) { setError(result.error?.message || "No se pudo completar la solicitud."); return; }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/auctions");
    } catch { setError("No se pudo conectar con el servidor."); }
    finally { setBusy(false); }
  }
  return <form className="stack-form" onSubmit={submit}>
    {isRegister && <label>{t("fullName")}<input name="fullName" autoComplete="name" minLength={2} maxLength={80} required /></label>}
    <label>{t("email")}<input name="email" type="email" autoComplete="email" required /></label>
    <label>{t("password")}<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 12 : undefined} required /></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button button-wide" disabled={busy}>{busy ? t("loading") : isRegister ? t("createAccount") : t("signIn")}</button>
    <p className="form-switch">{isRegister ? t("haveAccount") : t("noAccount")} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? t("signIn") : t("signUp")}</Link></p>
  </form>;
}
