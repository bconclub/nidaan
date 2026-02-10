export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-clinical-200 bg-white px-4 py-6">
        <h2 className="text-xl font-bold text-clinical-900">
          Nidaan <span className="text-medical">AI</span>
        </h2>
        <nav className="mt-8 space-y-2">
          <NavLink href="/dashboard" label="Overview" />
          <NavLink href="/dashboard/conversations" label="Conversations" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-medical-light p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-clinical-50 hover:text-clinical-800 transition-colors"
    >
      {label}
    </a>
  );
}
