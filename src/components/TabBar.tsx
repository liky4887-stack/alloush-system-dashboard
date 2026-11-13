import { LiquidNavbar, LiquidNavItem } from '@/components/ui/liquid-glass-navbar';
import { LayoutDashboard, Users, Palmtree, UserPlus } from 'lucide-react';
import type { Tab } from '@/types';

interface TabBarProps {
  active: Tab;
  onChange: (t: Tab) => void;
  isHr: boolean;
}

export default function TabBar({ active, onChange, isHr }: TabBarProps) {
  const tabItems: { id: Tab; item: LiquidNavItem }[] = [
    ...(isHr ? [{ id: 'overview' as Tab, item: { label: 'نظرة عامة', icon: <LayoutDashboard size={18} />, fx: 'glow' as const } }] : []),
    { id: 'employees', item: { label: 'الموظفين', icon: <Users size={18} />, fx: 'pop' as const } },
    { id: 'vacations', item: { label: 'الإجازات', icon: <Palmtree size={18} />, fx: 'drop' as const } },
    { id: 'emp-requests', item: { label: 'الطلبات', icon: <UserPlus size={18} />, fx: 'wave' as const } },
  ];

  const items = tabItems.map(t => t.item);
  const activeIndex = tabItems.findIndex(t => t.id === active);

  return (
    <div className="flex justify-center mb-6 px-4">
      <LiquidNavbar
        items={items}
        active={activeIndex !== -1 ? activeIndex : 0}
        onChange={(i) => onChange(tabItems[i].id)}
        tone="dark"
        sound={true}
      />
    </div>
  );
}
