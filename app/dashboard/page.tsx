import type { DashboardMetrics } from "@/types";

export default function DashboardOverview() {
  // TODO: Fetch real metrics from Supabase
  const metrics: DashboardMetrics = {
    total_conversations: 0,
    active_conversations: 0,
    triaged_today: 0,
    severity_distribution: { low: 0, moderate: 0, high: 0, critical: 0 },
    top_conditions: [],
    avg_triage_time_seconds: 0,
    language_distribution: {
      en: 0, hi: 0, bn: 0, ta: 0, te: 0, mr: 0, gu: 0, kn: 0, ml: 0, pa: 0,
    },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-clinical-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Real-time overview of Nidaan AI triage operations.
      </p>

      {/* Metric cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Conversations"
          value={metrics.total_conversations}
        />
        <MetricCard
          label="Active Now"
          value={metrics.active_conversations}
        />
        <MetricCard
          label="Triaged Today"
          value={metrics.triaged_today}
        />
        <MetricCard
          label="Avg Triage Time"
          value={`${metrics.avg_triage_time_seconds}s`}
        />
      </div>

      {/* Severity distribution */}
      <div className="mt-8 rounded-xl border border-clinical-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-clinical-800">
          Severity Distribution
        </h2>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {(Object.entries(metrics.severity_distribution) as [string, number][]).map(
            ([level, count]) => (
              <div key={level} className="text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs capitalize text-gray-500">{level}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-clinical-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-clinical-900">{value}</p>
    </div>
  );
}
