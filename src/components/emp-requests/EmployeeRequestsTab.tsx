import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EmployeeRequest } from '@/types';
import { Loader2, CheckCircle2, XCircle, Clock, Check, X, UserPlus, Trash2 } from 'lucide-react';
import { NATIONALITIES } from '@/data/mock';

const ALL_RIGS = ['B2', 'B3', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'LAHEEB', 'UNASSIGNED'];

export default function EmployeeRequestsTab({ isHr, userRig, onRefreshEmployees }: { isHr: boolean, userRig: string | null, onRefreshEmployees: () => void }) {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: 'B2' });

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase.from('employee_requests').select('*').order('created_at', { ascending: false });
    if (!isHr && userRig) {
      query = query.eq('rig', userRig);
    }
    const { data } = await query;
    if (data) setRequests(data as EmployeeRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [isHr, userRig]);

  const handleApprove = async (req: EmployeeRequest) => {
    setActionLoading(req.id);

    if (req.request_type === 'REMOVE') {
      // Handle Removal: Set rig to UNASSIGNED
      const { error: updateError } = await supabase.from('employees').update({ rig: 'UNASSIGNED' }).eq('employee_number', req.employee_number);
      if (updateError) {
        alert("Error removing employee: " + updateError.message);
        setActionLoading(null);
        return;
      }
    } else {
      // Handle Add: Insert into employees table
      const { error: insertError } = await supabase.from('employees').insert({
        name: req.name, employee_number: req.employee_number, position: req.position, nationality: req.nationality, rig: req.rig
      });
      if (insertError) {
        alert("Error adding employee: " + insertError.message);
        setActionLoading(null);
        return;
      }
    }

    await supabase.from('employee_requests').update({ status: 'approved' }).eq('id', req.id);
    setActionLoading(null);
    fetchRequests();
    onRefreshEmployees();
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    await supabase.from('employee_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const handleDeletePermanent = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً من السجلات؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setActionLoading(id);
    await supabase.from('employee_requests').delete().eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  const handleDirectAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    
    const finalNat = addForm.nationality === 'OTHER' ? addForm.customNationality : addForm.nationality;

    const { error } = await supabase.from('employees').insert({
      name: addForm.name, employee_number: addForm.employee_number, position: addForm.position, nationality: finalNat, rig: addForm.rig
    });
    setAddLoading(false);
    if (error) return alert(error.message);
    setIsAdding(false);
    setAddForm({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: 'B2' });
    onRefreshEmployees();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#f4f0ea]">طلبات إضافة وإزالة الموظفين</h2>
        {isHr && (
          <button onClick={() => setIsAdding(true)} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
            <UserPlus size={16} /> إضافة موظف مباشرة
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#d4b896]" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد طلبات حالياً.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-[#f4f0ea] text-lg">{req.name}</div>
                    <span className={`text-xs px-2 py-1 rounded font-bold border ${req.request_type === 'REMOVE' ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-blue-900/20 text-blue-400 border-blue-900/30'}`}>
                      {req.request_type === 'REMOVE' ? 'طلب إزالة' : 'طلب إضافة'}
                    </span>
                  </div>
                  <div className="text-[#a8a19b] text-sm mt-1 font-mono">{req.employee_number} • {req.rig} • {req.position || 'بدون وظيفة'} • {req.nationality || 'بدون جنسية'}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  req.status === 'pending' ? 'bg-amber-900/20 text-amber-500 border-amber-900/30' :
                  req.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' :
                  'bg-red-900/20 text-red-400 border-red-900/30'
                }`}>
                  {req.status === 'pending' ? <Clock size={14}/> : req.status === 'approved' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                  {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </div>
              </div>

              {isHr && req.status === 'pending' && (
                <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                  <button onClick={() => handleApprove(req)} disabled={actionLoading === req.id} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm">
                    {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} موافقة وتنفيذ
                  </button>
                  <button onClick={() => handleDeny(req.id)} disabled={actionLoading === req.id} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                    {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} رفض
                  </button>
                </div>
              )}

              {/* Delete Action for HR on Denied Employee Requests */}
              {isHr && req.status === 'denied' && (
                <div className="flex flex-wrap gap-2 mt-4 border-t border-[#524a43] pt-4">
                  <button onClick={() => handleDeletePermanent(req.id)} disabled={actionLoading === req.id} className="bg-[#2a241f] hover:bg-[#1C1815] text-[#a8a19b] border border-[#524a43] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                    {actionLoading === req.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} حذف نهائي
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HR Direct Add Employee Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleDirectAdd} className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">إضافة موظف مباشرة</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-[#a8a19b] hover:text-[#f4f0ea] transition-colors"><X size={20} /></button>
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
        </div>
      )}
    </div>
  );
}
