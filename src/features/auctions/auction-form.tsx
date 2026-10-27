"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { useEffect,useState,type FormEvent } from "react";

type Category={id:string;name:string};
type Initial={id?:string;title:string;description:string;imageUrl:string|null;initialPrice:string;minIncrement:string;closesAt:string;category:{id:string}};

export function AuctionForm({ auctionId, initial }: { auctionId?:string; initial?:Initial }) {
  const [categories,setCategories]=useState<Category[]>([]); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const router=useRouter();
  const { t, locale }=useLocale();
  useEffect(()=>{fetch("/api/categories").then(async r=>{if(r.ok){const v=await r.json() as {data:Category[]};setCategories(v.data);}}).catch(()=>undefined);},[]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const values=Object.fromEntries(new FormData(event.currentTarget).entries());if(!values.imageUrl)delete values.imageUrl;
    try{const response=await fetch(auctionId?`/api/auctions/${auctionId}`:"/api/auctions",{method:auctionId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});const result=await response.json() as {data?:{id:string};error?:{message:string}};if(!response.ok){setError(result.error?.message||"No se pudo guardar la subasta.");return;}router.push(`/auctions/${auctionId||result.data?.id}`);}catch{setError("No se pudo conectar con el servidor.");}finally{setBusy(false);}}
  const closesValue=initial?.closesAt?new Date(initial.closesAt).toISOString().slice(0,16):"";
  return <form className="stack-form auction-editor" onSubmit={submit}><label>{t("auctionTitle")}<input name="title" minLength={4} maxLength={120} defaultValue={initial?.title} required/></label><label>{t("description")}<textarea name="description" minLength={10} maxLength={4000} rows={5} defaultValue={initial?.description} required/></label><div className="form-columns"><label>{t("initialPriceField")}<input name="initialPrice" type="number" min="0.01" step="0.01" defaultValue={initial?.initialPrice} required/></label><label>{t("incrementField")}<input name="minIncrement" type="number" min="0.01" step="0.01" defaultValue={initial?.minIncrement} required/></label></div><label>{t("category")}<select name="categoryId" defaultValue={initial?.category.id||""} required><option value="" disabled>{locale==="es"?"Selecciona una categoría":"Select a category"}</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>{t("closeDate")}<input name="closesAt" type="datetime-local" defaultValue={closesValue} required/><small>{locale==="es"?"El cierre debe quedar entre 1 hora y 7 días desde ahora.":"Closing time must be between 1 hour and 7 days from now."}</small></label><label>{t("image")}<input name="imageUrl" type="text" inputMode="url" placeholder="https://… or /items/item.svg" defaultValue={initial?.imageUrl||""}/></label>{error&&<p role="alert" className="form-error">{error}</p>}<div className="form-actions"><Link className="text-link" href={initial?.id?`/auctions/${initial.id}`:"/my-auctions"}>{locale==="es"?"Volver":"Back"}</Link><button className="button" disabled={busy}>{busy?(locale==="es"?"Guardando…":"Saving…"):initial?t("save"):t("publish")}</button></div></form>;
}
