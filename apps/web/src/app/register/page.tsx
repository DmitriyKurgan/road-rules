"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const { register } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md p-8"
      >
        <h1 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">{t("registerTitle")}</h1>
        {error && (
          <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="spring-transition w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? tc("loading") : t("registerTitle")}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-blue-500 hover:underline">
            {t("loginTitle")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
