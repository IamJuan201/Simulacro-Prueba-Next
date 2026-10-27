import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Countdown } from "@/components/auctions/countdown";
import { LocaleText } from "@/components/i18n/locale-text";
import { BidForm } from "@/features/bids/bid-form";
import { getAuctionDetail } from "@/features/auctions/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

async function AuctionDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auction = await getAuctionDetail(id);
  if (!auction) notFound();
  const active = auction.status === "ACTIVE";
  const statusLabels = {
    ACTIVE: <LocaleText es="Activa" en="Active" />,
    CLOSED: <LocaleText es="Cerrada" en="Closed" />,
    DESERTED: <LocaleText es="Desierta" en="No bids" />,
    CANCELLED: <LocaleText es="Cancelada" en="Cancelled" />,
  };

  return <main className="detail-layout">
    <div className="detail-photo"><Image src={auction.imageUrl || "/items/collectible.svg"} alt={auction.title} fill priority sizes="(max-width: 900px) 100vw, 55vw" /></div>
    <section className="detail-main">
      <Link className="back-link" href="/auctions"><LocaleText es="← Volver a subastas" en="← Back to auctions" /></Link>
      <span className="eyebrow">{auction.category.name} · <LocaleText es="POR" en="BY" /> {auction.sellerName}</span>
      <h1>{auction.title}</h1>
      <span className={`status-pill status-${auction.status.toLowerCase()}`}>{statusLabels[auction.status]}</span>
      <p className="detail-description">{auction.description}</p>
      <div className="price-panel">
        <div><span className="muted"><LocaleText es={auction.bidHistory.length ? "Oferta más alta" : "Precio inicial"} en={auction.bidHistory.length ? "Highest bid" : "Starting price"} /></span><strong>{formatCurrency(auction.currentPrice)}</strong></div>
        <div><span className="muted"><LocaleText es={active ? "Tiempo restante" : "Cerró"} en={active ? "Time left" : "Closed"} /></span><strong>{active ? <Countdown closesAt={auction.closesAt} /> : formatDate(auction.closesAt)}</strong></div>
        <div><span className="muted"><LocaleText es="Ofertas" en="Bids" /></span><strong>{auction.bidHistory.length}</strong></div>
      </div>
      {auction.status === "CANCELLED" && auction.cancellationReason && <p className="notice"><LocaleText es="Motivo de cancelación:" en="Cancellation reason:" /> {auction.cancellationReason}</p>}
      {auction.winnerAlias && <p className="notice"><LocaleText es="Ganador:" en="Winner:" /> {auction.winnerAlias}</p>}
      {active && <BidForm auctionId={auction.id} currentPrice={auction.currentPrice} minIncrement={auction.minIncrement} initialPrice={auction.initialPrice} bidCount={auction.bidHistory.length} />}
      <div className="history-heading"><h2><LocaleText es="Historial de ofertas" en="Bid history" /></h2><span>{auction.bidHistory.length} <LocaleText es="movimientos" en="bids" /></span></div>
      {auction.bidHistory.length ? <ol className="bid-history">{auction.bidHistory.map((bid, index) => <li key={`${bid.createdAt}-${index}`}><span className="bid-avatar">{bid.bidderAlias.slice(0, 1)}</span><span><strong>{bid.bidderAlias}</strong><small>{formatDate(bid.createdAt)}</small></span><b>{formatCurrency(bid.amount)}</b></li>)}</ol> : <p className="empty-inline"><LocaleText es="Aún no hay ofertas. ¡Puedes ser la primera!" en="No bids yet. You can be the first!" /></p>}
    </section>
  </main>;
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <div className="page-shell detail-shell"><Suspense fallback={<div className="page-loading"><LocaleText es="Cargando subasta…" en="Loading auction…" /></div>}><AuctionDetails params={params} /></Suspense></div>;
}
