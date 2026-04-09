"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const t = useTranslations("common");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
          {t("appName")}
        </h1>
        <p className="mx-auto mb-10 max-w-md text-lg text-[var(--text-secondary)]">
          {t("practice")} & {t("exam")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <Link
          href="/practice"
          className="spring-transition group relative overflow-hidden rounded-xl bg-teal-600 px-10 py-4 text-lg font-semibold text-white hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-500/25"
        >
          <span className="relative z-10">{t("practice")}</span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Link>
        <Link
          href="/exam"
          className="spring-transition glass-card px-10 py-4 text-center text-lg font-semibold text-[var(--text-primary)] hover:shadow-xl"
        >
          {t("exam")}
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mt-20 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          { icon: "📝", title: "52+", sub: "Questions" },
          { icon: "⏱", title: "20 min", sub: "Exam mode" },
          { icon: "🌐", title: "RU / UA", sub: "Bilingual" },
        ].map((f, i) => (
          <div key={i} className="glass-card spring-transition p-6 text-center hover:scale-[1.02]">
            <div className="mb-2 text-2xl">{f.icon}</div>
            <div className="text-xl font-bold text-[var(--text-primary)]">{f.title}</div>
            <div className="text-sm text-[var(--text-muted)]">{f.sub}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
