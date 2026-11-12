import { CpoRequest, Employee } from '@/types';
import RigCard from './RigCard';
import { Users, AlertTriangle, Clock } from 'lucide-react';

const ALL_RIGS = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11'];

export default function OverviewTab({ 
  requests, 
  employees, 
  onRigClick 
}: { 
  requests: CpoRequest[], 
  employees: Employee[], 
  onRigClick: (rig: string) => void 
}) {
  const totalEmployees = employees.length;
  const totalSuspended = employees.filter(e => e.is_suspended).length;
  const totalPending = requests.filter(r => r.status === 'pending').length;

  // Initialize with all rigs so they always show up
  const rigStats: Record<string, { total: number, suspended: number }> = {};
  ALL_RIGS.forEach(rig => {
    rigStats[rig] = { total: 0, suspended: 0 };
  });

  // Populate with live data
  employees.forEach(emp => {
    const rig = emp.rig || 'B2'; // fallback if null
    if (rigStats[rig]) {
      rigStats[rig].total++;
      if (emp.is_suspended) rigStats[rig].suspended++;
    }
  });

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Stats */}
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

      {/* Master Employee List (Names & IDs) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-emerald-500" />
          قائمة الموظفين الكاملة
        </h3>
        {employees.length === 0 ? (
          <div className="text-zinc-500 text-sm">لا يوجد موظفين مسجلين في النظام حتى الآن.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
            {employees.map(emp => (
              <div key={emp.id} className="bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg flex justify-between items-center text-sm">
                <span className="text-zinc-200">{emp.name}</span>
                <span className="text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded">{emp.employee_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rig Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-4">إحصائيات الحفارات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ALL_RIGS.map(rig => (
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
      </div>
    </div>
  );
}
