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
  const [actionLoading, setActionLoading] = useState(false);

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
    setActionLoading(true);
    await supabase.from('vacation_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(false);
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
    setActionLoading(true);

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

    setActionLoading(false);
    setEditingReq(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        {(['pending', 'approved', 'denied'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              tab === t ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
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
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center text-zinc-500 py-12">لا توجد طلبات في هذا القسم.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-white text-lg">{req.employee_name}</div>
                  <div className="text-zinc-400 text-sm font-mono mt-1">{req.employee_number} • {req.rig}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                  req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {req.status === 'pending' ? <Clock size={14}/> : req.status === 'approved' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                  {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبولة' : 'مرفوضة'}
                </div>
              </div>

              {req.status === 'approved' && (
                <div className="flex flex-wrap gap-4 text-sm text-zinc-300 bg-zinc-800/40 p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-1.5"><Plane size={16} className="text-emerald-500"/> {req.travel_mode === 'car' ? 'سيارة' : req.travel_mode === 'fly' ? 'طيران' : 'مختلط'}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500"/> {req.route_stops?.join(' ← ')}</div>
                  <div className="flex items-center gap-1.5"><Plane size={16} className={req.flight_ticket_confirmed ? 'text-emerald-500' : 'text-zinc-500'}/> تذكرة</div>
                  <div className="flex items-center gap-1.5"><Hotel size={16} className={req.hotel_confirmed ? 'text-emerald-500' : 'text-zinc-500'}/> فندق</div>
                </div>
              )}
              
              {isHr && req.status === 'pending' && (
                <div className="flex gap-2 mt-4 border-t border-zinc-800 pt-4">
                  <button onClick={() => openApproveModal(req)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">قبول وتفصيل السفر</button>
                  <button onClick={() => handleDeny(req.id)} disabled={actionLoading} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">رفض الطلب</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingReq && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">تفاصيل السفر والموافقة</h3>
              <button onClick={() => setEditingReq(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="text-sm text-zinc-400 mb-4">{editingReq.employee_name} ({editingReq.employee_number})</div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">الوجهة النهائية</label>
              <select value={editDestination} onChange={e => setEditDestination(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
                <option value="" disabled>اختر الوجهة...</option>
                <optgroup label="داخل ليبيا">{LIBYA_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="دولي">{INTERNATIONAL_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">طريقة السفر</label>
              <select value={editTravelMode} onChange={e => setEditTravelMode(e.target.value as TravelMode)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
                <option value="fly">طيران مباشر</option>
                <option value="road_half_fly">نصف الطريق ثم طيران</option>
                <option value="car">سيارة</option>
              </select>
            </div>

            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input type="checkbox" checked={editFlight} onChange={e => setEditFlight(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                <Plane size={16} /> تأكيد التذكرة
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input type="checkbox" checked={editHotel} onChange={e => setEditHotel(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                <Hotel size={16} /> تأكيد الفندق
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3 mt-4">
              <button onClick={() => setEditingReq(null)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">إلغاء</button>
              <button onClick={handleApprove} disabled={actionLoading || !editDestination} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'موافقة وحفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
