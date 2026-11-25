import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CpoRequest, Employee, Tab } from '@/types';
import { Users, AlertTriangle, Clock, Search, Edit2, X, Loader2, PlaneTakeoff, HeartPulse } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NATIONALITIES } from '@/data/mock';

const ALL_RIGS = [
  { id: 'B2', label: 'B2' }, { id: 'B3', label: 'B3' }, { id: 'B5', label: 'B5' },
  { id: 'B6', label: 'B6' }, { id: 'B7', label: 'B7' }, { id: 'B8', label: 'B8' },
  { id: 'B9', label: 'B9' }, { id: 'B10', label: 'B10' }, { id: 'B11', label: 'B11' },
  { id: 'LAHEEB', label: 'ساحة اللهيب' }, { id: 'UNASSIGNED', label: 'غير محدد' },
];

interface Props {
  requests: CpoRequest[];
  employees: Employee[];
  onRigClick: (rig: string) => void;
  onNavigate: (tab: Tab) => void;
  isHr: boolean;
  onRefresh: () => void;
}

export default function OverviewTab({ requests, employees, onRigClick, onNavigate, isHr, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    total_employees: 0,
    on_vacation_now: 0,
    expiring_docs_30d: 0,
    expiring_health_30d: 0,
    pending_vacations: 0,
    pending_emp_requests: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('v_hr_dashboard').select('*').single();
      if (data) setDashboardStats(data);
    };
    fetchStats();

    const channel = supabase.channel('realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchStats();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: '', is_suspended: false, joining_date: '', auth_expiry_date: '', health_cert_expiry_date: ''
  });

  const totalEmployees = employees.length;
  const totalSuspended = employees.filter(e => e.is_suspended).length;
  const totalPending = requests.filter(r => r.status === 'pending').length;

  const rigStats = useMemo(() => {
    const stats: Record<string, { total: number, suspended: number }> = {};
    ALL_RIGS.forEach(rig => { stats[rig.id] = { total: 0, suspended: 0 }; });

    employees.forEach(emp => {
      let rig = emp.rig || 'UNASSIGNED';
      if (rig === 'ساحة اللهيب' || rig === 'الهيب' || rig === 'laheeb' || rig === 'LAHEEB' || rig === 'لهيب') { rig = 'LAHEEB'; }
      if (rig.trim() === '') { rig = 'UNASSIGNED'; }
      
      if (stats[rig]) {
        stats[rig].total++;
        if (emp.is_suspended) stats[rig].suspended++;
      }
    });
    return stats;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(e => e.name.includes(search) || e.employee_number.includes(search));
    return { items: filtered.slice(0, 50), total: filtered.length };
  }, [employees, search]);

  const openEdit = (emp: Employee) => {
    if (!isHr) return;
    setEditingEmployee(emp);
    setEditError('');
    const isCustomNat = emp.nationality && !NATIONALITIES.includes(emp.nationality);
    setEditForm({ 
      name: emp.name, 
      employee_number: emp.employee_number, 
      position: emp.position || '', 
      nationality: isCustomNat ? 'OTHER' : (emp.nationality || ''), 
      customNationality: isCustomNat ? (emp.nationality || '') : '', 
      rig: emp.rig || 'UNASSIGNED', 
      is_suspended: emp.is_suspended || false,
      joining_date: emp.joining_date || '',
      auth_expiry_date: emp.auth_expiry_date || '',
      health_cert_expiry_date: emp.health_cert_expiry_date || ''
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditLoading(true);
    setEditError('');

    const finalNat = editForm.nationality === 'OTHER' ? editForm.customNationality : editForm.nationality;

    const { error } = await supabase.from('employees').update({
      name: editForm.name, 
      employee_number: editForm.employee_number, 
      position: editForm.position, 
      nationality: finalNat, 
      rig: editForm.rig, 
      is_suspended: editForm.is_suspended, 
      joining_date: editForm.joining_date,
      auth_expiry_date: editForm.auth_expiry_date || null,
      health_cert_expiry_date: editForm.health_cert_expiry_date || null
    }).eq('id', editingEmployee.id);

    setEditLoading(false);
    if (error) return setEditError(error.message);
    
    setEditingEmployee(null);
    onRefresh();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onNavigate('crew-change')} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-amber-500/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[#a8a19b] text-sm font-bold">في أجازة الآن</div>
            <PlaneTakeoff size={24} className="text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-[#f4f0ea]">{dashboardStats.on_vacation_now}</div>
        </div>
        
        <div onClick={() => onNavigate('expiring-docs')} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-red-500/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[#a8a19b] text-sm font-bold">تصاريح تنتهي (30 يوم)</div>
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-[#f4f0ea]">{dashboardStats.expiring_docs_30d}</div>
        </div>

        <div onClick={() => onNavigate('expiring-docs')} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-emerald-500/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[#a8a19b] text-sm font-bold">شهادات صحية تنتهي</div>
            <HeartPulse size={24} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-[#f4f0ea]">{dashboardStats.expiring_health_30d}</div>
        </div>

        <div onClick={() => onNavigate('vacations')} className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-blue-500/50 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[#a8a19b] text-sm font-bold">طلبات إجازة معلقة</div>
            <Clock size={24} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-[#f4f0ea]">{dashboardStats.pending_vacations}</div>
        </div>
      </div>

      <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-[#f4f0ea] flex items-center gap-2">
            <Users size={20} className="text-[#d4b896]" />قائمة الموظفين الكاملة
          </h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-2.5 text-[#a8a19b]" size={16} />
            <input type="text" placeholder="ابحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#2a241f] border border-[#524a43] rounded-lg py-2 pr-9 pl-3 text-sm text-[#f4f0ea] focus:outline-none focus:border-[#d4b896] placeholder-[#a8a19b]" />
          </div>
        </div>

        {filteredEmployees.items.length === 0 ? (
          <div className="text-[#a8a19b] text-sm py-4">لا يوجد موظفين مطابقين للبحث.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredEmployees.items.map(emp => (
                <div key={emp.id} onClick={() => openEdit(emp)} className={`bg-[#2a241f]/80 border border-[#524a43]/50 p-3 rounded-lg flex justify-between items-center text-sm transition-all ${isHr ? 'cursor-pointer hover:border-[#d4b896]/60 hover:bg-[#3a332d]' : ''}`}>
                  <div className="flex flex-col overflow-hidden text-right">
                    <span className="text-[#f4f0ea] truncate pr-2 font-bold">{emp.name}</span>
                    <span className="text-[#a8a19b] text-xs mt-1 pr-2">التصريح: {emp.auth_expiry_date || '-'} | الصحية: {emp.health_cert_expiry_date || '-'}</span>
                  </div>
                  <span className="text-[#a8a19b] font-mono bg-[#1C1815] px-2 py-0.5 rounded text-xs shrink-0">{emp.employee_number}</span>
                </div>
              ))}
            </div>
            {filteredEmployees.total > 50 && (
              <div className="text-center mt-4 text-xs text-[#a8a19b] bg-[#1C1815]/50 p-2 rounded-lg border border-[#524a43]/30">
                يتم عرض أول 50 موظف فقط. استخدم البحث للوصول لبقية الموظفين.
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#f4f0ea] mb-4">إحصائيات الحفارات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ALL_RIGS.map(rig => {
            const isUnassigned = rig.id === 'UNASSIGNED';
            return (
              <div key={rig.id} onClick={() => onRigClick(rig.id)} className={`border p-4 rounded-xl cursor-pointer transition-all hover:bg-[#4a4038] shadow-lg ${isUnassigned ? 'bg-amber-900/10 border-amber-600/40 hover:border-amber-500/60' : 'bg-[#3a332d] border-[#524a43] hover:border-[#d4b896]/50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-bold text-lg ${isUnassigned ? 'text-amber-400' : 'text-[#d4b896]'}`}>{rig.label}</span>
                  {isUnassigned ? <AlertTriangle size={20} className="text-amber-500/70" /> : <Users size={20} className="text-[#a8a19b]" />}
                </div>
                <div className={`text-2xl font-bold ${isUnassigned ? 'text-amber-400' : 'text-[#f4f0ea]'}`}>{rigStats[rig.id].total}</div>
                <div className="text-xs text-[#a8a19b]">موظف</div>
                {rigStats[rig.id].suspended > 0 && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertTriangle size={12} /><span>{rigStats[rig.id].suspended} موقوف</span></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editingEmployee && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <form onSubmit={handleEdit} className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">تعديل بيانات الموظف</h3>
              <button type="button" onClick={() => setEditingEmployee(null)} className="text-[#a8a19b] hover:text-[#f4f0ea] transition-colors"><X size={20} /></button>
            </div>
            {editError && <div className="bg-red-900/20 text-red-400 border border-red-900/30 p-3 rounded-lg text-sm">{editError}</div>}
            
            <div className="space-y-3">
              <div><label className="text-xs text-[#d4b896] mb-1 block font-bold">الاسم الكامل</label><input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" /></div>
              <div><label className="text-xs text-[#d4b896] mb-1 block font-bold">الرقم الوظيفي</label><input type="text" required value={editForm.employee_number} onChange={e => setEditForm({...editForm, employee_number: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" /></div>
              <div><label className="text-xs text-[#d4b896] mb-1 block font-bold">الوظيفة</label><input type="text" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" /></div>
              
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">الجنسية</label>
                <select value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none">
                  <option value="" disabled>الجنسية</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {editForm.nationality === 'OTHER' && (
                  <input type="text" placeholder="اكتب الجنسية" required value={editForm.customNationality} onChange={e => setEditForm({...editForm, customNationality: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none mt-2" />
                )}
              </div>
              
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">الحفارة / المجموعة</label>
                <select value={editForm.rig} onChange={e => setEditForm({...editForm, rig: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none">
                  {ALL_RIGS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ التعيين</label>
                <input type="date" value={editForm.joining_date} onChange={e => setEditForm({...editForm, joining_date: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" style={{ colorScheme: 'dark' }} />
              </div>

              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ انتهاء التصريح</label>
                <input type="date" value={editForm.auth_expiry_date} onChange={e => setEditForm({...editForm, auth_expiry_date: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" style={{ colorScheme: 'dark' }} />
              </div>

              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">تاريخ الشهادة الصحية</label>
                <input type="date" value={editForm.health_cert_expiry_date} onChange={e => setEditForm({...editForm, health_cert_expiry_date: e.target.value})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" style={{ colorScheme: 'dark' }} />
              </div>
              
              <div>
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">الحالة</label>
                <select value={editForm.is_suspended ? 'true' : 'false'} onChange={e => setEditForm({...editForm, is_suspended: e.target.value === 'true'})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none">
                  <option value="false">نشط</option>
                  <option value="true">موقوف</option>
                </select>
              </div>
            </div>
            
            <button type="submit" disabled={editLoading} className="w-full bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 shadow-md sticky bottom-0">
              {editLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ التعديلات'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
