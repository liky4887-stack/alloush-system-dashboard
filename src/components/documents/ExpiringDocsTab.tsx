import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee } from '@/types';
import { ShieldAlert, Calendar, HeartPulse, Check, Edit2, Loader2, X, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ExpiringDocsTab({ employees, onRefresh }: { employees: Employee[], onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Modal State
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editAuthDate, setEditAuthDate] = useState('');
  const [editHealthDate, setEditHealthDate] = useState('');

  // Filter, search, and limit to 50 to prevent lag
  const displayedEmployees = useMemo(() => {
    const activeDocs = employees.filter(emp => emp.auth_status === 'active');
    const filtered = activeDocs.filter(emp => 
      emp.name.includes(search) || emp.employee_number.includes(search)
    );
    
    // Sort by closest expiration
    filtered.sort((a, b) => {
      if (!a.auth_expiry_date) return 1;
      if (!b.auth_expiry_date) return -1;
      return new Date(a.auth_expiry_date).getTime() - new Date(b.auth_expiry_date).getTime();
    });

    return filtered.slice(0, 50);
  }, [employees, search]);

  const getDaysLeft = (dateString?: string | null) => {
    if (!dateString) return null;
    const diffTime = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleEndAuth = async (emp: Employee) => {
    if (!window.confirm(`هل أنت متأكد من إنهاء تصريح "${emp.name}"؟`)) return;
    setActionLoading(emp.id);
    await supabase.from('employees').update({ auth_status: 'ended' }).eq('id', emp.id);
    setActionLoading(null);
    onRefresh();
  };

  const openEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setEditAuthDate(emp.auth_expiry_date || '');
    setEditHealthDate(emp.health_cert_expiry_date || '');
  };

  const handleExtend = async () => {
    if (!editingEmp) return;
    setEditLoading(true);
    await supabase.from('employees').update({
      auth_expiry_date: editAuthDate || null,
      health_cert_expiry_date: editHealthDate || null
    }).eq('id', editingEmp.id);
    setEditLoading(false);
    setEditingEmp(null);
    onRefresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#2a241f] p-6 rounded-xl border border-[#524a43] shadow-lg gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/20 p-3 rounded-lg text-amber-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f4f0ea]">التصاريح والشهادات الصحية</h2>
            <p className="text-sm text-[#a8a19b]">يتم عرض أول 50 موظف فقط. استخدم البحث للعثور على البقية.</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-2.5 text-[#a8a19b]" size={16} />
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو الرقم..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-[#2a241f] border border-[#524a43] rounded-lg py-2 pr-9 pl-3 text-sm text-[#f4f0ea] focus:outline-none focus:border-[#d4b896] placeholder-[#a8a19b]" 
          />
        </div>
      </div>

      <div className="grid gap-4">
        {displayedEmployees.length === 0 ? (
          <div className="text-center text-[#a8a19b] py-12 bg-[#3a332d] rounded-xl border border-[#524a43]">لا توجد تصاريح مطابقة للبحث.</div>
        ) : (
          displayedEmployees.map(emp => {
            const authDays = getDaysLeft(emp.auth_expiry_date);
            const healthDays = getDaysLeft(emp.health_cert_expiry_date);

            const authColor = authDays !== null && authDays <= 7 ? 'text-red-500 bg-red-900/20 border-red-500/30' : 
                              authDays !== null && authDays <= 30 ? 'text-amber-500 bg-amber-900/20 border-amber-500/30' : 
                              'text-emerald-400 bg-emerald-900/20 border-emerald-500/30';

            const healthColor = healthDays !== null && healthDays <= 7 ? 'text-red-500 bg-red-900/20 border-red-500/30' : 
                                healthDays !== null && healthDays <= 30 ? 'text-amber-500 bg-amber-900/20 border-amber-500/30' : 
                                'text-emerald-400 bg-emerald-900/20 border-emerald-500/30';

            return (
              <div key={emp.id} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="font-bold text-[#f4f0ea] text-lg">{emp.name}</div>
                  <div className="text-[#a8a19b] text-sm font-mono mt-1">{emp.employee_number} • {emp.rig}</div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${authColor}`}>
                    <Calendar size={18} />
                    <div className="flex flex-col">
                      <span className="text-xs opacity-80">انتهاء التصريح</span>
                      <span className="font-bold text-sm">{emp.auth_expiry_date || 'غير مسجل'}</span>
                    </div>
                    {authDays !== null && (
                      <span className="font-bold text-xs ml-2 bg-black/20 px-2 py-1 rounded">
                        {authDays > 0 ? `باقي ${authDays} يوم` : `متأخر ${Math.abs(authDays)} يوم`}
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${healthColor}`}>
                    <HeartPulse size={18} />
                    <div className="flex flex-col">
                      <span className="text-xs opacity-80">الشهادة الصحية</span>
                      <span className="font-bold text-sm">{emp.health_cert_expiry_date || 'غير مسجل'}</span>
                    </div>
                    {healthDays !== null && (
                      <span className="font-bold text-xs ml-2 bg-black/20 px-2 py-1 rounded">
                        {healthDays > 0 ? `باقي ${healthDays} يوم` : `متأخر ${Math.abs(healthDays)} يوم`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => openEdit(emp)} className="px-4 py-2 bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold rounded-lg text-sm transition-colors flex items-center gap-2">
                    <Edit2 size={16} /> تجديد
                  </button>
                  <button onClick={() => handleEndAuth(emp)} disabled={actionLoading === emp.id} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 font-bold rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                    {actionLoading === emp.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} إنهاء
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editingEmp && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">تجديد التصاريح</h3>
              <button onClick={() => setEditingEmp(null)} className="text-[#a8a19b] hover:text-[#f4f0ea]"><X size={20} /></button>
            </div>
            
            <div className="text-sm text-zinc-400 mb-4">{editingEmp.name}</div>

            <div>
              <label className="block text-sm font-bold text-[#d4b896] mb-1">تاريخ انتهاء التصريح الجديد</label>
              <input type="date" value={editAuthDate} onChange={e => setEditAuthDate(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" style={{ colorScheme: 'dark' }} />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#d4b896] mb-1">تاريخ الشهادة الصحية الجديد</label>
              <input type="date" value={editHealthDate} onChange={e => setEditHealthDate(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" style={{ colorScheme: 'dark' }} />
            </div>

            <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-[#524a43]">
              <button onClick={() => setEditingEmp(null)} className="px-4 py-2 text-[#a8a19b] hover:text-[#f4f0ea]">إلغاء</button>
              <button onClick={handleExtend} disabled={editLoading} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                {editLoading ? <Loader2 className="animate-spin" size={16} /> : 'حفظ التجديد'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
