import type { Metadata } from "next";
import { AuctionForm } from "@/features/auctions/auction-form";
import { LocaleText } from "@/components/i18n/locale-text";

export const metadata: Metadata = { title: "Publicar una subasta" };
export default function NewAuctionPage() {
  return <main className="content-page narrow-page"><span className="eyebrow"><LocaleText es="PON TU PIEZA EN CIRCULACIÓN" en="BRING YOUR ITEM TO MARKET" /></span><h1><LocaleText es="Publica una subasta" en="List an auction" /></h1><p className="muted"><LocaleText es="Comparte su historia y deja que los coleccionistas la descubran." en="Share its story and let collectors discover it." /></p><AuctionForm /></main>;
}
