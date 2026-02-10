import type { Conversation } from "@/types";

export default function ConversationsPage() {
  // TODO: Fetch conversations from Supabase with pagination
  const conversations: Conversation[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-clinical-900">Conversations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Browse and review patient conversation logs.
      </p>

      {/* Filters */}
      <div className="mt-6 flex gap-3">
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="triaged">Triaged</option>
          <option value="referred">Referred</option>
          <option value="closed">Closed</option>
        </select>
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">All Languages</option>
          <option value="hi">Hindi</option>
          <option value="en">English</option>
          <option value="bn">Bengali</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
        </select>
      </div>

      {/* Conversations table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-clinical-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-clinical-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Language
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Chief Complaint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {conversations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  No conversations yet. They will appear here once patients
                  start interacting with Nidaan AI via WhatsApp.
                </td>
              </tr>
            ) : (
              conversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {conv.patient_id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <StatusBadge status={conv.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {conv.language}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {conv.chief_complaint ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {conv.started_at}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    awaiting_input: "bg-yellow-100 text-yellow-800",
    triaged: "bg-blue-100 text-blue-800",
    referred: "bg-purple-100 text-purple-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
