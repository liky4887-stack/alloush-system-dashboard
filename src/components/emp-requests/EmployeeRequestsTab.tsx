import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EmployeeRequest } from '@/types';
import { Loader2, CheckCircle2, XCircle, Clock, Check, X, UserPlus } from 'lucide-react';
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
        <h2 className="text-xl font-bold text-white">طلبات إضافة وإزالة الموظفين</h2>
        {isHr && (
          <button onClick={() => setIsAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <UserPlus size={16} /> إضافة موظف مباشرة
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center text-zinc-500 py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">لا توجد طلبات حالياً.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white text-lg">{req.name}</div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${req.request_type === 'REMOVE' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                      {req.request_type === 'REMOVE' ? 'طلب إزالة' : 'طلب إضافة'}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-sm mt-1">{req.employee_number} • {req.rig} • {req.position || 'بدون وظيفة'} • {req.nationality || 'بدون جنسية'}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                  req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                  req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {req.status === 'pending' ? <Clock size={14}/> : req.status === 'approved' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                  {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </div>
              </div>

              {isHr && req.status === 'pending' && (
                <div className="flex gap-2 mt-4 border-t border-zinc-800 pt-4">
                  <button onClick={() => handleApprove(req)} disabled={actionLoading === req.id} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                    {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} موافقة وتنفيذ
                  </button>
                  <button onClick={() => handleDeny(req.id)} disabled={actionLoading === req.id} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                    <X size={16} /> رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HR Direct Add Employee Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleDirectAdd} className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">إضافة موظف مباشرة</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="الاسم الكامل" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              <input type="text" placeholder="الرقم الوظيفي" required value={addForm.employee_number} onChange={e => setAddForm({...addForm, employee_number: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              <input type="text" placeholder="الوظيفة" value={addForm.position} onChange={e => setAddForm({...addForm, position: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              
              <select value={addForm.nationality} onChange={e => setAddForm({...addForm, nationality: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500">
                <option value="" disabled>الجنسية</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {addForm.nationality === 'OTHER' && (
                <input type="text" placeholder="اكتب الجنسية" required value={addForm.customNationality} onChange={e => setAddForm({...addForm, customNationality: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              )}

              <select value={addForm.rig} onChange={e => setAddForm({...addForm, rig: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500">
                {ALL_RIGS.map(r => <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={addLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4">
              {addLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
