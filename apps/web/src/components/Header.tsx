"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations("common");
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b bg-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-blue-700">
          {t("appName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/practice" className="hover:text-blue-600">
            {t("practice")}
          </Link>
          <Link href="/exam" className="hover:text-blue-600">
            {t("exam")}
          </Link>
          {user && (
            <>
              <Link href="/stats" className="hover:text-blue-600">
                {t("stats")}
              </Link>
              <Link href="/history" className="hover:text-blue-600">
                {t("history")}
              </Link>
            </>
          )}
          <LanguageSwitcher />
          {user ? (
            <button
              onClick={() => logout()}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              {t("logout")}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
