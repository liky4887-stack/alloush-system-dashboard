import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CrewChangeRow } from '@/types';
import { Loader2, PlaneLanding, PlaneTakeoff, CalendarDays } from 'lucide-react';

interface Props {
  isHr: boolean;
  userRig: string | null;
  onRefresh: () => void;
}

export default function CrewChangeTab({ isHr, userRig, onRefresh }: Props) {
  const [rows, setRows] = useState<CrewChangeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCrewChange = async () => {
    setLoading(true);
    let query = supabase.from('v_crew_change').select('*').order('start_date', { ascending: true });
    if (!isHr && userRig) query = query.eq('rig', userRig);

    const { data, error } = await query;
    if (!error && data) {
      setRows(data as CrewChangeRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCrewChange();
    const channel = supabase.channel('realtime-crew-change')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacation_requests' }, () => {
        fetchCrewChange();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isHr, userRig]);

  const handleSignOff = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من تسجيل خروج الموظف للحفارة (بداية الأجازة)؟')) return;
    setActionLoading(id);
    const { error } = await supabase.rpc('hr_sign_off_vacation', { p_request_id: id });
    setActionLoading(null);
    if (error) alert(error.message);
    else { fetchCrewChange(); onRefresh(); }
  };

  const handleSignOn = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من تسجيل رجوع الموظف للحفارة (نهاية الأجازة)؟')) return;
    setActionLoading(id);
    const { error } = await supabase.rpc('hr_sign_on_vacation', { p_request_id: id });
    setActionLoading(null);
    if (error) alert(error.message);
    else { fetchCrewChange(); onRefresh(); }
  };

  const departures = rows.filter(r => r.phase === 'upcoming_departure');
  const returns = rows.filter(r => r.phase === 'on_vacation');

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#d4b896]" size={32} /></div>;

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#3a332d] border border-[#524a43] rounded-xl overflow-hidden shadow-lg">
          <div className="bg-[#2a241f] px-6 py-4 border-b border-[#524a43] flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#f4f0ea] flex items-center gap-2">
              <PlaneTakeoff className="text-amber-500" />
              قريب ينزل أجازة (في الحفارة)
            </h2>
            <span className="bg-amber-900/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-900/50">{departures.length} موظف</span>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {departures.length === 0 ? (
              <div className="text-center text-[#a8a19b] py-8">لا يوجد موظفين مجدولين للنزول حالياً.</div>
            ) : (
              departures.map(req => (
                <div key={req.id} className="bg-[#2a241f] p-4 rounded-lg border border-[#524a43] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#f4f0ea]">{req.employee_name}</div>
                    <div className="text-sm text-[#a8a19b] font-mono">{req.employee_number} • {req.rig}</div>
                    <div className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <CalendarDays size={14} />
                      {req.start_date ? `تاريخ الخروج: ${req.start_date}` : 'لم يتم تحديد تاريخ'}
                    </div>
                  </div>
                  {isHr && (
                    <button onClick={() => handleSignOff(req.id)} disabled={actionLoading === req.id} className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 border border-amber-600/50 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
                      {actionLoading === req.id ? <Loader2 className="animate-spin" size={16} /> : 'تأكيد الخروج'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#3a332d] border border-[#524a43] rounded-xl overflow-hidden shadow-lg">
          <div className="bg-[#2a241f] px-6 py-4 border-b border-[#524a43] flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#f4f0ea] flex items-center gap-2">
              <PlaneLanding className="text-emerald-500" />
              قريب يرجع من الأجازة (للحفارة)
            </h2>
            <span className="bg-emerald-900/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-900/50">{returns.length} موظف</span>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {returns.length === 0 ? (
              <div className="text-center text-[#a8a19b] py-8">لا يوجد موظفين في أجازة حالياً.</div>
            ) : (
              returns.map(req => (
                <div key={req.id} className="bg-[#2a241f] p-4 rounded-lg border border-[#524a43] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#f4f0ea]">{req.employee_name}</div>
                    <div className="text-sm text-[#a8a19b] font-mono">{req.employee_number} • {req.rig}</div>
                    <div className="text-xs text-emerald-400 mt-2 flex flex-col gap-1">
                      <span className="flex items-center gap-1"><CalendarDays size={14} /> خرج: {req.actual_start_date}</span>
                      <span>قعد: {req.days_on_vacation} يوم</span>
                    </div>
                  </div>
                  {isHr && (
                    <button onClick={() => handleSignOn(req.id)} disabled={actionLoading === req.id} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/50 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
                      {actionLoading === req.id ? <Loader2 className="animate-spin" size={16} /> : 'تأكيد الرجوع'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
