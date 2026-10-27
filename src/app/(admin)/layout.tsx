import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { LocaleText } from "@/components/i18n/locale-text";

export default function AdminLayout({ children }: {children:ReactNode}) {
  return <><SiteHeader /><div className="admin-shell"><aside className="admin-nav"><span className="eyebrow"><LocaleText es="PANEL ADMIN" en="ADMIN PANEL"/></span><Link href="/admin/auctions"><LocaleText es="Moderación" en="Moderation"/></Link><Link href="/admin/categories"><LocaleText es="Categorías" en="Categories"/></Link></aside><section className="admin-content">{children}</section></div></>;
}
