"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import api from "@/lib/api";

interface SessionEntry {
  id: string;
  mode: string;
  lang: string;
  score: number | null;
  startedAt: string;
  endedAt: string | null;
  ticketCount: number;
}

interface HistoryData {
  data: SessionEntry[];
  total: number;
  page: number;
  pageSize: number;
}

function HistoryContent() {
  const t = useTranslations("stats");
  const tc = useTranslations("common");
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/stats/history?page=${page}&pageSize=10`)
      .then((res) => {
        setHistory(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="mt-20 text-center text-gray-500">{tc("loading")}</div>
    );
  }

  if (!history || history.data.length === 0) {
    return (
      <div className="mx-auto mt-20 max-w-2xl text-center">
        <h1 className="mb-4 text-2xl font-bold">{t("overview")}</h1>
        <p className="text-gray-500">No sessions yet</p>
        <Link
          href="/practice"
          className="mt-4 inline-block rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          {tc("start")}
        </Link>
      </div>
    );
  }

  const totalPages = Math.ceil(history.total / history.pageSize);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">{t("totalSessions")}: {history.total}</h1>

      <div className="overflow-hidden rounded-lg border dark:border-gray-700">
        <table className="w-full text-left text-sm dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 font-medium text-gray-600">Mode</th>
              <th className="px-4 py-3 font-medium text-gray-600">{t("avgScore")}</th>
              <th className="px-4 py-3 font-medium text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.data.map((session) => {
              const startDate = new Date(session.startedAt);
              const endDate = session.endedAt
                ? new Date(session.endedAt)
                : null;
              const durationMs = endDate
                ? endDate.getTime() - startDate.getTime()
                : 0;
              const minutes = Math.floor(durationMs / 60000);
              const seconds = Math.floor((durationMs % 60000) / 1000);

              return (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    {startDate.toLocaleDateString()}{" "}
                    <span className="text-gray-400">
                      {startDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        session.mode === "EXAM"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {session.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        (session.score ?? 0) >= 90
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {session.score ?? 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {minutes}:{String(seconds).padStart(2, "0")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            {tc("back")}
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            {tc("next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
