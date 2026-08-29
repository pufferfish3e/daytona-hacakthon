import { Check, Lock } from "lucide-react";
import type { SafetyCheck } from "../../types/projectDetail";

export function SafetyContextPanel({ checks }: { checks: SafetyCheck[] }) {
  return (
    <div className="border-b border-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-white/40" />
        <p className="text-[10px] font-medium text-white/40">
          Safety context
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">Locked &amp; read-only</p>
      <ul className="mt-4 space-y-2.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2.5 text-xs text-white/60">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                check.passed
                  ? "border border-emerald-500/30 bg-emerald-500/10"
                  : "border border-red-500/30 bg-red-500/10"
              }`}
            >
              <Check className={`h-2.5 w-2.5 ${check.passed ? "text-emerald-400" : "text-red-400"}`} />
            </span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
