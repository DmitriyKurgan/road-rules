"use client";

import { useState, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import ruMessages from "../../messages/ru.json";
import ukMessages from "../../messages/uk.json";

const messages: Record<string, typeof ruMessages> = {
  ru: ruMessages,
  uk: ukMessages,
};

function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "ru";
  const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
  return match?.[1] || "ru";
}

export function IntlWrapper({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("ru");

  useEffect(() => {
    setLocale(getLocaleFromCookie());

    const onCookieChange = () => setLocale(getLocaleFromCookie());
    window.addEventListener("locale-change", onCookieChange);
    return () => window.removeEventListener("locale-change", onCookieChange);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale] || messages.ru}>
      {children}
    </NextIntlClientProvider>
  );
}
