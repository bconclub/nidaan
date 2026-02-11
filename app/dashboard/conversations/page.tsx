"use client";

import { useEffect, useState } from "react";

interface Message {
  role: string;
  content: string;
  original_text?: string;
  english_text?: string;
  timestamp: string;
  language?: string;
  audio_url?: string;
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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/conversations?${params}`);
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
      console.error("[conversations] Failed to fetch:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  const activeCount = conversations.filter((c) => c.status === "active").length;
  const emergencyCount = conversations.filter((c) => c.status === "emergency").length;
  const completedCount = conversations.filter((c) => c.status === "completed").length;

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold font-satoshi">
            Nidaan AI — <span className="text-nidaan-teal">Conversations</span>
          </h1>
          <p className="text-sm text-nidaan-muted mt-1">
            {conversations.length} conversations &middot; {activeCount} active &middot; {emergencyCount} emergency &middot; {completedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-nidaan-card px-3 py-1.5 text-xs text-nidaan-white focus:border-nidaan-teal focus:outline-none"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="emergency">Emergency</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex items-center gap-2 text-xs text-nidaan-muted">
            <span className="inline-block w-2 h-2 rounded-full bg-nidaan-teal animate-pulse" />
            Live
          </div>
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
        <div className="flex gap-4 h-[calc(100%-5rem)]">
          {/* Left panel: conversation list */}
          <div className="w-96 flex-shrink-0 overflow-y-auto space-y-2 pr-2">
            {conversations.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-nidaan-card p-8 text-center">
                <p className="text-nidaan-muted text-sm">No conversations yet.</p>
                <p className="text-nidaan-muted text-xs mt-1">Send a WhatsApp message to get started.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                    selectedId === conv.id
                      ? "border-nidaan-teal/50 bg-nidaan-teal/10"
                      : "border-white/10 bg-nidaan-card hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        conv.status === "emergency"
                          ? "bg-nidaan-emergency/20 text-nidaan-emergency"
                          : "bg-nidaan-teal/20 text-nidaan-teal"
                      }`}>
                        {(conv.contact_name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {conv.contact_name || conv.phone_number}
                        </p>
                        <p className="text-xs text-nidaan-muted truncate mt-0.5">
                          {conv.messages?.[conv.messages.length - 1]?.content?.slice(0, 50) || "No messages"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <span className="text-[10px] text-nidaan-muted">{timeAgo(conv.updated_at)}</span>
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={conv.status} />
                        <span className="text-[10px] text-nidaan-muted">
                          {LANG_LABELS[conv.detected_language] || conv.detected_language}
                        </span>
                        <span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5 text-nidaan-muted">
                          {conv.messages?.filter((m: Message) => m.role === "user").length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Right panel: selected conversation */}
          <div className="flex-1 rounded-xl border border-white/10 bg-nidaan-card overflow-hidden flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-nidaan-muted">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">Select a conversation to view</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      selected.status === "emergency"
                        ? "bg-nidaan-emergency/20 text-nidaan-emergency"
                        : "bg-nidaan-teal/20 text-nidaan-teal"
                    }`}>
                      {(selected.contact_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{selected.contact_name || "Unknown"}</p>
                      <p className="text-xs text-nidaan-muted">
                        {selected.phone_number} &middot; {LANG_LABELS[selected.detected_language] || selected.detected_language} &middot; {selected.messages?.filter((m: Message) => m.role === "user").length || 0} messages
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Triage result card */}
                {selected.last_triage && (
                  <div className="mx-5 mt-4 rounded-lg bg-white/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityDot severity={selected.last_triage.severity} />
                      <h3 className="text-sm font-semibold">
                        {selected.last_triage.condition}
                      </h3>
                      <SeverityBadge severity={selected.last_triage.severity} />
                      <span className="text-xs text-nidaan-muted ml-auto">
                        {Math.round(selected.last_triage.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      {selected.last_triage.recommended_action && (
                        <div className="col-span-2">
                          <span className="text-nidaan-muted">Action: </span>
                          <span>{selected.last_triage.recommended_action}</span>
                        </div>
                      )}
                      {selected.last_triage.specialist_needed && (
                        <div>
                          <span className="text-nidaan-muted">Specialist: </span>
                          <span>{selected.last_triage.specialist_needed}</span>
                        </div>
                      )}
                      {selected.last_triage.home_care && (
                        <div className="col-span-2">
                          <span className="text-nidaan-muted">Home Care: </span>
                          <span>{selected.last_triage.home_care}</span>
                        </div>
                      )}
                      {selected.last_triage.red_flags && selected.last_triage.red_flags.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-nidaan-muted">Red Flags: </span>
                          <span className="text-nidaan-emergency">{selected.last_triage.red_flags.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages thread */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {(selected.messages || []).map((msg, i) => {
                    const audioKey = `${selected.id}-${i}`;
                    const isPlaying = playingAudio === audioKey;
                    const isLoadingAudio = audioLoading === audioKey;

                    return (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-white/10"
                              : "bg-nidaan-teal/15"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${
                              msg.role === "user" ? "text-nidaan-white" : "text-nidaan-teal"
                            }`}>
                              {msg.role === "user" ? "Patient" : "Nidaan AI"}
                            </span>
                            {msg.language && (
                              <span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5 text-nidaan-muted">
                                {LANG_LABELS[msg.language] || msg.language}
                              </span>
                            )}
                            {msg.audio_url && (
                              <span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5 text-nidaan-muted">
                                voice
                              </span>
                            )}
                          </div>

                          {/* Audio player */}
                          {msg.audio_url && (
                            <div className="mb-2">
                              <button
                                onClick={() => {
                                  if (isPlaying) {
                                    // Stop playing
                                    const audioEl = document.getElementById(`audio-${audioKey}`) as HTMLAudioElement;
                                    if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
                                    setPlayingAudio(null);
                                  } else {
                                    // Start playing via proxy
                                    setAudioLoading(audioKey);
                                    const proxyUrl = `/api/media?url=${encodeURIComponent(msg.audio_url!)}`;
                                    const audioEl = document.getElementById(`audio-${audioKey}`) as HTMLAudioElement;
                                    if (audioEl) {
                                      audioEl.src = proxyUrl;
                                      audioEl.play()
                                        .then(() => { setPlayingAudio(audioKey); setAudioLoading(null); })
                                        .catch(() => { setAudioLoading(null); });
                                    }
                                  }
                                }}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                  isPlaying
                                    ? "bg-nidaan-teal/30 text-nidaan-teal"
                                    : "bg-white/10 text-nidaan-muted hover:bg-white/15 hover:text-nidaan-white"
                                }`}
                              >
                                {isLoadingAudio ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : isPlaying ? (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                )}
                                {isLoadingAudio ? "Loading..." : isPlaying ? "Pause" : "Play audio"}
                              </button>
                              <audio
                                id={`audio-${audioKey}`}
                                preload="none"
                                onEnded={() => setPlayingAudio(null)}
                                onError={() => { setPlayingAudio(null); setAudioLoading(null); }}
                              />
                            </div>
                          )}

                          {/* Native language text (what user sent / what AI replied in their language) */}
                          {msg.original_text && msg.original_text !== msg.english_text ? (
                            <>
                              <p className="text-sm mb-1">{msg.original_text}</p>
                              <p className="text-xs text-nidaan-muted italic">
                                {msg.english_text || msg.content}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm">{msg.english_text || msg.content}</p>
                          )}

                          <p className="text-[10px] text-nidaan-muted mt-2 opacity-50">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helper Components ─── */

function StatusDot({ status }: { status: string }) {
  const color =
    status === "emergency" ? "bg-nidaan-emergency" :
    status === "active" ? "bg-nidaan-teal" :
    "bg-nidaan-muted";

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} ${
      status === "active" || status === "emergency" ? "animate-pulse" : ""
    }`} />
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const color =
    severity === "emergency" ? "bg-nidaan-emergency" :
    severity === "urgent" ? "bg-nidaan-warning" :
    "bg-nidaan-routine";

  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-nidaan-teal/20 text-nidaan-teal",
    emergency: "bg-nidaan-emergency/20 text-nidaan-emergency",
    completed: "bg-white/10 text-nidaan-muted",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status] || styles.active}`}>
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
