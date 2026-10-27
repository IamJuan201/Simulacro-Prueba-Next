import type { Metadata } from "next";
import { AuctionForm } from "@/features/auctions/auction-form";
export const metadata: Metadata = { title: "Publicar una subasta" };
export default function NewAuctionPage(){return <main className="content-page narrow-page"><span className="eyebrow">PON TU PIEZA EN CIRCULACIÓN</span><h1>Publica una subasta</h1><p className="muted">Comparte su historia y deja que la comunidad la descubra.</p><AuctionForm/></main>;}
