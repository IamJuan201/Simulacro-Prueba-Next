import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuctionDetail } from "@/features/auctions/queries";
import { AuctionForm } from "@/features/auctions/auction-form";
import { getAuthenticatedUser } from "@/lib/auth";
export const metadata: Metadata = { title: "Editar subasta" };
async function EditAuction({params}:{params:Promise<{id:string}>}){const [{id},user]=await Promise.all([params,getAuthenticatedUser()]);const auction=await getAuctionDetail(id);if(!auction||!user||auction.sellerId!==user.id||auction.status!=="ACTIVE"||auction.bidHistory.length>0)notFound();return <main className="content-page narrow-page"><span className="eyebrow">AJUSTA LOS DETALLES</span><h1>Editar subasta</h1><AuctionForm auctionId={id} initial={auction}/></main>;}
export default function EditAuctionPage({params}:{params:Promise<{id:string}>}){return <Suspense fallback={<div className="page-loading">Cargando subasta…</div>}><EditAuction params={params}/></Suspense>;}
