import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VacationRequest } from '@/types';
import { CalendarCheck, User, Clock, MapPin, Briefcase, Trash2, Loader2 } from 'lucide-react';

export default function EndedVacationsTab() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const fetchEnded = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('status', 'completed')
      .order('end_date', { ascending: false });
    
    if (data) setRequests(data as VacationRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEnded();

    const channel = supabase.channel('realtime-ended-vacations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacation_requests' }, () => {
        fetchEnded();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClearAll = async () => {
    if (!window.confirm("هل أنت متأكد من مسح جميع الإجازات المنتهية نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setIsClearing(true);
    await supabase.from('vacation_requests').delete().eq('status', 'completed');
    setIsClearing(false);
    fetchEnded();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'غير مسجل';
    return new Date(dateString).toLocaleString('ar-LY', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-[#2a241f] p-6 rounded-xl border border-[#524a43] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-[#d4b896]/20 p-3 rounded-lg text-[#d4b896]">
            <CalendarCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f4f0ea]">سجل الإجازات المنتهية</h2>
            <p className="text-sm text-[#a8a19b]">الموظفون الذين انتهت إجازاتهم وعادوا إلى العمل</p>
          </div>
        </div>
        
        {requests.length > 0 && (
          <button onClick={handleClearAll} disabled={isClearing} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
            {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} مسح الكل
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d4b896]"></div></div>
      ) : requests.length === 0 ? (
        <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد إجازات منتهية حالياً.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1C1815] border border-[#524a43] flex items-center justify-center text-[#d4b896]">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[#f4f0ea] text-lg">{req.employee_name}</div>
                    <div className="text-[#a8a19b] text-sm font-mono mt-1">{req.employee_number} • {req.rig}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 md:gap-8 bg-[#2a241f] p-4 rounded-lg border border-[#524a43]/50 w-full md:w-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#a8a19b] flex items-center gap-1"><Clock size={12}/> تاريخ إنهاء الإجازة</span>
                    <span className="text-sm font-bold text-red-400">{formatDate(req.end_date)}</span>
                  </div>
                  
                  <div className="w-px bg-[#524a43] hidden md:block"></div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#a8a19b] flex items-center gap-1"><Briefcase size={12}/> تاريخ بدء العمل</span>
                    <span className="text-sm font-bold text-emerald-400">{formatDate(req.end_date)}</span>
                  </div>

                  <div className="w-px bg-[#524a43] hidden md:block"></div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#a8a19b] flex items-center gap-1"><MapPin size={12}/> الوجهة السابقة</span>
                    <span className="text-sm font-bold text-[#f4f0ea]">{req.route_stops?.join(' ← ') || 'غير محدد'}</span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
