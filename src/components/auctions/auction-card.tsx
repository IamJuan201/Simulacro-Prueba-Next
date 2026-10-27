import Image from "next/image";
import Link from "next/link";
import type { AuctionStatus } from "../../../generated/prisma/enums";
import { formatCurrency } from "@/lib/utils";
import { Countdown } from "@/components/auctions/countdown";
import { LocaleText } from "@/components/i18n/locale-text";

export type AuctionCardData = {
  id: string; title: string; description: string; imageUrl: string | null;
  initialPrice: string; currentPrice: string; closesAt: string; bidCount: number;
  status: AuctionStatus; sellerName: string; category: { name: string };
};

export function AuctionCard({ auction }: { auction: AuctionCardData }) {
  return <article className="auction-card">
    <Link href={`/auctions/${auction.id}`} className="card-image">
      <Image src={auction.imageUrl || "/items/collectible.svg"} alt={auction.title} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
      <span className={`status-pill status-${auction.status.toLowerCase()}`}>{auction.status === "ACTIVE" ? <LocaleText es="Activa" en="Active"/> : auction.status === "CLOSED" ? <LocaleText es="Cerrada" en="Closed"/> : auction.status === "DESERTED" ? <LocaleText es="Desierta" en="No bids"/> : <LocaleText es="Cancelada" en="Cancelled"/>}</span>
    </Link>
    <div className="card-content"><span className="eyebrow">{auction.category.name}</span><Link href={`/auctions/${auction.id}`}><h3>{auction.title}</h3></Link><p className="muted clamp">{auction.description}</p>
      <div className="card-price"><span className="muted"><LocaleText es={auction.bidCount ? "Oferta actual" : "Precio inicial"} en={auction.bidCount ? "Current bid" : "Starting price"}/></span><strong>{formatCurrency(auction.currentPrice)}</strong></div>
      <div className="card-meta"><span>{auction.bidCount} <LocaleText es="ofertas" en="bids"/></span><span>{auction.status === "ACTIVE" ? <Countdown closesAt={auction.closesAt} /> : <LocaleText es="Finalizada" en="Ended"/>}</span></div>
    </div>
  </article>;
}
