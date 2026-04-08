"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import api from "@/lib/api";

interface Overview {
  totalSessions: number;
  avgScore: number;
  bestScore: number;
  currentStreak: number;
  accuracyByDifficulty: Array<{
    difficulty: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  sessionsOverTime: Array<{
    date: string;
    count: number;
    avgScore: number;
  }>;
}

interface TopicStats {
  topics: Array<{
    tag: string;
    totalAnswered: number;
    correct: number;
    accuracy: number;
  }>;
  weakest: string[];
}

function StatsContent() {
  const t = useTranslations("stats");
  const tc = useTranslations("common");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topicStats, setTopicStats] = useState<TopicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/stats/overview"),
      api.get("/stats/topics"),
    ]).then(([overviewRes, topicsRes]) => {
      setOverview(overviewRes.data);
      setTopicStats(topicsRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="mt-20 text-center text-gray-500">{tc("loading")}</div>;
  }

  if (!overview || !topicStats) {
    return <div className="mt-20 text-center text-gray-500">No data</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">{t("overview")}</h1>

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t("totalSessions")} value={overview.totalSessions} />
        <StatCard label={t("avgScore")} value={`${overview.avgScore}%`} />
        <StatCard label={t("bestScore")} value={`${overview.bestScore}%`} />
        <StatCard label={t("streak")} value={overview.currentStreak} />
      </div>

      {/* Sessions over time */}
      {overview.sessionsOverTime.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">{t("overview")}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.sessionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString()}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Accuracy by topic */}
      {topicStats.topics.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">{t("byTopic")}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicStats.topics} layout="vertical">
                <XAxis type="number" domain={[0, 100]} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="tag"
                  width={120}
                  fontSize={12}
                />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weakest topics */}
      {topicStats.weakest.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">{t("weakTopics")}</h2>
          <div className="flex flex-wrap gap-2">
            {topicStats.weakest.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-amber-100 px-4 py-1 text-sm text-amber-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-blue-700">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <ProtectedRoute>
      <StatsContent />
    </ProtectedRoute>
  );
}
