import { CpoRequest, Employee } from '@/types';
import { Users, AlertTriangle, Clock } from 'lucide-react';

const ALL_RIGS = [
  { id: 'B2', label: 'B2' },
  { id: 'B3', label: 'B3' },
  { id: 'B5', label: 'B5' },
  { id: 'B6', label: 'B6' },
  { id: 'B7', label: 'B7' },
  { id: 'B8', label: 'B8' },
  { id: 'B9', label: 'B9' },
  { id: 'B10', label: 'B10' },
  { id: 'B11', label: 'B11' },
  { id: 'LAHEEB', label: 'ساحة اللهيب' },
];

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

  const rigStats: Record<string, { total: number, suspended: number }> = {};
  ALL_RIGS.forEach(rig => {
    rigStats[rig.id] = { total: 0, suspended: 0 };
  });

  employees.forEach(emp => {
    let rig = emp.rig || 'B2';
    if (rig === 'ساحة اللهيب' || rig === 'الهيب' || rig === 'laheeb' || rig === 'LAHEEB' || rig === 'لهيب') {
      rig = 'LAHEEB';
    }
    
    if (rigStats[rig]) {
      rigStats[rig].total++;
      if (emp.is_suspended) rigStats[rig].suspended++;
    }
  });

  return (
    <div className="space-y-8" dir="rtl">
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-emerald-500" />
          قائمة الموظفين الكاملة
        </h3>
        {employees.length === 0 ? (
          <div className="text-zinc-500 text-sm">لا يوجد موظفين مسجلين في النظام حتى الآن. قم باستيراد ملف الإكسل.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {employees.map(emp => (
              <div key={emp.id} className="bg-zinc-800/50 border border-zinc-700/50 p-2.5 rounded-lg flex justify-between items-center text-sm">
                <span className="text-zinc-200 truncate pr-2">{emp.name}</span>
                <span className="text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs shrink-0">{emp.employee_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-zinc-100 mb-4">إحصائيات الحفارات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ALL_RIGS.map(rig => (
            <div 
              key={rig.id} 
              onClick={() => onRigClick(rig.id)}
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-zinc-800/50"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-emerald-500 font-bold text-lg">{rig.label}</span>
                <Users size={20} className="text-zinc-600" />
              </div>
              <div className="text-2xl font-bold text-white">{rigStats[rig.id].total}</div>
              <div className="text-xs text-zinc-500">موظف</div>
              {rigStats[rig.id].suspended > 0 && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-2">
                  <AlertTriangle size={12} />
                  <span>{rigStats[rig.id].suspended} موقوف</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
