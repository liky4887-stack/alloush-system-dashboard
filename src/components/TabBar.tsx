import type { Tab } from '@/types';

interface TabBarProps {
  active: Tab;
  onChange: (t: Tab) => void;
  isHr: boolean;
}

export default function TabBar({ active, onChange, isHr }: TabBarProps) {
  const TABS: { id: Tab; label: string }[] = [
    ...(isHr ? [{ id: 'overview' as Tab, label: 'نظرة عامة' }] : []),
    { id: 'employees', label: 'موظفو الحفارات' },
    { id: 'vacations', label: 'طلبات الإجازات' },
    ...(isHr ? [{ id: 'crew-change' as Tab, label: 'طلبات الكرو تشينج' }] : []),
  ];

  return (
    <div className="flex justify-center mb-6 px-4">
      <div className="inline-flex gap-1 p-1 rounded-xl bg-zinc-800/70 border border-zinc-700/50 backdrop-blur" dir="rtl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              "relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap " +
              (active === t.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50')
            }
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
