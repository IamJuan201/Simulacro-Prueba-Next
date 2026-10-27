import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPanel } from "@/features/dashboard/dashboard-panel";
import { LocaleText } from "@/components/i18n/locale-text";

export const metadata: Metadata = { title: "Mis subastas" };
export default function MyAuctionsPage() {
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow"><LocaleText es="TU COLECCIÓN EN MOVIMIENTO" en="YOUR COLLECTION IN MOTION" /></span><h1><LocaleText es="Mis subastas" en="My auctions" /></h1><p className="muted"><LocaleText es="Administra las piezas que has publicado." en="Manage the items you have listed." /></p></div><Link className="button" href="/auctions/new">+ <LocaleText es="Publicar pieza" en="List an item" /></Link></div><DashboardPanel kind="auctions" /></main>;
}
