import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPanel } from "@/features/dashboard/dashboard-panel";
export const metadata: Metadata = { title: "Mis subastas" };
export default function MyAuctionsPage(){return <main className="content-page"><div className="page-heading"><div><span className="eyebrow">TU COLECCIÓN EN MOVIMIENTO</span><h1>Mis subastas</h1><p className="muted">Administra las piezas que has publicado.</p></div><Link className="button" href="/auctions/new">+ Publicar pieza</Link></div><DashboardPanel kind="auctions"/></main>;}
