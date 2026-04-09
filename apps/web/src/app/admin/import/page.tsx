"use client";

import { useState } from "react";
import api from "@/lib/api";

interface ImportResult {
  total: number;
  created: number;
  errors: Array<{ index: number; message: string }>;
}

export default function AdminImportPage() {
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);

  const handlePreview = () => {
    setError("");
    setResult(null);
    try {
      const parsed = JSON.parse(jsonText);
      const tickets = Array.isArray(parsed) ? parsed : parsed.tickets;
      if (!Array.isArray(tickets)) {
        setError("Expected an array or { tickets: [...] }");
        return;
      }
      setPreview(tickets.length);
    } catch {
      setError("Invalid JSON");
    }
  };

  const handleImport = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonText);
      const tickets = Array.isArray(parsed) ? parsed : parsed.tickets;

      const res = await api.post("/admin/tickets/import", { tickets });
      setResult(res.data);
      setPreview(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message || axiosErr.message || "Import failed",
      );
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">Import Tickets</h1>

      <p className="mb-4 text-sm text-gray-500">
        Paste JSON array of tickets or an object with{" "}
        <code className="rounded bg-gray-100 px-1">{"{ tickets: [...] }"}</code>{" "}
        format. Each ticket must have 4 options with exactly 1 correct.
      </p>

      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          setPreview(null);
          setResult(null);
        }}
        placeholder='[{"questionRu":"...","questionUk":"...","explanationRu":"...","explanationUk":"...","pddRef":"1.1","difficulty":"EASY","tags":["signs"],"scenarioHash":"unique-hash","options":[...]}]'
        className="mb-4 h-64 w-full rounded border p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="mb-6 flex gap-3">
        <button
          onClick={handlePreview}
          disabled={!jsonText.trim()}
          className="rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
        >
          Validate
        </button>
        <button
          onClick={handleImport}
          disabled={loading || !jsonText.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </div>

      {preview !== null && (
        <div className="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-700">
          Valid JSON: {preview} tickets ready to import
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded border p-4">
          <h2 className="mb-3 text-lg font-semibold">Import Result</h2>
          <div className="mb-3 flex gap-6 text-sm">
            <span>
              Total: <strong>{result.total}</strong>
            </span>
            <span className="text-green-600">
              Created: <strong>{result.created}</strong>
            </span>
            <span className="text-red-600">
              Errors: <strong>{result.errors.length}</strong>
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {result.errors.map((err, i) => (
                <div
                  key={i}
                  className="border-t py-2 text-sm text-red-600"
                >
                  Ticket #{err.index}: {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
