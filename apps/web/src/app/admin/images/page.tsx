"use client";

import { useState } from "react";
import api from "@/lib/api";

interface ImageCandidate {
  pageUrl: string;
  fileUrl: string;
  title: string;
  author: string;
  license: string;
  width: number;
  height: number;
  attributionHtml: string;
}

interface AttachResult {
  imageId: string;
  storedKey: string;
  license: string;
}

export default function AdminImagesPage() {
  const [query, setQuery] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [attachResult, setAttachResult] = useState<AttachResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    setCandidates([]);
    setAttachResult(null);
    try {
      const res = await api.post("/admin/images/resolve", { query });
      setCandidates(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Search failed");
    }
    setSearching(false);
  };

  const handleAttach = async (candidate: ImageCandidate) => {
    if (!ticketId.trim()) {
      setError("Enter a ticket ID first");
      return;
    }
    setAttaching(candidate.fileUrl);
    setError("");
    setAttachResult(null);
    try {
      const res = await api.post("/admin/images/attach", {
        ticketId,
        sourceUrl: candidate.fileUrl,
        license: candidate.license,
        author: candidate.author,
        title: candidate.title,
        attributionHtml: candidate.attributionHtml,
      });
      setAttachResult(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Attach failed");
    }
    setAttaching(null);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Image Management</h1>

      {/* Ticket ID */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-600">
          Ticket ID (for attaching)
        </label>
        <input
          type="text"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Paste ticket UUID..."
          className="w-full max-w-md rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Wikimedia Commons (e.g. UA road sign 2.1 svg)"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {attachResult && (
        <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">
          Image attached! ID: {attachResult.imageId}, Key:{" "}
          {attachResult.storedKey}
        </div>
      )}

      {/* Candidates */}
      {candidates.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Candidates ({candidates.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((c, i) => (
              <div key={i} className="rounded-lg border p-4">
                <p className="mb-1 font-medium text-sm truncate" title={c.title}>
                  {c.title}
                </p>
                <p className="text-xs text-gray-500">
                  {c.author} &middot; {c.license} &middot; {c.width}x{c.height}
                </p>
                <a
                  href={c.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-xs text-blue-500 hover:underline"
                >
                  View on Commons
                </a>
                <button
                  onClick={() => handleAttach(c)}
                  disabled={attaching === c.fileUrl || !ticketId.trim()}
                  className="mt-3 w-full rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {attaching === c.fileUrl ? "Attaching..." : "Attach to ticket"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {candidates.length === 0 && !searching && query && (
        <p className="text-sm text-gray-500">
          No candidates found. Try a different search query.
        </p>
      )}
    </div>
  );
}
