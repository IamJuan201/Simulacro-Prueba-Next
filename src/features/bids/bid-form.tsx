"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { apiFetch } from "@/features/auth/api";
import { formatCurrency } from "@/lib/utils";

export function BidForm({ auctionId, currentPrice, minIncrement, initialPrice, bidCount }: { auctionId: string; currentPrice: string; minIncrement: string; initialPrice: string; bidCount: number }) {
  const { locale, t } = useLocale();
  const required = bidCount > 0 ? Number(currentPrice) + Number(minIncrement) : Number(initialPrice);
  const [error,setError]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); setMessage(""); const form=event.currentTarget; const amount=String(new FormData(form).get("amount"));
    try { const response=await apiFetch(`/api/auctions/${auctionId}/bids`,{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({amount})}); const result=await response.json() as {data?:{extended:boolean};error?:{message:string}}; if(!response.ok){setError(result.error?.message||"No se pudo registrar la oferta.");return;} setMessage(result.data?.extended?"Oferta registrada. La subasta se extendió 5 minutos.":"Oferta registrada."); form.reset(); window.setTimeout(()=>window.location.reload(),900); } catch {setError("No se pudo conectar con el servidor.");} finally{setBusy(false);} }
  return <form className="bid-form" onSubmit={submit}><div><label htmlFor="bid-amount">{t("bidAmount")}</label><p>{locale === "es" ? "Oferta mínima:" : "Minimum bid:"} <strong>{formatCurrency(required)}</strong></p></div><div className="bid-form-row"><input id="bid-amount" name="amount" type="number" min={required} step="0.01" required placeholder={required.toFixed(2)}/><button className="button" disabled={busy}>{busy?(locale==="es"?"Enviando…":"Submitting…"):t("submitBid")}</button></div>{error&&<p className="form-error" role="alert">{error} {error.toLowerCase().includes("inicia sesión")&&<Link href={`/login?next=/auctions/${auctionId}`}>{t("signIn")}</Link>}</p>}{message&&<p className="form-success" role="status">{message}</p>}</form>;
}
