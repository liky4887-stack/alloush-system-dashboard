import { CpoRequest, Employee } from '@/types';
import RigCard from './RigCard';
import { Users, AlertTriangle, Clock } from 'lucide-react';

export default function OverviewTab({ requests, employees, onRigClick }: { requests: CpoRequest[], employees: Employee[], onRigClick: (rig: string) => void }) {
  const totalEmployees = employees.length;
  const totalSuspended = employees.filter(e => e.is_suspended).length;
  const totalPending = requests.filter(r => r.status === 'pending').length;

  const rigStats = employees.reduce((acc, emp) => {
    const rig = emp.rig || 'غير محدد';
    if (!acc[rig]) acc[rig] = { total: 0, suspended: 0 };
    acc[rig].total++;
    if (emp.is_suspended) acc[rig].suspended++;
    return acc;
  }, {} as Record<string, { total: number, suspended: number }>);

  const sortedRigs = Object.keys(rigStats).sort();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="text-zinc-400 text-sm mb-1">إجمالي الموظفين</div>
            <div className="text-3xl font-bold text-white">{totalEmployees}</div>
          </div>
          <Users size={32} className="text-emerald-500" />
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="text-zinc-400 text-sm mb-1">الطلبات المعلقة</div>
            <div className="text-3xl font-bold text-white">{totalPending}</div>
          </div>
          <Clock size={32} className="text-amber-500" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="text-zinc-400 text-sm mb-1">الموظفين الموقوفين</div>
            <div className="text-3xl font-bold text-white">{totalSuspended}</div>
          </div>
          <AlertTriangle size={32} className="text-red-500" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-4">إحصائيات الحفارات</h3>
        {sortedRigs.length === 0 ? (
          <div className="text-zinc-500 text-center py-8">لا توجد بيانات موظفين بعد.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sortedRigs.map(rig => (
              <div 
                key={rig} 
                onClick={() => onRigClick(rig)}
                className="cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <RigCard 
                  rig={rig} 
                  total={rigStats[rig].total} 
                  suspended={rigStats[rig].suspended} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
