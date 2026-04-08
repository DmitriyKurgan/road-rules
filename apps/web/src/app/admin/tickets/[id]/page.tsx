"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

interface TicketOption {
  id: string;
  textRu: string;
  textUk: string;
  isCorrect: boolean;
  order: number;
}

interface TicketDetail {
  id: string;
  questionRu: string;
  questionUk: string;
  explanationRu: string;
  explanationUk: string;
  pddRef: string;
  difficulty: string;
  status: string;
  tags: string[];
  scenarioHash: string;
  imageBrief: string | null;
  options: TicketOption[];
  images: Array<{
    id: string;
    role: string;
    image: {
      id: string;
      storedKey: string;
      title: string;
      license: string;
      attributionHtml: string;
    };
  }>;
}

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/admin/tickets/${params.id}`)
      .then((res) => {
        setTicket(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [params.id]);

  const handlePublish = async () => {
    if (!ticket) return;
    try {
      await api.post(`/admin/tickets/${ticket.id}/publish`);
      setTicket({ ...ticket, status: "PUBLISHED" });
    } catch {}
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!ticket) return <div className="text-red-600">Ticket not found</div>;

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ticket: {ticket.pddRef}</h1>
        <div className="flex gap-2">
          {ticket.status === "DRAFT" && (
            <button
              onClick={handlePublish}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              Publish
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Status & meta */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            ticket.status === "PUBLISHED"
              ? "bg-green-100 text-green-700"
              : ticket.status === "DRAFT"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          {ticket.status}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            ticket.difficulty === "EASY"
              ? "bg-green-100 text-green-700"
              : ticket.difficulty === "HARD"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {ticket.difficulty}
        </span>
        {ticket.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Question */}
      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-500">
          Question (RU)
        </h2>
        <p className="mb-4">{ticket.questionRu}</p>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">
          Question (UK)
        </h2>
        <p>{ticket.questionUk}</p>
      </div>

      {/* Options */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">Options</h2>
        <div className="space-y-2">
          {ticket.options.map((opt) => (
            <div
              key={opt.id}
              className={`rounded-lg border-2 p-3 ${
                opt.isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400">
                  {String.fromCharCode(64 + opt.order)}
                </span>
                <span>{opt.textRu}</span>
                {opt.isCorrect && (
                  <span className="ml-auto text-green-600">&#10003; Correct</span>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-500">{opt.textUk}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-500">
          Explanation (RU)
        </h2>
        <p className="mb-4 text-sm">{ticket.explanationRu}</p>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">
          Explanation (UK)
        </h2>
        <p className="text-sm">{ticket.explanationUk}</p>
      </div>

      {/* Images */}
      {ticket.images.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">Images</h2>
          {ticket.images.map((ti) => (
            <div key={ti.id} className="rounded-lg border p-3">
              <p className="text-sm">
                <strong>{ti.image.title}</strong> ({ti.role})
              </p>
              <p className="text-xs text-gray-500">{ti.image.license}</p>
              <p className="text-xs text-gray-400">
                {ti.image.attributionHtml}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-gray-400">
        <p>ID: {ticket.id}</p>
        <p>Scenario Hash: {ticket.scenarioHash}</p>
        {ticket.imageBrief && <p>Image Brief: {ticket.imageBrief}</p>}
      </div>
    </div>
  );
}
