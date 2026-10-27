"use client";

import { useLocale } from "@/components/i18n/locale-provider";

export function LocaleText({ es, en }: { es: string; en: string }) {
  const { locale } = useLocale();
  return locale === "es" ? es : en;
}
