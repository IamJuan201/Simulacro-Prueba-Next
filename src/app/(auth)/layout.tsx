import type { ReactNode } from "react";
import Link from "next/link";
import { LocaleText } from "@/components/i18n/locale-text";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell"><Link className="brand" href="/">Bid<span>Hub</span></Link><div className="auth-card">{children}</div><p className="muted"><LocaleText es="Colecciona con confianza." en="Collect with confidence." /></p></main>;
}
