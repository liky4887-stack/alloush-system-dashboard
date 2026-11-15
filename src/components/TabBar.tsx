import { LiquidNavbar, LiquidNavItem } from '@/components/ui/liquid-glass-navbar';
import { LayoutDashboard, Users, Palmtree, UserPlus, CalendarDays, CalendarCheck } from 'lucide-react';
import type { Tab } from '@/types';

interface TabBarProps {
  active: Tab;
  onChange: (t: Tab) => void;
  isHr: boolean;
}

export default function TabBar({ active, onChange, isHr }: TabBarProps) {
  const tabItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    ...(isHr ? [{ id: 'overview' as Tab, label: 'نظرة عامة', icon: <LayoutDashboard size={18} /> }] : []),
    { id: 'employees', label: 'الموظفين', icon: <Users size={18} /> },
    { id: 'vacations', label: 'الإجازات', icon: <Palmtree size={18} /> },
    ...(isHr ? [{ id: 'ended-vacations' as Tab, label: 'المنتهية', icon: <CalendarCheck size={18} /> }] : []),
    { id: 'emp-requests', label: 'الطلبات', icon: <UserPlus size={18} /> },
    ...(isHr ? [{ id: 'admissions' as Tab, label: 'التعيينات', icon: <CalendarDays size={18} /> }] : []),
  ];

  const liquidItems: LiquidNavItem[] = tabItems.map(t => ({
    label: t.label,
    icon: t.icon,
    fx: 'pop'
  }));

  const activeIndex = tabItems.findIndex(t => t.id === active);

  return (
    <div className="flex justify-center mb-6 px-2 md:px-4 w-full">
      
      {/* 📱 Mobile View: Scrollable CSS Glass Pill (Zero WebGL, 60fps) */}
      <div className="flex md:hidden w-full overflow-x-auto py-2 px-1 gap-1 snap-x hide-scrollbar" dir="rtl">
        {tabItems.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`snap-center flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 border ${
              active === t.id
                ? 'bg-[#d4b896] text-[#2a241f] border-[#d4b896] shadow-[0_4px_12px_rgba(212,184,150,0.3)]'
                : 'bg-[#1C1815]/80 backdrop-blur-md text-[#a8a19b] border-[#524a43]/50 hover:text-[#f4f0ea]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 💻 Desktop/Tablet View: The Liquid WebGL Bar */}
      <div className="hidden md:block">
        <LiquidNavbar
          items={liquidItems}
          active={activeIndex !== -1 ? activeIndex : 0}
          onChange={(i) => onChange(tabItems[i].id)}
          tone="dark"
          sound={true}
        />
      </div>

    </div>
  );
}
