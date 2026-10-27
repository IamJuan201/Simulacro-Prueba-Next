import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPanel } from "@/features/dashboard/dashboard-panel";
export const metadata: Metadata = { title: "Mis ofertas" };
export default function MyBidsPage(){return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">SIGUE CADA MOVIMIENTO</span><h1>Mis ofertas</h1><p className="muted">El historial de tus participaciones en el mercado.</p></div><Link className="button button-quiet" href="/auctions">Explorar subastas</Link></div><DashboardPanel kind="bids"/></main>;}
