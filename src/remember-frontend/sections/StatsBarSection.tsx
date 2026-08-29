const METRICS = [
  { value: "2,400+", label: "Repos revived" },
  { value: "847", label: "Sandboxes spun up" },
  { value: "12min", label: "Avg. rebuild time" },
  { value: "99.2%", label: "Audit coverage" },
] as const;

export function StatsBarSection() {
  return (
    <section className="border-y border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric, index) => (
          <div
            key={metric.label}
            className={`px-6 py-10 text-center ${
              index % 2 === 0 ? "border-r border-white/10" : ""
            } ${index < 2 ? "border-b border-white/10 lg:border-b-0" : ""} ${
              index < 3 ? "lg:border-r lg:border-white/10" : ""
            }`}
          >
            <p className="name-stat-number text-2xl tracking-tight text-white sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-white/50 sm:text-sm">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
