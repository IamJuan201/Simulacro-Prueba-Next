"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiFetch } from "@/features/auth/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Auction = { id: string; title: string; status: string; currentPrice: string; bidCount: number; closesAt: string; sellerName: string };
type AuctionListResponse = { data?: { items: Auction[] }; error?: { message: string } };

export function AdminAuctionsPanel() {
  const [rows, setRows] = useState<Auction[]>([]);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const { locale, t } = useLocale();
  const english = locale === "en";

  async function load() {
    const response = await apiFetch("/api/admin/auctions");
    const result = await response.json() as AuctionListResponse;
    if (!response.ok) { setError(result.error?.message || (english ? "Could not load auctions." : "No se pudieron cargar subastas.")); return; }
    setRows(result.data?.items || []);
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/auctions").then(async (response) => ({ ok: response.ok, result: await response.json() as AuctionListResponse }))
      .then(({ ok, result }) => {
        if (cancelled) return;
        if (!ok) { setError(result.error?.message || "No se pudieron cargar subastas."); return; }
        setRows(result.data?.items || []);
      }).catch(() => { if (!cancelled) setError("No se pudieron cargar subastas."); });
    return () => { cancelled = true; };
  }, []);

  async function moderate(id: string) {
    const response = await apiFetch(`/api/admin/auctions/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason[id] || "" }),
    });
    const result = await response.json() as { error?: { message: string } };
    if (!response.ok) { setNotice(result.error?.message || (english ? "Could not moderate this auction." : "No se pudo moderar.")); return; }
    setNotice(english ? "Auction cancelled and reason recorded." : "Subasta cancelada y motivo registrado.");
    await load();
  }

  const statusLabels: Record<string, string> = { ACTIVE: t("active"), CLOSED: t("closed"), DESERTED: t("deserted"), CANCELLED: t("cancelled") };
  return <>
    <div className="page-heading"><div><span className="eyebrow">{english ? "MARKET OVERSIGHT" : "CONTROL DEL MERCADO"}</span><h1>{english ? "Moderation" : "Moderación"}</h1><p className="muted">{english ? "Review auctions and manage reports." : "Revisa subastas y gestiona reportes."}</p></div><Link className="button button-quiet" href="/admin/categories">{english ? "Manage categories →" : "Gestionar categorías →"}</Link></div>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    <div className="admin-auction-list">{rows.map((auction) => <article className="admin-auction" key={auction.id}><div><span className={`status-pill status-${auction.status.toLowerCase()}`}>{statusLabels[auction.status] || auction.status}</span><Link href={`/auctions/${auction.id}`}><h3>{auction.title}</h3></Link><p className="muted">{english ? "Seller" : "Vendedor"}: {auction.sellerName} · {auction.bidCount} {t("bids")} · {formatCurrency(auction.currentPrice)} · {formatDate(auction.closesAt)}</p></div>{auction.status === "ACTIVE" && <div className="moderation-box"><label>{english ? "Reason (required)" : "Motivo (obligatorio)"}<input value={reason[auction.id] || ""} onChange={(event) => setReason({ ...reason, [auction.id]: event.target.value })} /></label><button className="button button-danger" onClick={() => void moderate(auction.id)}>{english ? "Cancel auction" : "Cancelar subasta"}</button></div>}</article>)}</div>
  </>;
}
