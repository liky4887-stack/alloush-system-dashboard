import { RIGS } from '@/data/mock';
import RigCard from './RigCard';

const TOTAL_EMPLOYEES = RIGS.reduce((s, r) => s + r.total, 0);
const TOTAL_SUSPENDED = RIGS.reduce((s, r) => s + r.suspended, 0);

interface OverviewTabProps {
  pendingCount: number;
}

export default function OverviewTab({ pendingCount }: OverviewTabProps) {
  return (
    <div className="space-y-4" dir="rtl">
      {/* Hero stat card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-end gap-2">
          <span className="text-6xl font-extrabold text-white tabular-nums tracking-tight">
            {TOTAL_EMPLOYEES.toLocaleString('ar-EG')}
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
            <span>إجمالي الموظفين</span>
            <span className="text-zinc-600">·</span>
            <span>
              الموقوفون <span className="text-amber-400 font-semibold">{TOTAL_SUSPENDED}</span>
            </span>
            <span className="text-zinc-600">·</span>
            <span>
              طلبات معلّقة <span className="text-emerald-400 font-semibold">{pendingCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rig grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {RIGS.map((rig) => (
          <RigCard key={rig.id} rig={rig} />
        ))}
      </div>
    </div>
  );
}
