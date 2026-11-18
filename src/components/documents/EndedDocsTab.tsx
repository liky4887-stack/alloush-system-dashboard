import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';
import { ShieldX, Calendar, HeartPulse, RotateCcw, Loader2 } from 'lucide-react';

export default function EndedDocsTab({ employees, onRefresh }: { employees: Employee[], onRefresh: () => void }) {
  const [endedEmployees, setEndedEmployees] = useState<Employee[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const ended = employees.filter(emp => emp.auth_status === 'ended');
    setEndedEmployees(ended);
  }, [employees]);

  const handleRestore = async (emp: Employee) => {
    if (!window.confirm(`هل أنت متأكد من إعادة تفعيل تصريح "${emp.name}"؟`)) return;
    setActionLoading(emp.id);
    await supabase.from('employees').update({ auth_status: 'active' }).eq('id', emp.id);
    setActionLoading(null);
    onRefresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center bg-[#2a241f] p-6 rounded-xl border border-[#524a43] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/20 p-3 rounded-lg text-red-500">
            <ShieldX size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f4f0ea]">التصاريح المنتهية</h2>
            <p className="text-sm text-[#a8a19b]">الموظفون الذين تم إنهاء تصاريحهم</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {endedEmployees.length === 0 ? (
          <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد تصاريح منتهية.</div>
        ) : (
          endedEmployees.map(emp => (
            <div key={emp.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-75">
              <div>
                <div className="font-bold text-[#f4f0ea] text-lg">{emp.name}</div>
                <div className="text-[#a8a19b] text-sm font-mono mt-1">{emp.employee_number} • {emp.rig}</div>
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-red-900/30 bg-red-900/10 text-red-400">
                  <Calendar size={18} />
                  <div className="flex flex-col">
                    <span className="text-xs opacity-80">انتهاء التصريح</span>
                    <span className="font-bold text-sm">{emp.auth_expiry_date || 'غير مسجل'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-400">
                  <HeartPulse size={18} />
                  <div className="flex flex-col">
                    <span className="text-xs opacity-80">الشهادة الصحية</span>
                    <span className="font-bold text-sm">{emp.health_cert_expiry_date || 'غير مسجل'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button onClick={() => handleRestore(emp)} disabled={actionLoading === emp.id} className="px-4 py-2 bg-[#3a332d] hover:bg-[#524a43] text-[#d4b896] border border-[#524a43] font-bold rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                  {actionLoading === emp.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} استعادة
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
