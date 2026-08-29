export function RevivedAppMock() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">Acme Dashboard</span>
        <nav className="hidden gap-4 text-xs text-gray-500 sm:flex">
          <span className="text-gray-900">Overview</span>
          <span>Reports</span>
          <span>Settings</span>
        </nav>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Active users", value: "1,284" },
            { label: "Revenue", value: "$42.8k" },
            { label: "Uptime", value: "99.2%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <p className="text-[10px] text-gray-500">{stat.label}</p>
              <p className="name-stat-number mt-1 text-xl text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Weekly activity</p>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gray-300"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
