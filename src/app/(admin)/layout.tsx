import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export default function AdminLayout({ children }: {children:ReactNode}) {
  return <><SiteHeader /><div className="admin-shell"><aside className="admin-nav"><span className="eyebrow">PANEL ADMIN</span><Link href="/admin/auctions">Moderación</Link><Link href="/admin/categories">Categorías</Link></aside><section className="admin-content">{children}</section></div></>;
}
import type { ReactNode } from "react";
