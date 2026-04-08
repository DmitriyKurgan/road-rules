"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  const t = useTranslations("common");
  const { user, logout } = useAuthStore();

  return (
    <header className="border-b bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-blue-700 dark:text-blue-400">
          {t("appName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/practice" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            {t("practice")}
          </Link>
          <Link href="/exam" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            {t("exam")}
          </Link>
          {user && (
            <>
              <Link href="/stats" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                {t("stats")}
              </Link>
              <Link href="/history" className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                {t("history")}
              </Link>
            </>
          )}
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <button
              onClick={() => logout()}
              className="text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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
