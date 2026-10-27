import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/i18n/locale-provider";

export const metadata: Metadata = {
  title: { default: "BidHub | Colecciona. Ofrece. Gana.", template: "%s | BidHub" },
  description: "Subastas en línea para descubrir y coleccionar piezas únicas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><LocaleProvider>{children}</LocaleProvider></body>
    </html>
  );
}
