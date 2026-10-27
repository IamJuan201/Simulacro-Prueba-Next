import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPanel } from "@/features/dashboard/dashboard-panel";
import { LocaleText } from "@/components/i18n/locale-text";

export const metadata: Metadata = { title: "Mis ofertas" };
export default function MyBidsPage() {
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow"><LocaleText es="SIGUE CADA MOVIMIENTO" en="FOLLOW EVERY MOVE" /></span><h1><LocaleText es="Mis ofertas" en="My bids" /></h1><p className="muted"><LocaleText es="El historial de tus participaciones en el mercado." en="Your history of taking part in the marketplace." /></p></div><Link className="button button-quiet" href="/auctions"><LocaleText es="Explorar subastas" en="Explore auctions" /></Link></div><DashboardPanel kind="bids" /></main>;
}
