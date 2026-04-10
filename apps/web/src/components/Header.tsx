"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { UserMenu } from "./UserMenu";
import { Avatar } from "./Avatar";

export function Header() {
  const t = useTranslations("common");
  const { user, logout, fetchProfile } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("accessToken")) {
      fetchProfile();
    }
  }, [fetchProfile]);

  const navLinks = [
    { href: "/practice", label: t("practice") },
    { href: "/exam", label: t("exam") },
    ...(user
      ? [
          { href: "/stats", label: t("stats") },
          { href: "/history", label: t("history") },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="text-base font-bold tracking-tight text-teal-600 sm:text-xl dark:text-teal-400">
          <span className="hidden sm:inline">{t("appName")}</span>
          <span className="sm:hidden">ПДД</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="spring-transition rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--glow-blue)] hover:text-teal-600 dark:hover:text-teal-400"
            >
              {link.label}
            </Link>
          ))}
          <div className="mx-2 h-5 w-px bg-[var(--border-subtle)]" />
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="spring-transition ml-1 rounded-xl bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-500/20"
            >
              {t("login")}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex flex-col gap-1.5 p-2 md:hidden"
        >
          <span className={`h-0.5 w-5 rounded bg-[var(--text-secondary)] spring-transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 rounded bg-[var(--text-secondary)] spring-transition ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 rounded bg-[var(--text-secondary)] spring-transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-xl px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--glow-blue)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-[var(--border-subtle)]" />
            <div className="flex items-center gap-3 px-3 py-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar email={user.email} avatarUrl={user.avatarUrl} size={36} />
                  <span className="truncate text-sm text-[var(--text-secondary)]">{user.email}</span>
                </div>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-red-500"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-xl bg-teal-600 px-5 py-2.5 text-center text-sm font-medium text-white"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
