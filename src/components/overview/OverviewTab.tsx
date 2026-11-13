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

export default function OverviewTab({ requests, employees, onRigClick }: { requests: CpoRequest[], employees: Employee[], onRigClick: (rig: string) => void }) {
  const totalEmployees = employees.length;
  const totalSuspended = employees.filter(e => e.is_suspended).length;
  const totalPending = requests.filter(r => r.status === 'pending').length;

  const rigStats: Record<string, { total: number, suspended: number }> = {};
  ALL_RIGS.forEach(rig => { rigStats[rig.id] = { total: 0, suspended: 0 }; });

  employees.forEach(emp => {
    let rig = emp.rig || 'B2';
    if (rig === 'ساحة اللهيب' || rig === 'الهيب' || rig === 'laheeb' || rig === 'LAHEEB' || rig === 'لهيب') { rig = 'LAHEEB'; }
    if (rigStats[rig]) {
      rigStats[rig].total++;
      if (emp.is_suspended) rigStats[rig].suspended++;
    }
  });

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex items-center justify-between">
          <div><div className="text-[#a8a19b] text-sm mb-1">إجمالي الموظفين</div><div className="text-3xl font-bold text-[#f4f0ea]">{totalEmployees}</div></div>
          <Users size={32} className="text-[#d4b896]" />
        </div>
        <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex items-center justify-between">
          <div><div className="text-[#a8a19b] text-sm mb-1">الطلبات المعلقة</div><div className="text-3xl font-bold text-[#f4f0ea]">{totalPending}</div></div>
          <Clock size={32} className="text-amber-500" />
        </div>
        <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex items-center justify-between">
          <div><div className="text-[#a8a19b] text-sm mb-1">الموظفين الموقوفين</div><div className="text-3xl font-bold text-[#f4f0ea]">{totalSuspended}</div></div>
          <AlertTriangle size={32} className="text-red-500" />
        </div>
      </div>

      <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#f4f0ea] mb-4 flex items-center gap-2"><Users size={20} className="text-[#d4b896]" />قائمة الموظفين الكاملة</h3>
        {employees.length === 0 ? (
          <div className="text-[#a8a19b] text-sm">لا يوجد موظفين مسجلين في النظام حتى الآن.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {employees.map(emp => (
              <div key={emp.id} className="bg-[#2a241f]/50 border border-[#524a43]/50 p-2.5 rounded-lg flex justify-between items-center text-sm">
                <span className="text-[#f4f0ea] truncate pr-2">{emp.name}</span>
                <span className="text-[#a8a19b] font-mono bg-[#2a241f] px-2 py-0.5 rounded text-xs shrink-0">{emp.employee_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#f4f0ea] mb-4">إحصائيات الحفارات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ALL_RIGS.map(rig => (
            <div key={rig.id} onClick={() => onRigClick(rig.id)} className="bg-[#3a332d] border border-[#524a43] p-4 rounded-xl cursor-pointer transition-all hover:border-[#d4b896]/50 hover:bg-[#4a4038]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#d4b896] font-bold text-lg">{rig.label}</span>
                <Users size={20} className="text-[#a8a19b]" />
              </div>
              <div className="text-2xl font-bold text-[#f4f0ea]">{rigStats[rig.id].total}</div>
              <div className="text-xs text-[#a8a19b]">موظف</div>
              {rigStats[rig.id].suspended > 0 && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertTriangle size={12} /><span>{rigStats[rig.id].suspended} موقوف</span></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
