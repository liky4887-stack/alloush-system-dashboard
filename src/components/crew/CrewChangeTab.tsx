import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { CrewChangeRow, Employee } from '@/types';
import { Loader2, PlaneLanding, PlaneTakeoff, CalendarDays, Edit2, Plus, X, Search } from 'lucide-react';

interface Props {
  isHr: boolean;
  userRig: string | null;
  employees: Employee[];
  onRefresh: () => void;
}

export default function CrewChangeTab({ isHr, userRig, employees, onRefresh }: Props) {
  const [rows, setRows] = useState<CrewChangeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals state
  const [isAdding, setIsAdding] = useState(false);
  const [editingReq, setEditingReq] = useState<CrewChangeRow | null>(null);
  
  // Form state
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const handleAddVacation = async () => {
    if (!selectedEmp || !startDate || !endDate) return alert('يرجى اختيار الموظف وتحديد التواريخ');
    setActionLoading('new');
    
    // نضيف الطلب كـ approved مباشرة عشان يظهر في الكرو تشينج
    const { error } = await supabase.from('vacation_requests').insert({
      employee_number: selectedEmp.employee_number,
      employee_name: selectedEmp.name,
      rig: selectedEmp.rig || 'UNASSIGNED',
      requested_by: (await supabase.auth.getUser()).data.user?.id,
      status: 'approved',
      start_date: startDate,
      end_date: endDate
    });

    setActionLoading(null);
    if (error) alert(error.message);
    else {
      setIsAdding(false);
      setSelectedEmp(null);
      setSearch('');
      setStartDate('');
      setEndDate('');
      fetchCrewChange();
      onRefresh();
    }
  };

  const handleEditVacation = async () => {
    if (!editingReq || !startDate || !endDate) return;
    setActionLoading('edit');
    const { error } = await supabase.rpc('hr_set_vacation_schedule', {
      p_request_id: editingReq.id,
      p_start_date: startDate,
      p_end_date: endDate
    });
    setActionLoading(null);
    if (error) alert(error.message);
    else {
      setEditingReq(null);
      fetchCrewChange();
      onRefresh();
    }
  };

  const openEditModal = (req: CrewChangeRow) => {
    setEditingReq(req);
    setStartDate(req.start_date || '');
    setEndDate(req.end_date || '');
  };

  const departures = rows.filter(r => r.phase === 'upcoming_departure');
  const returns = rows.filter(r => r.phase === 'on_vacation');
  
  const filteredEmployees = search.length >= 2 
    ? employees.filter(e => e.name.includes(search) || e.employee_number.includes(search))
    : [];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#d4b896]" size={32} /></div>;

  return (
    <div className="space-y-8" dir="rtl">
      {isHr && (
        <div className="flex justify-end">
          <button onClick={() => { setIsAdding(true); setSelectedEmp(null); setStartDate(''); setEndDate(''); setSearch(''); }} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-md">
            <Plus size={18} /> إضافة أجازة جديدة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* قسم المسافرين */}
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
                  <div className="flex items-center gap-2">
                    {isHr && (
                      <>
                        <button onClick={() => openEditModal(req)} className="p-2 bg-[#3a332d] hover:bg-[#524a43] text-[#d4b896] rounded-lg transition-colors" title="تعديل التواريخ">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleSignOff(req.id)} disabled={actionLoading === req.id} className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-500 border border-amber-600/50 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
                          {actionLoading === req.id ? <Loader2 className="animate-spin" size={16} /> : 'تأكيد الخروج'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* قسم الراجعين */}
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

      {/* Add Modal */}
      {isAdding && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">إضافة أجازة يدوياً (HR)</h3>
              <button onClick={() => setIsAdding(false)} className="text-[#a8a19b] hover:text-[#f4f0ea]"><X size={20} /></button>
            </div>
            
            <div className="relative">
              <label className="text-xs text-[#d4b896] mb-1 block font-bold">ابحث عن موظف</label>
              <input type="text" placeholder="ابحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" />
              {search.length >= 2 && !selectedEmp && (
                <div className="absolute z-10 w-full mt-1 bg-[#1C1815] border border-[#524a43] rounded-lg max-h-40 overflow-y-auto shadow-xl">
                  {filteredEmployees.map(emp => (
                    <div key={emp.id} onClick={() => { setSelectedEmp(emp); setSearch(emp.name); }} className="p-2.5 hover:bg-[#3a332d] cursor-pointer text-sm text-[#f4f0ea] border-b border-[#524a43]/50 last:border-0">
                      {emp.name} - {emp.employee_number} ({emp.rig})
                    </div>
                  ))}
                </div>
              )}
              {selectedEmp && (
                <div className="mt-2 p-3 bg-[#3a332d] rounded-lg border border-[#524a43] text-sm text-[#f4f0ea]">
                  تم اختيار: <span className="font-bold">{selectedEmp.name}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ الخروج</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea]" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ العودة</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea]" style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            <button onClick={handleAddVacation} disabled={actionLoading === 'new' || !selectedEmp || !startDate || !endDate} className="w-full bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 disabled:opacity-50">
              {actionLoading === 'new' ? <Loader2 className="animate-spin" size={18} /> : 'حفظ الأجازة'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {editingReq && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">تعديل تواريخ الأجازة</h3>
              <button onClick={() => setEditingReq(null)} className="text-[#a8a19b] hover:text-[#f4f0ea]"><X size={20} /></button>
            </div>
            
            <div className="text-sm text-[#a8a19b] mb-4">{editingReq.employee_name}</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ الخروج</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea]" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ العودة</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea]" style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            <button onClick={handleEditVacation} disabled={actionLoading === 'edit'} className="w-full bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4">
              {actionLoading === 'edit' ? <Loader2 className="animate-spin" size={18} /> : 'حفظ التعديلات'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
