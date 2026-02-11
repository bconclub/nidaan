"use client";

import { useEffect, useState } from "react";

interface Message {
  role: string;
  content: string;
  timestamp: string;
  language?: string;
}

interface TriageData {
  condition: string;
  severity: string;
  confidence: number;
  recommended_action?: string;
  specialist_needed?: string;
  red_flags?: string[];
  home_care?: string;
}

interface ConversationRow {
  id: string;
  phone_number: string;
  contact_name: string;
  messages: Message[];
  status: string;
  detected_language: string;
  last_triage: TriageData | null;
  created_at: string;
  updated_at: string;
}

const LANG_LABELS: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "bn-IN": "Bengali",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "mr-IN": "Marathi",
  "gu-IN": "Gujarati",
  "kn-IN": "Kannada",
  "ml-IN": "Malayalam",
  "pa-IN": "Punjabi",
};

export default function OverviewPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/conversations?limit=100");
      if (!res.ok) {
        const errBody = await res.text();
        setError(`API error ${res.status}: ${errBody}`);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
      } else if (data?.conversations && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      } else {
        setConversations([]);
      }
      setError(null);
    } catch (err) {
      console.error("[overview] Failed to fetch:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = conversations.filter((c) => c.status === "active").length;
  const emergencyCount = conversations.filter((c) => c.status === "emergency").length;
  const completedCount = conversations.filter((c) => c.status === "completed").length;
  const totalUserMessages = conversations.reduce((sum, c) => sum + (c.messages?.filter((m: Message) => m.role === "user").length || 0), 0);
  const totalAiMessages = conversations.reduce((sum, c) => sum + (c.messages?.filter((m: Message) => m.role === "assistant").length || 0), 0);

  // Languages breakdown
  const langCounts: Record<string, number> = {};
  conversations.forEach((c) => {
    const lang = LANG_LABELS[c.detected_language] || c.detected_language || "Unknown";
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });
  const topLanguages = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

  // Severity breakdown from triage results
  const severityCounts: Record<string, number> = { emergency: 0, urgent: 0, routine: 0 };
  conversations.forEach((c) => {
    if (c.last_triage?.severity) {
      const sev = c.last_triage.severity;
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }
  });
  const triageCount = conversations.filter((c) => c.last_triage).length;

  // Recent emergency conversations
  const recentEmergencies = conversations
    .filter((c) => c.status === "emergency" || c.last_triage?.severity === "emergency")
    .slice(0, 5);

  // Recent conversations (last 5)
  const recentConversations = conversations.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-satoshi">
            Nidaan AI — <span className="text-nidaan-teal">Overview</span>
          </h1>
          <p className="text-sm text-nidaan-muted mt-1">
            Real-time overview of patient conversations and triage results.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-nidaan-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-nidaan-teal animate-pulse" />
          Auto-refreshing every 10s
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-nidaan-emergency/30 bg-nidaan-emergency/10 px-4 py-3 text-sm text-nidaan-emergency">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-nidaan-muted">Loading...</div>
      ) : (
        <>
          {/* ─── Primary Stats ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Conversations"
              value={conversations.length}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              }
              color="text-nidaan-white"
            />
            <StatCard
              label="Active"
              value={activeCount}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              color="text-nidaan-teal"
              pulse
            />
            <StatCard
              label="Emergency"
              value={emergencyCount}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              color="text-nidaan-emergency"
              pulse={emergencyCount > 0}
            />
            <StatCard
              label="Completed"
              value={completedCount}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="text-nidaan-routine"
            />
          </div>

          {/* ─── Secondary Stats ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-white/10 bg-nidaan-card px-4 py-3">
              <p className="text-xs text-nidaan-muted mb-1">User Messages</p>
              <p className="text-xl font-bold">{totalUserMessages}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-nidaan-card px-4 py-3">
              <p className="text-xs text-nidaan-muted mb-1">AI Responses</p>
              <p className="text-xl font-bold">{totalAiMessages}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-nidaan-card px-4 py-3">
              <p className="text-xs text-nidaan-muted mb-1">Triaged</p>
              <p className="text-xl font-bold">{triageCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-nidaan-card px-4 py-3">
              <p className="text-xs text-nidaan-muted mb-1">Triage Rate</p>
              <p className="text-xl font-bold">
                {conversations.length > 0 ? Math.round((triageCount / conversations.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* ─── Two-column: Languages + Severity Breakdown ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Languages — bar chart */}
            <div className="rounded-xl border border-white/10 bg-nidaan-card px-5 py-4">
              <h3 className="text-sm font-semibold mb-4">Languages</h3>
              {topLanguages.length === 0 ? (
                <p className="text-sm text-nidaan-muted">No data yet</p>
              ) : (
                <div className="flex items-end gap-3 h-36">
                  {topLanguages.map(([lang, count]) => {
                    const maxCount = Math.max(...topLanguages.map(([, c]) => c));
                    const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const colors = [
                      "bg-nidaan-teal", "bg-nidaan-warning", "bg-nidaan-routine",
                      "bg-purple-500", "bg-blue-500", "bg-pink-500",
                      "bg-yellow-500", "bg-indigo-500", "bg-orange-500", "bg-cyan-500",
                    ];
                    const colorIdx = topLanguages.findIndex(([l]) => l === lang);
                    const barColor = colors[colorIdx % colors.length];
                    return (
                      <div key={lang} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">{count}</span>
                        <div className="w-full bg-white/5 rounded-t-md overflow-hidden relative" style={{ height: "100px" }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-md ${barColor} transition-all duration-500`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-nidaan-muted text-center leading-tight">{lang}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Severity breakdown */}
            <div className="rounded-xl border border-white/10 bg-nidaan-card px-5 py-4">
              <h3 className="text-sm font-semibold mb-3">Triage Severity</h3>
              {triageCount === 0 ? (
                <p className="text-sm text-nidaan-muted">No triage results yet</p>
              ) : (
                <div className="space-y-3">
                  <SeverityRow label="Emergency" count={severityCounts.emergency} total={triageCount} color="bg-nidaan-emergency" />
                  <SeverityRow label="Urgent" count={severityCounts.urgent} total={triageCount} color="bg-nidaan-warning" />
                  <SeverityRow label="Routine" count={severityCounts.routine} total={triageCount} color="bg-nidaan-routine" />
                </div>
              )}
            </div>
          </div>

          {/* ─── Emergency Alerts ─── */}
          {recentEmergencies.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-nidaan-emergency animate-pulse" />
                Emergency Alerts
              </h3>
              <div className="space-y-2">
                {recentEmergencies.map((conv) => (
                  <div key={conv.id} className="rounded-xl border border-nidaan-emergency/20 bg-nidaan-emergency/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nidaan-emergency/20 flex items-center justify-center text-nidaan-emergency text-sm font-bold">
                        {(conv.contact_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{conv.contact_name || conv.phone_number}</p>
                        <p className="text-xs text-nidaan-muted">
                          {conv.last_triage?.condition || "Emergency flagged"} &middot; {conv.messages?.length || 0} messages
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {conv.last_triage && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-nidaan-emergency/20 text-nidaan-emergency">
                          {Math.round(conv.last_triage.confidence * 100)}% confidence
                        </span>
                      )}
                      <p className="text-[10px] text-nidaan-muted mt-1">{timeAgo(conv.updated_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Recent Activity ─── */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Recent Conversations</h3>
            {recentConversations.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-nidaan-card p-8 text-center">
                <p className="text-nidaan-muted text-sm">No conversations yet.</p>
                <p className="text-nidaan-muted text-xs mt-1">Send a WhatsApp message to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentConversations.map((conv) => (
                  <div key={conv.id} className="rounded-xl border border-white/10 bg-nidaan-card px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        conv.status === "emergency"
                          ? "bg-nidaan-emergency/20 text-nidaan-emergency"
                          : "bg-nidaan-teal/20 text-nidaan-teal"
                      }`}>
                        {(conv.contact_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{conv.contact_name || conv.phone_number}</p>
                        <p className="text-xs text-nidaan-muted">
                          {LANG_LABELS[conv.detected_language] || conv.detected_language} &middot; {conv.messages?.filter((m: Message) => m.role === "user").length || 0} messages
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {conv.last_triage && (
                        <SeverityBadge severity={conv.last_triage.severity} />
                      )}
                      <StatusBadge status={conv.status} />
                      <span className="text-xs text-nidaan-muted min-w-[40px] text-right">{timeAgo(conv.updated_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Components ─── */

function StatCard({
  label,
  value,
  icon,
  color,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-nidaan-card px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`opacity-60 ${color}`}>{icon}</span>
        {pulse && (
          <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${
            color === "text-nidaan-emergency" ? "bg-nidaan-emergency" : "bg-nidaan-teal"
          }`} />
        )}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-nidaan-muted mt-1">{label}</p>
    </div>
  );
}

function SeverityRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-nidaan-muted w-12 text-right">{count} ({pct}%)</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-nidaan-teal/20 text-nidaan-teal",
    emergency: "bg-nidaan-emergency/20 text-nidaan-emergency",
    completed: "bg-white/10 text-nidaan-muted",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.active}`}>
      {(status === "active" || status === "emergency") && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
          status === "emergency" ? "bg-nidaan-emergency" : "bg-nidaan-teal"
        }`} />
      )}
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
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[severity] || "bg-white/10 text-nidaan-muted"}`}>
      {severity}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
