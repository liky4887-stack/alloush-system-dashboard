import { useState } from 'react';
import { CpoRequest, Employee, Tab } from '@/types';
import { Users, AlertTriangle, Clock, Search, Edit2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NATIONALITIES } from '@/data/mock';

const ALL_RIGS = [
  { id: 'B2', label: 'B2' },
  { id: 'B3', label: 'B3' },
  { id: 'B5', label: 'B5' },
  { id: 'B6', label: 'B6' },
  { id: 'B7', label: 'B7' },
  { id: 'B8', label: 'B8' },
  { id: 'B9', label: 'B9' },
  { id: 'B10', label: 'B10' },
  { id: 'B11', label: 'B11' },
  { id: 'LAHEEB', label: 'ساحة اللهيب' },
  { id: 'UNASSIGNED', label: 'غير محدد' },
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
  
  // Edit Modal State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: '', is_suspended: false
  });

  const totalEmployees = employees.length;
  const totalSuspended = employees.filter(e => e.is_suspended).length;
  const totalPending = requests.filter(r => r.status === 'pending').length;

  const rigStats: Record<string, { total: number, suspended: number }> = {};
  ALL_RIGS.forEach(rig => { rigStats[rig.id] = { total: 0, suspended: 0 }; });

  employees.forEach(emp => {
    let rig = emp.rig || 'UNASSIGNED'; // Default to UNASSIGNED instead of B2
    if (rig === 'ساحة اللهيب' || rig === 'الهيب' || rig === 'laheeb' || rig === 'LAHEEB' || rig === 'لهيب') { rig = 'LAHEEB'; }
    if (rig.trim() === '') { rig = 'UNASSIGNED'; }
    
    if (rigStats[rig]) {
      rigStats[rig].total++;
      if (emp.is_suspended) rigStats[rig].suspended++;
    }
  });

  const filteredEmployees = employees.filter(e =>
    e.name.includes(search) || e.employee_number.includes(search)
  );

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
      is_suspended: emp.is_suspended || false 
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditLoading(true);
    setEditError('');

    const finalNat = editForm.nationality === 'OTHER' ? editForm.customNationality : editForm.nationality;

    const { error } = await supabase.from('employees').update({
      name: editForm.name, employee_number: editForm.employee_number, position: editForm.position, nationality: finalNat, rig: editForm.rig, is_suspended: editForm.is_suspended
    }).eq('id', editingEmployee.id);

    setEditLoading(false);
    if (error) return setEditError(error.message);
    
    setEditingEmployee(null);
    onRefresh();
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Stat Cards - Now Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('employees')}
          className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-[#d4b896]/50 shadow-lg"
        >
          <div><div className="text-[#a8a19b] text-sm mb-1">إجمالي الموظفين</div><div className="text-3xl font-bold text-[#f4f0ea]">{totalEmployees}</div></div>
          <Users size={32} className="text-[#d4b896]" />
        </div>
        <div 
          onClick={() => onNavigate('emp-requests')}
          className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-[#d4b896]/50 shadow-lg"
        >
          <div><div className="text-[#a8a19b] text-sm mb-1">الطلبات المعلقة</div><div className="text-3xl font-bold text-[#f4f0ea]">{totalPending}</div></div>
          <Clock size={32} className="text-amber-500" />
        </div>
        <div 
          onClick={() => onNavigate('employees')}
          className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 flex items-center justify-between cursor-pointer transition-all hover:bg-[#4a4038] hover:border-[#d4b896]/50 shadow-lg"
        >
          <div><div className="text-[#a8a19b] text-sm mb-1">الموظفين الموقوفين</div><div className="text-3xl font-bold text-[#f4f0ea]">{totalSuspended}</div></div>
          <AlertTriangle size={32} className="text-red-500" />
        </div>
      </div>

      {/* Full Employee List with Search */}
      <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold text-[#f4f0ea] flex items-center gap-2">
            <Users size={20} className="text-[#d4b896]" />قائمة الموظفين الكاملة
          </h3>
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
        
        {filteredEmployees.length === 0 ? (
          <div className="text-[#a8a19b] text-sm py-4">لا يوجد موظفين مطابقين للبحث.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredEmployees.map(emp => (
              <div 
                key={emp.id} 
                onClick={() => openEdit(emp)}
                className={`bg-[#2a241f]/80 border border-[#524a43]/50 p-3 rounded-lg flex justify-between items-center text-sm transition-all ${
                  isHr ? 'cursor-pointer hover:border-[#d4b896]/60 hover:bg-[#3a332d]' : ''
                }`}
              >
                <span className="text-[#f4f0ea] truncate pr-2">{emp.name}</span>
                <span className="text-[#a8a19b] font-mono bg-[#1C1815] px-2 py-0.5 rounded text-xs shrink-0">{emp.employee_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rig Stats */}
      <div>
        <h3 className="text-lg font-bold text-[#f4f0ea] mb-4">إحصائيات الحفارات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ALL_RIGS.map(rig => {
            const isUnassigned = rig.id === 'UNASSIGNED';
            return (
              <div 
                key={rig.id} 
                onClick={() => onRigClick(rig.id)} 
                className={`border p-4 rounded-xl cursor-pointer transition-all hover:bg-[#4a4038] shadow-lg ${
                  isUnassigned 
                    ? 'bg-amber-900/10 border-amber-600/40 hover:border-amber-500/60' 
                    : 'bg-[#3a332d] border-[#524a43] hover:border-[#d4b896]/50'
                }`}
              >
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

      {/* HR Edit Modal directly inside Overview */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <form onSubmit={handleEdit} className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
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
                <label className="text-xs text-[#d4b896] mb-1 block font-bold">الحالة</label>
                <select value={editForm.is_suspended ? 'true' : 'false'} onChange={e => setEditForm({...editForm, is_suspended: e.target.value === 'true'})} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none">
                  <option value="false">نشط</option>
                  <option value="true">موقوف</option>
                </select>
              </div>
            </div>
            
            <button type="submit" disabled={editLoading} className="w-full bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 shadow-md">
              {editLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ التعديلات'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
