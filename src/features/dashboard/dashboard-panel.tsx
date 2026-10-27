"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/features/auth/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";

type Row = { id: string; title: string; status: string; bidCount?: number; amount?: string; createdAt?: string; closesAt?: string; auction?: { id: string; title: string; status: string } };

export function DashboardPanel({ kind }: { kind: "auctions" | "bids" }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const { locale, t } = useLocale();
  const english = locale === "en";
  useEffect(() => {
    let cancelled = false;
    apiFetch(kind === "auctions" ? "/api/me/auctions" : "/api/me/bids")
      .then(async (response) => ({ ok: response.ok, result: await response.json() as { data?: Row[]; error?: { message: string } } }))
      .then(({ ok, result }) => {
        if (cancelled) return;
        if (!ok) { setError(result.error?.message || "No se pudieron cargar tus datos."); return; }
        setRows(result.data || []);
      })
      .catch(() => { if (!cancelled) setError("No se pudo conectar con el servidor."); });
    return () => { cancelled = true; };
  }, [kind]);

  async function cancel(id: string) {
    if (!window.confirm(english ? "Cancel this auction? This cannot be undone." : "¿Cancelar esta subasta? Esta acción no se puede deshacer.")) return;
    const response = await apiFetch(`/api/auctions/${id}`, { method: "DELETE" });
    const result = await response.json() as { error?: { message: string } };
    if (!response.ok) { setError(result.error?.message || "No se pudo cancelar la subasta."); return; }
    setRows((current) => current?.map((row) => row.id === id ? { ...row, status: "CANCELLED" } : row) || []);
  }

  if (error) return <div className="notice" role="alert">{error} <Link href="/login">{t("signIn")}</Link></div>;
  if (!rows) return <div className="page-loading">{t("loading")}</div>;
  if (!rows.length) return <div className="empty-state"><span className="empty-icon">✳</span><h2>{kind === "auctions" ? (locale === "es" ? "Tus próximas subastas empiezan aquí" : "Your next auctions start here") : t("emptyMyBids")}</h2><p>{kind === "auctions" ? (locale === "es" ? "Publica una pieza y deja que los coleccionistas la descubran." : "List a collectible for the community to discover.") : (locale === "es" ? "Explora las subastas activas y encuentra tu próxima pieza." : "Explore live auctions and find your next collectible.")}</p><Link className="button" href={kind === "auctions" ? "/auctions/new" : "/auctions"}>{kind === "auctions" ? t("publish") : t("explore")}</Link></div>;

  return <div className="dashboard-list">{rows.map((row) => {
    const item = row.auction || row;
    const labels: Record<string, string> = { ACTIVE: t("active"), CLOSED: t("closed"), DESERTED: t("deserted"), CANCELLED: t("cancelled") };
    return <article className="dashboard-row" key={row.id}><div><span className="eyebrow">{kind === "auctions" ? (locale === "es" ? "TU SUBASTA" : "YOUR AUCTION") : (locale === "es" ? "TU OFERTA" : "YOUR BID")}</span><Link href={`/auctions/${item.id}`}><h3>{item.title}</h3></Link><p className="muted">{kind === "auctions" ? `${row.bidCount} ${t("bids")} · ${locale === "es" ? "cierra" : "closes"} ${formatDate(row.closesAt || "")}` : `${formatDate(row.createdAt || "")} · ${labels[item.status] || item.status}`}</p></div><div className="row-actions">{kind === "bids" && <strong>{formatCurrency(row.amount || "0")}</strong>}{kind === "auctions" && row.status === "ACTIVE" && row.bidCount === 0 && <><Link className="button button-quiet" href={`/auctions/${row.id}/edit`}>{t("edit")}</Link><button className="button button-quiet" onClick={() => void cancel(row.id)}>{t("cancel")}</button></>}<span className={`status-pill status-${item.status.toLowerCase()}`}>{labels[item.status] || item.status}</span></div></article>;
  })}</div>;
}
