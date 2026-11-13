import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EmployeeRequest } from '@/types';
import { Loader2, CheckCircle2, XCircle, Clock, Check, X } from 'lucide-react';

export default function EmployeeRequestsTab({ isHr, userRig, onRefreshEmployees }: { isHr: boolean, userRig: string | null, onRefreshEmployees: () => void }) {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    
    // 1. Insert into main employees table
    const { error: insertError } = await supabase.from('employees').insert({
      name: req.name,
      employee_number: req.employee_number,
      position: req.position,
      nationality: req.nationality,
      rig: req.rig
    });

    if (insertError) {
      alert("Error adding employee: " + insertError.message);
      setActionLoading(null);
      return;
    }

    // 2. Mark request as approved
    await supabase.from('employee_requests').update({ status: 'approved' }).eq('id', req.id);
    
    setActionLoading(null);
    fetchRequests();
    onRefreshEmployees(); // refresh the main employee list
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    await supabase.from('employee_requests').update({ status: 'denied' }).eq('id', id);
    setActionLoading(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">طلبات إضافة موظفين</h2>
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
                  <div className="font-bold text-white text-lg">{req.name}</div>
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
                    {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} موافقة وإضافة
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
    </div>
  );
}
