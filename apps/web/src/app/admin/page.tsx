"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface TicketCounts {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<TicketCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [all, draft, published] = await Promise.all([
          api.get("/admin/tickets?pageSize=1"),
          api.get("/admin/tickets?status=DRAFT&pageSize=1"),
          api.get("/admin/tickets?status=PUBLISHED&pageSize=1"),
        ]);
        setCounts({
          total: all.data.total,
          draft: draft.data.total,
          published: published.data.total,
          archived: all.data.total - draft.data.total - published.data.total,
        });
      } catch {}
      setLoading(false);
    }
    fetchCounts();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {counts && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <DashCard label="Total Tickets" value={counts.total} />
          <DashCard
            label="Published"
            value={counts.published}
            color="text-green-700"
          />
          <DashCard
            label="Draft"
            value={counts.draft}
            color="text-amber-700"
          />
          <DashCard
            label="Archived"
            value={counts.archived}
            color="text-gray-500"
          />
        </div>
      )}

      <div className="flex gap-4">
        <Link
          href="/admin/import"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Import Tickets
        </Link>
        <Link
          href="/admin/tickets"
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Manage Tickets
        </Link>
      </div>
    </div>
  );
}

function DashCard({
  label,
  value,
  color = "text-blue-700",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}
