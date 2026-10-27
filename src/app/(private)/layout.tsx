import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

export default function PrivateLayout({ children }: {children:ReactNode}) {
  return <><SiteHeader /><div className="page-shell private-shell">{children}</div></>;
}
