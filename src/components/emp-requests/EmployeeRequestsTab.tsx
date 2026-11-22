import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { EmployeeRequest, HealthCertRequest } from '@/types';
import { Loader2, CheckCircle2, XCircle, Clock, Check, X, UserPlus, Trash2, HeartPulse } from 'lucide-react';
import { NATIONALITIES } from '@/data/mock';

const ALL_RIGS = ['B2', 'B3', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'LAHEEB', 'UNASSIGNED'];

export default function EmployeeRequestsTab({ isHr, userRig, onRefreshEmployees }: { isHr: boolean, userRig: string | null, onRefreshEmployees: () => void }) {
  const [activeTab, setActiveTab] = useState<'employees' | 'health'>('employees');
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [healthRequests, setHealthRequests] = useState<HealthCertRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: 'B2' });

  const fetchRequests = async () => {
    setLoading(true);
    
    // Fetch Employee Requests
    let query = supabase.from('employee_requests').select('*').order('created_at', { ascending: false });
    if (!isHr && userRig) query = query.eq('rig', userRig);
    const { data: empData } = await query;
    if (empData) setRequests(empData as EmployeeRequest[]);

    // Fetch Health Cert Requests
    let hQuery = supabase.from('health_cert_requests').select('*').order('created_at', { ascending: false });
    if (!isHr && userRig) hQuery = hQuery.eq('rig', userRig);
    const { data: hData } = await hQuery;
    if (hData) setHealthRequests(hData as HealthCertRequest[]);

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [isHr, userRig]);

  useEffect(() => {
    const channel = supabase.channel('realtime-all-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_requests' }, fetchRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'health_cert_requests' }, fetchRequests)
      .subscribe();

    
  const handleClearProcessedRequests = async () => {
    const { error } = await supabase.rpc('hr_archive_processed_employee_requests');
    if (error) alert('حدث خطأ أثناء المسح: ' + error.message);
    else window.location.reload();
  };

  return () => {
      supabase.removeChannel(channel);
    };
  }, [isHr, userRig]);

  const handleApproveEmp = async (req: EmployeeRequest) => {
    setActionLoading(req.id);

    if (req.request_type === 'REMOVE') {
      const { data: updated, error: updateError } = await supabase
        .from('employees')
        .update({ rig: 'UNASSIGNED' })
        .eq('employee_number', req.employee_number)
        .select();

      if (updateError) { alert("Error removing employee: " + updateError.message); setActionLoading(null); return; }
      if (!updated || updated.length === 0) { alert("لم يتم العثور على الموظف."); setActionLoading(null); return; }
    } else {
      const { error: insertError } = await supabase.from('employees').insert({
        name: req.name, employee_number: req.employee_number, position: req.position, nationality: req.nationality, rig: req.rig
      });
      if (insertError) { alert("Error adding employee: " + insertError.message); setActionLoading(null); return; }
    }

    await supabase.from('employee_requests').update({ status: 'approved' }).eq('id', req.id);
    setActionLoading(null);
    fetchRequests();
    onRefreshEmployees();
  };

  const handleDenyEmp = async (id: string) => {
    setActionLoading(id);
    await supabase.from('employee_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const handleApproveHealth = async (req: HealthCertRequest) => {
    setActionLoading(req.id);
    await supabase.from('health_cert_requests').update({ status: 'approved' }).eq('id', req.id);
    setActionLoading(null);
    fetchRequests();
    onRefreshEmployees(); // Refreshes the main employee list to show the new date
  };

  const handleDenyHealth = async (id: string) => {
    setActionLoading(id);
    await supabase.from('health_cert_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const handleDeletePermanentEmp = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    setActionLoading(id);
    await supabase.from('employee_requests').delete().eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const handleDeletePermanentHealth = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    setActionLoading(id);
    await supabase.from('health_cert_requests').delete().eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const handleDirectAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    const finalNat = addForm.nationality === 'OTHER' ? addForm.customNationality : addForm.nationality;
    const { error } = await supabase.from('employees').insert({ name: addForm.name, employee_number: addForm.employee_number, position: addForm.position, nationality: finalNat, rig: addForm.rig });
    setAddLoading(false);
    if (error) return alert(error.message);
    setIsAdding(false);
    setAddForm({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: 'B2' });
    onRefreshEmployees();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 border-b border-[#524a43] pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'employees' ? 'bg-[#d4b896] text-[#2a241f] shadow-md' : 'text-[#a8a19b] hover:bg-[#3a332d] hover:text-[#f4f0ea]'}`}>
            <UserPlus size={16} /> طلبات الموظفين
          </button>
          <button onClick={() => setActiveTab('health')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'health' ? 'bg-[#d4b896] text-[#2a241f] shadow-md' : 'text-[#a8a19b] hover:bg-[#3a332d] hover:text-[#f4f0ea]'}`}>
            <HeartPulse size={16} /> الشهادات الصحية
          </button>
        </div>
        {isHr && (
          <button onClick={() => setIsAdding(true)} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
            <UserPlus size={16} /> إضافة موظف مباشرة
              <button 
                onClick={handleClearProcessedRequests}
                className="ml-4 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-colors text-xs font-medium"
              >
                مسح الطلبات المنجزة 🗑️
              </button>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#d4b896]" size={32} /></div>
      ) : (
        <div className="grid gap-4">
          {activeTab === 'employees' ? (
            requests.length === 0 ? (
              <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد طلبات موظفين.</div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-[#f4f0ea] text-lg">{req.name}</div>
                        <span className={`text-xs px-2 py-1 rounded font-bold border ${req.request_type === 'REMOVE' ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-blue-900/20 text-blue-400 border-blue-900/30'}`}>
                          {req.request_type === 'REMOVE' ? 'طلب إزالة' : 'طلب إضافة'}
                        </span>
                      </div>
                      <div className="text-[#a8a19b] text-sm mt-1 font-mono">{req.employee_number} • {req.rig}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${req.status === 'pending' ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' : req.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-red-900/20 text-red-400 border-red-900/30'}`}>
                      {req.status === 'pending' ? <Clock size={14}/> : req.status === 'approved' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                      {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </div>
                  </div>

                  {isHr && req.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                      <button onClick={() => handleApproveEmp(req)} disabled={actionLoading === req.id} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                        {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} موافقة وتنفيذ
                      </button>
                      <button onClick={() => handleDenyEmp(req.id)} disabled={actionLoading === req.id} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                        <X size={16} /> رفض
                      </button>
                    </div>
                  )}
                  {isHr && req.status === 'denied' && (
                    <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                      <button onClick={() => handleDeletePermanentEmp(req.id)} disabled={actionLoading === req.id} className="bg-[#2a241f] hover:bg-[#1C1815] text-[#a8a19b] border border-[#524a43] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                        <Trash2 size={16} /> حذف نهائي
                      </button>
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            healthRequests.length === 0 ? (
              <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد طلبات شهادات صحية.</div>
            ) : (
              healthRequests.map((req) => (
                <div key={req.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-bold text-[#f4f0ea] text-lg">{req.employee_name}</div>
                      <div className="text-[#a8a19b] text-sm mt-1 font-mono">{req.employee_number} • {req.rig}</div>
                      <div className="text-xs text-[#d4b896] mt-2 bg-[#d4b896]/10 px-3 py-1.5 rounded-lg inline-block">
                        التاريخ المقترح: <strong>{req.proposed_date}</strong>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${req.status === 'pending' ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' : req.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-red-900/20 text-red-400 border-red-900/30'}`}>
                      {req.status === 'pending' ? <Clock size={14}/> : req.status === 'approved' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                      {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </div>
                  </div>

                  {isHr && req.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                      <button onClick={() => handleApproveHealth(req)} disabled={actionLoading === req.id} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                        {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} موافقة وتحديث
                      </button>
                      <button onClick={() => handleDenyHealth(req.id)} disabled={actionLoading === req.id} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                        <X size={16} /> رفض
                      </button>
                    </div>
                  )}
                  {isHr && req.status === 'denied' && (
                    <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                      <button onClick={() => handleDeletePermanentHealth(req.id)} disabled={actionLoading === req.id} className="bg-[#2a241f] hover:bg-[#1C1815] text-[#a8a19b] border border-[#524a43] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                        <Trash2 size={16} /> حذف نهائي
                      </button>
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      )}

      {isAdding && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <form onSubmit={handleDirectAdd} className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">إضافة موظف مباشرة</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-[#a8a19b] hover:text-[#f4f0ea]"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="الاسم الكامل" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" />
              <input type="text" placeholder="الرقم الوظيفي" required value={addForm.employee_number} onChange={e => setAddForm({...addForm, employee_number: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" />
              <input type="text" placeholder="الوظيفة" value={addForm.position} onChange={e => setAddForm({...addForm, position: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" />
              <select value={addForm.nationality} onChange={e => setAddForm({...addForm, nationality: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none">
                <option value="" disabled>الجنسية</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {addForm.nationality === 'OTHER' && (
                <input type="text" placeholder="اكتب الجنسية" required value={addForm.customNationality} onChange={e => setAddForm({...addForm, customNationality: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" />
              )}
              <select value={addForm.rig} onChange={e => setAddForm({...addForm, rig: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none">
                {ALL_RIGS.map(r => <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={addLoading} className="w-full bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 shadow-md">
              {addLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ الموظف'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
