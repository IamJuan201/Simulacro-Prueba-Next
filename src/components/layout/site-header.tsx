"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiFetch } from "@/features/auth/api";

type User = { id: string; fullName: string; role: "USER" | "ADMIN" };

export function SiteHeader() {
  const { t } = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    apiFetch("/api/auth/me").then(async (response) => {
      if (response.ok) {
        const result = (await response.json()) as { data: User };
        setUser(result.data);
      }
    }).catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/">Bid<span>Hub</span></Link>
      <nav aria-label="Navegación principal">
        <Link href="/auctions">{t("auctions")}</Link>
        {user && <Link href="/auctions/new">{t("sell")}</Link>}
        {user && <Link href="/my-auctions">{t("myAuctions")}</Link>}
        {user && <Link href="/my-bids">{t("myBids")}</Link>}
        {user?.role === "ADMIN" && <Link href="/admin/auctions">{t("admin")}</Link>}
      </nav>
      <div className="header-actions">
        <LanguageSwitcher />
        {user ? <><span className="user-greeting">Hola, {user.fullName.split(" ")[0]}</span><button className="button button-quiet" onClick={logout}>{t("signOut")}</button></> : <><Link className="button button-quiet" href="/login">{t("signIn")}</Link><Link className="button button-small" href="/register">{t("signUp")}</Link></>}
      </div>
    </header>
  );
}
