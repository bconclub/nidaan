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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/conversations?${params}`);
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-satoshi">Conversations</h1>
          <p className="mt-1 text-sm text-nidaan-muted">
            Browse and review patient conversation logs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-nidaan-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-nidaan-teal animate-pulse" />
          Live
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-nidaan-card px-3 py-2 text-sm text-nidaan-white focus:border-nidaan-teal focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-12 text-center text-nidaan-muted">Loading...</div>
      ) : (
        <div className="mt-6 space-y-3">
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-nidaan-card p-12 text-center">
              <p className="text-nidaan-muted">
                No conversations yet. They will appear here once patients start interacting via WhatsApp.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="rounded-xl border border-white/10 bg-nidaan-card overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-nidaan-teal/20 flex items-center justify-center text-nidaan-teal font-bold">
                      {(conv.contact_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{conv.contact_name || "Unknown"}</p>
                      <p className="text-xs text-nidaan-muted mt-0.5">
                        {conv.phone_number} &middot; {conv.detected_language} &middot; {conv.messages.length} messages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {conv.last_triage && (
                      <SeverityBadge severity={conv.last_triage.severity} />
                    )}
                    <StatusBadge status={conv.status} />
                    <span className="text-xs text-nidaan-muted min-w-[60px] text-right">
                      {timeAgo(conv.updated_at)}
                    </span>
                    <svg
                      className={`w-4 h-4 text-nidaan-muted transition-transform ${expandedId === conv.id ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded conversation thread */}
                {expandedId === conv.id && (
                  <div className="border-t border-white/10 px-5 py-4">
                    {/* Triage result */}
                    {conv.last_triage && (
                      <div className="mb-4 rounded-lg bg-white/5 p-4">
                        <h3 className="text-sm font-semibold text-nidaan-teal mb-2">Triage Result</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-nidaan-muted">Condition:</span>{" "}
                            <span className="font-medium">{conv.last_triage.condition}</span>
                          </div>
                          <div>
                            <span className="text-nidaan-muted">Severity:</span>{" "}
                            <SeverityBadge severity={conv.last_triage.severity} />
                          </div>
                          <div>
                            <span className="text-nidaan-muted">Confidence:</span>{" "}
                            <span className="font-medium">{Math.round(conv.last_triage.confidence * 100)}%</span>
                          </div>
                          {conv.last_triage.specialist_needed && (
                            <div>
                              <span className="text-nidaan-muted">Specialist:</span>{" "}
                              <span className="font-medium">{conv.last_triage.specialist_needed}</span>
                            </div>
                          )}
                          {conv.last_triage.recommended_action && (
                            <div className="col-span-2">
                              <span className="text-nidaan-muted">Action:</span>{" "}
                              <span>{conv.last_triage.recommended_action}</span>
                            </div>
                          )}
                          {conv.last_triage.red_flags && conv.last_triage.red_flags.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-nidaan-muted">Red Flags:</span>{" "}
                              <span className="text-nidaan-emergency">{conv.last_triage.red_flags.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Messages thread */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {conv.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                              msg.role === "user"
                                ? "bg-white/10 text-nidaan-white"
                                : "bg-nidaan-teal/20 text-nidaan-teal"
                            }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-60">
                              {msg.role === "user" ? "Patient" : "Nidaan AI"}
                              {msg.language && ` (${msg.language})`}
                            </p>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[10px] mt-1 opacity-40">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
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
