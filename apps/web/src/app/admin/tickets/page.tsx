"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Ticket {
  id: string;
  questionRu: string;
  pddRef: string;
  difficulty: string;
  status: string;
  tags: string[];
}

interface TicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "15");
      if (status) params.set("status", status);
      if (difficulty) params.set("difficulty", difficulty);
      if (search) params.set("search", search);

      const res = await api.get(`/admin/tickets?${params}`);
      setTickets(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
  }, [page, status, difficulty]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/admin/tickets/${id}/publish`);
      fetchTickets();
    } catch {}
  };

  const totalPages = tickets
    ? Math.ceil(tickets.total / tickets.pageSize)
    : 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tickets</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : !tickets || tickets.data.length === 0 ? (
        <div className="text-gray-500">No tickets found</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-600">Ref</th>
                  <th className="px-3 py-2 font-medium text-gray-600">
                    Question
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600">
                    Difficulty
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.data.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {ticket.pddRef}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2">
                      {ticket.questionRu}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          ticket.difficulty === "EASY"
                            ? "bg-green-100 text-green-700"
                            : ticket.difficulty === "HARD"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {ticket.difficulty}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          ticket.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : ticket.status === "DRAFT"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                        {ticket.status === "DRAFT" && (
                          <button
                            onClick={() => handlePublish(ticket.id)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {tickets.total} total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded border px-3 py-1 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
