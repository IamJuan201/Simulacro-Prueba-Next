import Link from "next/link";
import { LocaleText } from "@/components/i18n/locale-text";

export function SiteFooter() {
  return <footer className="site-footer"><Link className="brand" href="/">Bid<span>Hub</span></Link><p><LocaleText es="Un lugar para coleccionar con confianza." en="A place to collect with confidence." /></p><span>© 2026 BidHub</span></footer>;
}
