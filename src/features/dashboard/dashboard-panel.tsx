"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/features/auth/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Row = { id: string; title: string; status: string; bidCount?: number; amount?: string; createdAt?: string; closesAt?: string; auction?: { id: string; title: string; status: string } };

export function DashboardPanel({ kind }: { kind: "auctions" | "bids" }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
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
    if (!window.confirm("¿Cancelar esta subasta? Esta acción no se puede deshacer.")) return;
    const response = await apiFetch(`/api/auctions/${id}`, { method: "DELETE" });
    const result = await response.json() as { error?: { message: string } };
    if (!response.ok) { setError(result.error?.message || "No se pudo cancelar la subasta."); return; }
    setRows((current) => current?.map((row) => row.id === id ? { ...row, status: "CANCELLED" } : row) || []);
  }

  if (error) return <div className="notice" role="alert">{error} <Link href="/login">Inicia sesión</Link></div>;
  if (!rows) return <div className="page-loading">Cargando tu espacio…</div>;
  if (!rows.length) return <div className="empty-state"><span className="empty-icon">✳</span><h2>{kind === "auctions" ? "Tus próximas subastas empiezan aquí" : "Todavía no has ofertado"}</h2><p>{kind === "auctions" ? "Publica una pieza y deja que los coleccionistas la descubran." : "Explora las subastas activas y encuentra tu próxima pieza."}</p><Link className="button" href={kind === "auctions" ? "/auctions/new" : "/auctions"}>{kind === "auctions" ? "Publicar una pieza" : "Explorar subastas"}</Link></div>;

  return <div className="dashboard-list">{rows.map((row) => {
    const item = row.auction || row;
    return <article className="dashboard-row" key={row.id}><div><span className="eyebrow">{kind === "auctions" ? "TU SUBASTA" : "TU OFERTA"}</span><Link href={`/auctions/${item.id}`}><h3>{item.title}</h3></Link><p className="muted">{kind === "auctions" ? `${row.bidCount} ofertas · cierra ${formatDate(row.closesAt || "")}` : `${formatDate(row.createdAt || "")} · ${item.status}`}</p></div><div className="row-actions">{kind === "bids" && <strong>{formatCurrency(row.amount || "0")}</strong>}{kind === "auctions" && row.status === "ACTIVE" && row.bidCount === 0 && <><Link className="button button-quiet" href={`/auctions/${row.id}/edit`}>Editar</Link><button className="button button-quiet" onClick={() => void cancel(row.id)}>Cancelar</button></>}<span className={`status-pill status-${item.status.toLowerCase()}`}>{({ ACTIVE: "Activa", CLOSED: "Cerrada", DESERTED: "Desierta", CANCELLED: "Cancelada" })[item.status] || item.status}</span></div></article>;
  })}</div>;
}
