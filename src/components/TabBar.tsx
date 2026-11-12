import type { Tab } from '@/types';

interface TabBarProps {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',    label: 'نظرة عامة' },
  { id: 'crew-change', label: 'طلبات الكرو تشينج' },
  { id: 'employees',   label: 'موظفو الحفارات' },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="flex justify-center mb-6 px-4">
      <div
        className="inline-flex gap-1 p-1 rounded-xl bg-zinc-800/70 border border-zinc-700/50 backdrop-blur"
        dir="rtl"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={"
              relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${active === t.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
              }
            "}
          >
            {t.label}
            {active === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-px bg-emerald-400/50 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
