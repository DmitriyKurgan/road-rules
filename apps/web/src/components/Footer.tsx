"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t bg-gray-50 py-6 text-center text-sm text-gray-500">
      {t("disclaimer")}
    </footer>
  );
}
