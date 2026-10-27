import Link from "next/link";
import { Suspense } from "react";
import { AuctionCard } from "@/components/auctions/auction-card";
import { prisma } from "@/lib/db";
import { listAuctions } from "@/features/auctions/queries";
import { AuctionStatus } from "../../../../generated/prisma/enums";
import { LocaleText } from "@/components/i18n/locale-text";

type Search = Promise<{ category?: string; status?: string; q?: string; page?: string }>;

async function Catalog({ searchParams }: { searchParams: Search }) {
  const filters = await searchParams;
    const status = Object.values(AuctionStatus).find((value) => value === filters.status);
  const [categories, result] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    listAuctions({ categoryId: filters.category, status, search: filters.q, page: Math.max(1, Number(filters.page) || 1) }),
  ]);
  return <>
    <form action="/auctions" className="filter-bar"><label><LocaleText es="Buscar" en="Search"/><input type="search" name="q" defaultValue={filters.q} placeholder="Nombre o descripción…"/></label><label><LocaleText es="Categoría" en="Category"/><select name="category" defaultValue={filters.category || ""}><option value=""><LocaleText es="Todas" en="All"/></option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><LocaleText es="Estado" en="Status"/><select name="status" defaultValue={filters.status || ""}><option value=""><LocaleText es="Todos" en="All"/></option>{Object.values(AuctionStatus).map((value)=><option key={value} value={value}>{({ACTIVE:"Activa",CLOSED:"Cerrada",DESERTED:"Desierta",CANCELLED:"Cancelada"})[value]}</option>)}</select></label><button className="button button-small"><LocaleText es="Aplicar filtros" en="Apply filters"/></button></form>
    {result.items.length ? <div className="auction-grid">{result.items.map((auction)=><AuctionCard key={auction.id} auction={auction}/>)}</div> : <div className="empty-state"><span className="empty-icon">⌕</span><h2><LocaleText es="No encontramos subastas" en="No auctions found"/></h2><p><LocaleText es="Prueba otros filtros o vuelve más tarde." en="Try other filters or come back later."/></p><Link className="text-link" href="/auctions"><LocaleText es="Limpiar búsqueda" en="Clear search"/> →</Link></div>}
    {result.totalPages > 1 && <nav className="pagination" aria-label="Paginación">{result.page > 1 && <Link href={catalogUrl(filters, result.page - 1)}>← Anterior</Link>}<span>Página {result.page} de {result.totalPages}</span>{result.page < result.totalPages && <Link href={catalogUrl(filters, result.page + 1)}>Siguiente →</Link>}</nav>}
  </>;
}

function catalogUrl(filters: { category?: string; status?: string; q?: string }, page: number) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category); if (filters.status) params.set("status", filters.status); if (filters.q) params.set("q", filters.q); params.set("page", String(page));
  return `/auctions?${params}`;
}

export default function AuctionsPage({ searchParams }: { searchParams: Search }) {
  return <main className="content-page"><div className="page-heading"><div><span className="eyebrow"><LocaleText es="DESCUBRE ALGO EXTRAORDINARIO" en="FIND SOMETHING EXTRAORDINARY"/></span><h1><LocaleText es="Todas las subastas" en="All auctions"/></h1><p className="muted"><LocaleText es="Piezas elegidas por coleccionistas, para coleccionistas." en="Pieces chosen by collectors, for collectors."/></p></div><Link className="button button-quiet" href="/auctions/new">+ <LocaleText es="Publicar una pieza" en="List an item"/></Link></div><Suspense fallback={<div className="loading-grid"><div/><div/><div/></div>}><Catalog searchParams={searchParams}/></Suspense></main>;
}
