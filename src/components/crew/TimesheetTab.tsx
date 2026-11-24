import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TimesheetRow } from '@/types';
import { Loader2, Search, Clock, User } from 'lucide-react';

interface Props {
  isHr: boolean;
  userRig: string | null;
}

export default function TimesheetTab({ isHr, userRig }: Props) {
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTimesheet = async () => {
    setLoading(true);
    let query = supabase.from('v_vacation_timesheet').select('*').order('actual_start_date', { ascending: false });
    if (!isHr && userRig) query = query.eq('rig', userRig);

    const { data, error } = await query;
    if (!error && data) {
      setRows(data as TimesheetRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimesheet();
    const channel = supabase.channel('realtime-timesheet')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacation_requests' }, () => {
        fetchTimesheet();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isHr, userRig]);

  const filtered = rows.filter(r => 
    r.employee_name.includes(search) || r.employee_number.includes(search)
  );

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#d4b896]" size={32} /></div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#2a241f] p-4 rounded-xl border border-[#524a43] gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3 text-[#a8a19b]" size={18} />
          <input type="text" placeholder="ابحث باسم الموظف أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 pr-10 pl-3 text-[#f4f0ea] focus:outline-none focus:border-[#d4b896]" />
        </div>
      </div>

      <div className="bg-[#3a332d] border border-[#524a43] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-[#2a241f] text-[#d4b896] border-b border-[#524a43]">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">الموظف</th>
                <th className="px-6 py-4 font-bold tracking-wider">الحفارة</th>
                <th className="px-6 py-4 font-bold tracking-wider">تاريخ الخروج</th>
                <th className="px-6 py-4 font-bold tracking-wider">تاريخ الرجوع</th>
                <th className="px-6 py-4 font-bold tracking-wider">أيام الأجازة</th>
                <th className="px-6 py-4 font-bold tracking-wider">أيام الحفارة (السابقة)</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#524a43]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#a8a19b]">لا توجد سجلات مطابقة.</td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.id} className="bg-[#2a241f] hover:bg-[#4a4038] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-[#f4f0ea] font-bold">{row.employee_name}</div>
                      <div className="text-[#a8a19b] text-xs font-mono">{row.employee_number}</div>
                    </td>
                    <td className="px-6 py-4 text-[#d4b896]">{row.rig}</td>
                    <td className="px-6 py-4 text-[#a8a19b] font-mono">{row.actual_start_date}</td>
                    <td className="px-6 py-4 text-[#a8a19b] font-mono">{row.actual_end_date || 'مستمر'}</td>
                    <td className="px-6 py-4 text-[#f4f0ea] font-bold">{row.vacation_days} يوم</td>
                    <td className="px-6 py-4 text-[#a8a19b]">{row.rig_days_before !== null ? `${row.rig_days_before} يوم` : '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {row.is_currently_on_vacation ? (
                        <span className="inline-flex items-center gap-1 bg-amber-900/20 text-amber-500 border border-amber-900/30 px-2.5 py-1 rounded-md text-xs font-bold">
                          <Clock size={12} /> في أجازة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-900/20 text-emerald-400 border border-emerald-900/30 px-2.5 py-1 rounded-md text-xs font-bold">
                          <User size={12} /> في الحفارة
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
