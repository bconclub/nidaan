"use client";

import { useEffect, useState } from "react";

interface ConversationRow {
  id: string;
  phone_number: string;
  contact_name: string;
  messages: { role: string; content: string; timestamp: string; language?: string }[];
  status: string;
  detected_language: string;
  last_triage: {
    condition: string;
    severity: string;
    confidence: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardOverview() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/conversations?limit=100");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const activeCount = conversations.filter((c) => c.status === "active").length;
  const completedCount = conversations.filter((c) => c.status === "completed").length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);

  // Severity breakdown from completed conversations
  const severityCounts = { emergency: 0, urgent: 0, routine: 0 };
  conversations.forEach((c) => {
    if (c.last_triage?.severity) {
      const s = c.last_triage.severity as keyof typeof severityCounts;
      if (s in severityCounts) severityCounts[s]++;
    }
  });

  // Language distribution
  const langCounts: Record<string, number> = {};
  conversations.forEach((c) => {
    const lang = c.detected_language || "en-IN";
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-satoshi">Dashboard</h1>
          <p className="mt-1 text-sm text-nidaan-muted">
            Real-time overview of Nidaan AI triage operations.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-nidaan-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-nidaan-teal animate-pulse" />
          Auto-refreshing every 10s
        </div>
      </div>

      {loading ? (
        <div className="mt-12 text-center text-nidaan-muted">Loading...</div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Conversations" value={conversations.length} />
            <MetricCard label="Active Now" value={activeCount} color="teal" />
            <MetricCard label="Completed" value={completedCount} color="green" />
            <MetricCard label="Total Messages" value={totalMessages} />
          </div>

          {/* Severity distribution */}
          <div className="mt-8 rounded-xl border border-white/10 bg-nidaan-card p-6">
            <h2 className="text-lg font-semibold">Triage Severity</h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <SeverityCard label="Emergency" count={severityCounts.emergency} color="bg-nidaan-emergency" />
              <SeverityCard label="Urgent" count={severityCounts.urgent} color="bg-nidaan-warning" />
              <SeverityCard label="Routine" count={severityCounts.routine} color="bg-nidaan-routine" />
            </div>
          </div>

          {/* Language distribution */}
          <div className="mt-6 rounded-xl border border-white/10 bg-nidaan-card p-6">
            <h2 className="text-lg font-semibold">Languages Detected</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(langCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => (
                  <div
                    key={lang}
                    className="rounded-lg bg-white/5 px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-nidaan-teal">{lang}</span>
                    <span className="ml-2 text-nidaan-muted">{count}</span>
                  </div>
                ))}
              {Object.keys(langCounts).length === 0 && (
                <p className="text-sm text-nidaan-muted">No conversations yet.</p>
              )}
            </div>
          </div>

          {/* Recent conversations */}
          <div className="mt-6 rounded-xl border border-white/10 bg-nidaan-card p-6">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              {conversations.slice(0, 5).map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-nidaan-teal/20 flex items-center justify-center text-nidaan-teal text-xs font-bold">
                      {(conv.contact_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{conv.contact_name || conv.phone_number}</p>
                      <p className="text-xs text-nidaan-muted">
                        {conv.messages.length} messages &middot; {conv.detected_language}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {conv.last_triage && (
                      <SeverityBadge severity={conv.last_triage.severity} />
                    )}
                    <StatusBadge status={conv.status} />
                    <span className="text-xs text-nidaan-muted">
                      {timeAgo(conv.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-nidaan-muted text-center py-8">
                  No conversations yet. Send a WhatsApp message to get started.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  const valueColor =
    color === "teal"
      ? "text-nidaan-teal"
      : color === "green"
      ? "text-nidaan-routine"
      : "text-nidaan-white";

  return (
    <div className="rounded-xl border border-white/10 bg-nidaan-card p-5">
      <p className="text-sm text-nidaan-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function SeverityCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`inline-block w-3 h-3 rounded-full ${color} mb-2`} />
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-nidaan-muted">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-nidaan-teal/20 text-nidaan-teal"
          : "bg-white/10 text-nidaan-muted"
      }`}
    >
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-nidaan-teal mr-1.5 animate-pulse" />}
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    emergency: "bg-nidaan-emergency/20 text-nidaan-emergency",
    urgent: "bg-nidaan-warning/20 text-nidaan-warning",
    routine: "bg-nidaan-routine/20 text-nidaan-routine",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[severity] || "bg-white/10 text-nidaan-muted"
      }`}
    >
      {severity}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
