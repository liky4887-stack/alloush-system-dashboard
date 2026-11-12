import type { Rig } from '@/types';

interface RigCardProps {
  rig: Rig;
}

export default function RigCard({ rig }: RigCardProps) {
  return (
    <div className="group relative flex flex-col items-end gap-1 p-4 rounded-xl border border-zinc-700/50 bg-zinc-800/60 hover:bg-zinc-700/60 hover:border-emerald-700/40 transition-all duration-200 cursor-default overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/0 group-hover:from-emerald-900/15 to-transparent transition-all duration-300 pointer-events-none" />
      <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight leading-none">
        {rig.total}
      </span>
      <span className="text-xs font-semibold text-zinc-300">{rig.label}</span>
      {rig.suspended > 0 && (
        <span className="text-[10px] text-amber-400/80">
          {rig.suspended} موقوف
        </span>
      )}
    </div>
  );
}
