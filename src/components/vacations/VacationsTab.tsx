import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VacationRequest, Employee, TravelMode } from '@/types';
import { LIBYA_DESTINATIONS, INTERNATIONAL_DESTINATIONS } from '@/data/mock';
import { Loader2, CheckCircle2, XCircle, Clock, MapPin, Plane, Hotel, X } from 'lucide-react';

export default function VacationsTab({ isHr, userRig, employees }: { isHr: boolean, userRig: string | null, employees: Employee[] }) {
  const [tab, setTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingReq, setEditingReq] = useState<VacationRequest | null>(null);
  const [editDestination, setEditDestination] = useState('');
  const [editTravelMode, setEditTravelMode] = useState<TravelMode>('fly');
  const [editFlight, setEditFlight] = useState(false);
  const [editHotel, setEditHotel] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase.from('vacation_requests').select('*').eq('status', tab).order('created_at', { ascending: false });
    if (!isHr && userRig) {
      query = query.eq('rig', userRig);
    }
    const { data } = await query;
    if (data) setRequests(data as VacationRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [tab, isHr, userRig]);

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    await supabase.from('vacation_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  // HR function to revoke an already approved vacation
  const handleCancelApproved = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من إلغاء هذه الإجازة؟ سيتم إرجاع الموظف إلى حالة العمل.")) return;
    setActionLoading(id);
    await supabase.from('vacation_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const openApproveModal = (req: VacationRequest) => {
    setEditingReq(req);
    setEditDestination(req.destination || '');
    setEditTravelMode((req.travel_mode as TravelMode) || 'fly');
    setEditFlight(req.flight_ticket_confirmed || false);
    setEditHotel(req.hotel_confirmed || false);
  };

  const handleApprove = async () => {
    if (!editingReq || !editDestination) return;
    setActionLoading(editingReq.id);

    let route: string[] = [];
    if (editTravelMode === 'car') route = ['الهيب', 'طرابلس', editDestination];
    else if (editingReq.rig === 'LAHEEB') route = ['الهيب', 'طرابلس', editDestination];
    else route = ['الهيب', 'طرابلس', 'تونس', editDestination];

    await supabase.from('vacation_requests').update({
      status: 'approved',
      destination: 'الهيب', 
      travel_mode: editTravelMode,
      flight_ticket_confirmed: editFlight,
      hotel_confirmed: editHotel,
      route_stops: route
    }).eq('id', editingReq.id);

    setActionLoading(null);
    setEditingReq(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex gap-2 border-b border-[#524a43] pb-2 overflow-x-auto">
        {(['pending', 'approved', 'denied'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              tab === t ? 'bg-[#d4b896] text-[#2a241f] shadow-md' : 'text-[#a8a19b] hover:bg-[#3a332d] hover:text-[#f4f0ea]'
            }`}
          >
            {t === 'pending' && <Clock size={16} />}
            {t === 'approved' && <CheckCircle2 size={16} />}
            {t === 'denied' && <XCircle size={16} />}
            {t === 'pending' ? 'قيد الانتظار' : t === 'approved' ? 'مقبولة' : 'مرفوضة'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#d4b896]" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد طلبات في هذا القسم.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-[#f4f0ea] text-lg">{req.employee_name}</div>
                  <div className="text-[#a8a19b] text-sm font-mono mt-1">{req.employee_number} • {req.rig}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  req.status === 'pending' ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' :
                  req.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' :
                  'bg-red-900/20 text-red-400 border-red-900/30'
                }`}>
                  {req.status === 'pending' ? <Clock size={14}/> : req.status === 'approved' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                  {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبولة' : 'مرفوضة'}
                </div>
              </div>

              {/* Show travel details for approved requests */}
              {req.status === 'approved' && (
                <div className="flex flex-wrap gap-4 text-sm text-[#f4f0ea] bg-[#2a241f] p-3 rounded-lg mb-4 border border-[#524a43]">
                  <div className="flex items-center gap-1.5"><Plane size={16} className="text-[#d4b896]"/> {req.travel_mode === 'car' ? 'سيارة' : req.travel_mode === 'fly' ? 'طيران' : 'مختلط'}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-[#d4b896]"/> {req.route_stops?.join(' ← ')}</div>
                  <div className="flex items-center gap-1.5"><Plane size={16} className={req.flight_ticket_confirmed ? 'text-[#d4b896]' : 'text-[#a8a19b]'}/> تذكرة</div>
                  <div className="flex items-center gap-1.5"><Hotel size={16} className={req.hotel_confirmed ? 'text-[#d4b896]' : 'text-[#a8a19b]'}/> فندق</div>
                </div>
              )}
              
              {/* Pending Actions for HR */}
              {isHr && req.status === 'pending' && (
                <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                  <button onClick={() => openApproveModal(req)} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                    قبول وتفصيل السفر
                  </button>
                  <button onClick={() => handleDeny(req.id)} disabled={actionLoading === req.id} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                    {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} رفض الطلب
                  </button>
                </div>
              )}

              {/* Cancel Action for HR on Approved Vacations */}
              {isHr && req.status === 'approved' && (
                <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                  <button onClick={() => handleCancelApproved(req.id)} disabled={actionLoading === req.id} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                    {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} إلغاء الإجازة
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HR Modal for Approving */}
      {editingReq && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">تفاصيل السفر والموافقة</h3>
              <button onClick={() => setEditingReq(null)} className="text-[#a8a19b] hover:text-[#f4f0ea] transition-colors"><X size={20} /></button>
            </div>

            <div className="text-sm text-[#a8a19b] mb-4 font-mono">{editingReq.employee_name} ({editingReq.employee_number})</div>

            <div>
              <label className="block text-sm font-bold text-[#d4b896] mb-1">الوجهة النهائية</label>
              <select value={editDestination} onChange={e => setEditDestination(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:outline-none focus:border-[#d4b896] appearance-none">
                <option value="" disabled>اختر الوجهة...</option>
                <optgroup label="داخل ليبيا">{LIBYA_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="دولي">{INTERNATIONAL_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#d4b896] mb-1">طريقة السفر</label>
              <select value={editTravelMode} onChange={e => setEditTravelMode(e.target.value as TravelMode)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:outline-none focus:border-[#d4b896] appearance-none">
                <option value="fly">طيران مباشر</option>
                <option value="road_half_fly">نصف الطريق ثم طيران</option>
                <option value="car">سيارة</option>
              </select>
            </div>

            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[#f4f0ea]">
                <input type="checkbox" checked={editFlight} onChange={e => setEditFlight(e.target.checked)} className="w-4 h-4 rounded border-[#524a43] bg-[#3a332d] text-[#d4b896] focus:ring-[#d4b896]" />
                <Plane size={16} /> تأكيد التذكرة
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#f4f0ea]">
                <input type="checkbox" checked={editHotel} onChange={e => setEditHotel(e.target.checked)} className="w-4 h-4 rounded border-[#524a43] bg-[#3a332d] text-[#d4b896] focus:ring-[#d4b896]" />
                <Hotel size={16} /> تأكيد الفندق
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-[#524a43]">
              <button onClick={() => setEditingReq(null)} className="px-4 py-2 text-[#a8a19b] hover:text-[#f4f0ea] transition-colors">إلغاء</button>
              <button onClick={handleApprove} disabled={actionLoading === editingReq.id || !editDestination} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                {actionLoading === editingReq.id ? <Loader2 className="animate-spin" size={16} /> : 'موافقة وحفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
