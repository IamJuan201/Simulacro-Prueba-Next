import Link from "next/link";

export default function AuthLayout({ children }: {children:ReactNode}) {
  return <main className="auth-shell"><Link className="brand" href="/">Bid<span>Hub</span></Link><div className="auth-card">{children}</div><p className="muted">Colecciona con confianza.</p></main>;
}
import type { ReactNode } from "react";
