"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="relative z-10 border-t border-[var(--border-subtle)] py-6 text-center text-sm text-[var(--text-muted)]">
      {t("disclaimer")}
    </footer>
  );
}
