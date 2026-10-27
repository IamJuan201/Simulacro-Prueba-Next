"use client";

import { useLocale } from "@/components/i18n/locale-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      className="language-switcher"
      onClick={() => setLocale(nextLocale)}
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
    >
      {locale.toUpperCase()}
    </button>
  );
}
