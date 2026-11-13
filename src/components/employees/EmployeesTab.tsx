import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Employee } from '@/types';
import { ChevronDown, ChevronRight, Search, UserPlus, Phone, X, Loader2, Edit2, Palmtree, UserMinus, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NATIONALITIES } from '@/data/mock';

const ALL_RIGS = ['B2', 'B3', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'LAHEEB', 'UNASSIGNED'];

interface Props {
  employees: Employee[];
  onRefresh: () => void;
  isHr: boolean;
  userRig: string | null;
  initialRig?: string | null;
}

export default function EmployeesTab({ employees, onRefresh, isHr, userRig, initialRig }: Props) {
  const [search, setSearch] = useState('');
  const [expandedRigs, setExpandedRigs] = useState<string[]>(userRig ? [userRig] : []);
  const [showContact, setShowContact] = useState(false);
  const [activeVacations, setActiveVacations] = useState<string[]>([]);
  const [vacationLoading, setVacationLoading] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: userRig || 'B2' });

  const [isAddingReq, setIsAddingReq] = useState(false);
  const [addReqLoading, setAddReqLoading] = useState(false);
  const [addReqForm, setAddReqForm] = useState({ name: '', employee_number: '', position: '', nationality: '', customNationality: '' });
  const [allDbEmployees, setAllDbEmployees] = useState<Employee[]>([]);
  const [searchReq, setSearchReq] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: '', is_suspended: false });

  const fetchActiveVacations = async () => {
    const { data } = await supabase.from('vacation_requests').select('employee_number').in('status', ['pending', 'approved']);
    if (data) setActiveVacations(data.map(r => r.employee_number));
  };

  useEffect(() => {
    fetchActiveVacations();
  }, []);

  useEffect(() => {
    if (initialRig && !expandedRigs.includes(initialRig)) setExpandedRigs(prev => [...prev, initialRig]);
  }, [initialRig]);

  useEffect(() => {
    if (isAddingReq) {
      supabase.from('employees').select('*').then(({ data }) => {
        if (data) setAllDbEmployees(data as Employee[]);
      });
    }
  }, [isAddingReq]);

  const toggleRig = (rig: string) => setExpandedRigs(prev => prev.includes(rig) ? prev.filter(r => r !== rig) : [...prev, rig]);

  const filtered = employees.filter(e => e.name.includes(search) || e.employee_number.includes(search) || (e.position && e.position.toLowerCase().includes(search.toLowerCase())));

  const grouped = filtered.reduce((acc, emp) => {
    let rig = emp.rig || 'UNASSIGNED';
    if (rig === 'ساحة اللهيب' || rig === 'الهيب' || rig === 'laheeb' || rig === 'لهيب') rig = 'LAHEEB';
    if (rig.trim() === '') rig = 'UNASSIGNED';
    if (!acc[rig]) acc[rig] = [];
    acc[rig].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  const assignedRigs = ALL_RIGS.filter(rig => rig !== 'UNASSIGNED' && grouped[rig] && grouped[rig].length > 0);
  const unassignedEmployees = grouped['UNASSIGNED'] || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    const finalNat = addForm.nationality === 'OTHER' ? addForm.customNationality : addForm.nationality;
    const { error } = await supabase.from('employees').insert({ name: addForm.name, employee_number: addForm.employee_number, position: addForm.position, nationality: finalNat, rig: addForm.rig });
    setAddLoading(false);
    if (error) return setAddError(error.message);
    setIsAdding(false);
    setAddForm({ name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: userRig || 'B2' });
    onRefresh();
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRig) return;
    if (!addReqForm.employee_number) return alert("Please search and select an employee first.");
    setAddReqLoading(true);
    const finalNat = addReqForm.nationality === 'OTHER' ? addReqForm.customNationality : addReqForm.nationality;
    const { error } = await supabase.from('employee_requests').insert({ name: addReqForm.name, employee_number: addReqForm.employee_number, position: addReqForm.position, nationality: finalNat, rig: userRig, requested_by: (await supabase.auth.getUser()).data.user?.id, request_type: 'ADD' });
    setAddReqLoading(false);
    if (error) alert(error.message);
    else {
      alert("تم إرسال طلب إضافة الموظف إلى الموارد البشرية.");
      setIsAddingReq(false);
      setAddReqForm({ name: '', employee_number: '', position: '', nationality: '', customNationality: '' });
      setSearchReq('');
    }
  };

  const handleRemoveRequest = async (emp: Employee) => {
    const confirmed = window.confirm(`هل أنت متأكد من طلب إزالة الموظف "${emp.name}" من ${emp.rig}؟\n\nسيتم إرسال الطلب إلى الموارد البشرية للموافقة أو الرفض.`);
    if (!confirmed) return;
    const { error } = await supabase.from('employee_requests').insert({ name: emp.name, employee_number: emp.employee_number, position: emp.position, nationality: emp.nationality, rig: emp.rig, requested_by: (await supabase.auth.getUser()).data.user?.id, request_type: 'REMOVE' });
    if (error) alert("Error: " + error.message);
    else alert("تم إرسال طلب الإزالة إلى الموارد البشرية.");
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditError('');
    const isCustomNat = emp.nationality && !NATIONALITIES.includes(emp.nationality);
    setEditForm({ name: emp.name, employee_number: emp.employee_number, position: emp.position || '', nationality: isCustomNat ? 'OTHER' : (emp.nationality || ''), customNationality: isCustomNat ? (emp.nationality || '') : '', rig: emp.rig || 'UNASSIGNED', is_suspended: emp.is_suspended || false });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditLoading(true);
    setEditError('');
    const finalNat = editForm.nationality === 'OTHER' ? editForm.customNationality : editForm.nationality;
    const { error } = await supabase.from('employees').update({ name: editForm.name, employee_number: editForm.employee_number, position: editForm.position, nationality: finalNat, rig: editForm.rig, is_suspended: editForm.is_suspended }).eq('id', editingEmployee.id);
    setEditLoading(false);
    if (error) return setEditError(error.message);
    setEditingEmployee(null);
    onRefresh();
  };

  const handleVacationRequest = async (emp: Employee) => {
    setVacationLoading(emp.id);
    const { error } = await supabase.from('vacation_requests').insert({ employee_number: emp.employee_number, employee_name: emp.name, rig: emp.rig, requested_by: (await supabase.auth.getUser()).data.user?.id });
    setVacationLoading(null);
    if (error) alert("Error: " + error.message);
    else {
      alert("تم إرسال طلب الإجازة بنجاح إلى الموارد البشرية.");
      fetchActiveVacations();
    }
  };

  const handleExportCSV = () => {
    if (!isHr) return;
    const headers = ['Employee Number', 'Name', 'Position', 'Nationality', 'Rig', 'Phone', 'Status'];
    const rows = employees.map(emp => [emp.employee_number || '', emp.name || '', emp.position || '', emp.nationality || '', emp.rig || '', emp.phone || '', emp.is_suspended ? 'Suspended' : 'Active']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `H&E_Employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderEmployeeTable = (rigEmployees: Employee[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="bg-[#1C1815] text-[#d4b896] border-b border-[#524a43]">
          <tr>
            <th className="px-6 py-4 font-bold tracking-wider">الاسم</th>
            <th className="px-6 py-4 font-bold tracking-wider">الرقم الوظيفي</th>
            <th className="px-6 py-4 font-bold tracking-wider">الوظيفة</th>
            <th className="px-6 py-4 font-bold tracking-wider">الجنسية</th>
            <th className="px-6 py-4 font-bold tracking-wider">الحالة</th>
            {showContact && <th className="px-6 py-4 font-bold tracking-wider">الهاتف</th>}
            <th className="px-6 py-4 font-bold tracking-wider text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#524a43]">
          {rigEmployees.map(emp => {
            const hasActiveRequest = activeVacations.includes(emp.employee_number);
            return (
              <tr key={emp.id} className="bg-[#2a241f] hover:bg-[#4a4038] transition-colors">
                <td className="px-6 py-4 text-[#f4f0ea] font-medium">{emp.name}</td>
                <td className="px-6 py-4 text-[#a8a19b] font-mono">{emp.employee_number}</td>
                <td className="px-6 py-4 text-[#f4f0ea]">{emp.position}</td>
                <td className="px-6 py-4 text-[#a8a19b]">{emp.nationality}</td>
                <td className="px-6 py-4">
                  {emp.is_suspended ? <span className="text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-md text-xs font-bold">موقوف</span> : <span className="text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-md text-xs font-bold">نشط</span>}
                </td>
                {showContact && (
                  <td className="px-6 py-4 text-[#a8a19b] font-mono flex items-center gap-2">
                    <Phone size={14} className="text-[#d4b896]" /> {emp.phone || 'غير مسجل'}
                  </td>
                )}
                <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                  {isHr && (
                    <button onClick={() => openEdit(emp)} className="p-2 bg-[#3a332d] hover:bg-[#524a43] border border-[#524a43] text-[#d4b896] rounded-lg transition-colors shadow-sm" title="تعديل">
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button onClick={() => handleVacationRequest(emp)} disabled={vacationLoading === emp.id || hasActiveRequest} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${hasActiveRequest ? 'bg-[#3a332d] text-[#a8a19b] border-[#524a43] cursor-not-allowed' : 'bg-amber-600/20 text-amber-500 border-amber-600/30 hover:bg-amber-600/30'}`}>
                    {vacationLoading === emp.id ? <Loader2 size={14} className="animate-spin" /> : <Palmtree size={14} />}
                    {hasActiveRequest ? 'قيد الإجراء' : 'طلب إجازة'}
                  </button>
                  {!isHr && (
                    <button onClick={() => handleRemoveRequest(emp)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/40 transition-all flex items-center gap-1.5 shadow-sm" title="طلب إزالة الموظف">
                      <UserMinus size={14} /> إزالة
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#2a241f] p-4 rounded-xl border border-[#524a43] shadow-lg">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3 text-[#a8a19b]" size={18} />
          <input type="text" placeholder="ابحث بالاسم أو الرقم الوظيفي..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 pr-10 pl-3 text-[#f4f0ea] focus:outline-none focus:border-[#d4b896] placeholder-[#a8a19b]" />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#f4f0ea]">
            <input type="checkbox" checked={showContact} onChange={e => setShowContact(e.target.checked)} className="rounded border-[#524a43] bg-[#3a332d] text-[#d4b896] focus:ring-[#d4b896]" />
            عرض أرقام الهواتف
          </label>

          {isHr && (
            <>
              <button onClick={handleExportCSV} className="bg-[#2a241f] hover:bg-[#1C1815] text-[#d4b896] border border-[#524a43] px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
                <Download size={16} /> تصدير CSV
              </button>
              <button onClick={() => setIsAdding(true)} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2">
                <UserPlus size={16} /> إضافة موظف
              </button>
            </>
          )}

          {!isHr && (
            <button onClick={() => setIsAddingReq(true)} className="bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2">
              <UserPlus size={16} /> طلب إضافة موظف
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {assignedRigs.length === 0 && unassignedEmployees.length === 0 ? (
          <div className="text-center text-[#a8a19b] py-8 bg-[#2a241f] rounded-xl border border-[#524a43]">لا يوجد موظفين لعرضهم.</div>
        ) : (
          <>
            {assignedRigs.map(rig => {
              const isExpanded = expandedRigs.includes(rig);
              const rigEmployees = grouped[rig] || [];
              return (
                <div key={rig} className="bg-[#3a332d] border border-[#524a43] rounded-xl overflow-hidden shadow-xl">
                  <button onClick={() => toggleRig(rig)} className="w-full px-6 py-4 flex items-center justify-between bg-[#2a241f] hover:bg-[#4a4038] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#524a43] p-2 rounded-lg text-[#d4b896] shadow-sm">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                      <span className="text-lg font-bold text-[#f4f0ea]">{rig === 'LAHEEB' ? 'ساحة اللهيب' : `حفارة ${rig}`}</span>
                      <span className="bg-[#1C1815] text-[#d4b896] border border-[#524a43] text-xs py-1 px-2.5 rounded-full shadow-inner">
                        {rigEmployees.length} موظف
                      </span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#524a43]">
                      {renderEmployeeTable(rigEmployees)}
                    </div>
                  )}
                </div>
              );
            })}

            {unassignedEmployees.length > 0 && (
              <div className="bg-[#2a241f] border-2 border-amber-600/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(217,119,6,0.15)] mt-8">
                <button onClick={() => toggleRig('UNASSIGNED')} className="w-full px-6 py-4 flex items-center justify-between bg-amber-900/20 hover:bg-amber-900/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-600/20 p-2 rounded-lg text-amber-500 shadow-sm">
                      {expandedRigs.includes('UNASSIGNED') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-lg font-bold text-amber-400 flex items-center gap-2">
                        <AlertCircle size={18} /> موظفين غير محددين (تحتاج إلى تعيين)
                      </span>
                    </div>
                    <span className="bg-[#1C1815] text-amber-500 border border-amber-600/30 text-xs py-1 px-2.5 rounded-full shadow-inner">
                      {unassignedEmployees.length} موظف
                    </span>
                  </div>
                </button>
                {expandedRigs.includes('UNASSIGNED') && (
                  <div className="border-t border-amber-600/30">
                    {renderEmployeeTable(unassignedEmployees)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS VIA PORTAL */}
      {isAdding && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <form onSubmit={handleAdd} className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">إضافة موظف جديد</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-[#a8a19b] hover:text-[#f4f0ea] transition-colors"><X size={20} /></button>
            </div>
            {addError && <div className="bg-red-900/20 text-red-400 border border-red-900/30 p-3 rounded-lg text-sm">{addError}</div>}
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

      {isAddingReq && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <form onSubmit={handleAddRequest} className="bg-[#2a241f] rounded-xl border border-[#524a43] w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-[#524a43] pb-3">
              <h3 className="text-lg font-bold text-[#f4f0ea]">طلب إضافة موظف إلى {userRig}</h3>
              <button type="button" onClick={() => setIsAddingReq(false)} className="text-[#a8a19b] hover:text-[#f4f0ea] transition-colors"><X size={20} /></button>
            </div>
            <div className="relative pb-2">
              <label className="text-xs text-[#d4b896] mb-1 block font-bold">ابحث عن موظف موجود لتعبئة البيانات</label>
              <input type="text" placeholder="ابحث بالاسم أو الرقم..." value={searchReq} onChange={e => setSearchReq(e.target.value)} className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2 px-3 text-[#f4f0ea] focus:border-[#d4b896] focus:outline-none" />
              {searchReq.length >= 2 && !addReqForm.employee_number && (
                <div className="absolute z-10 w-full mt-1 bg-[#1C1815] border border-[#524a43] rounded-lg max-h-40 overflow-y-auto shadow-xl">
                  {allDbEmployees.filter(e => e.name.includes(searchReq) || e.employee_number.includes(searchReq)).map(emp => (
                    <div key={emp.id} onClick={() => { const isCustomNat = emp.nationality && !NATIONALITIES.includes(emp.nationality); setAddReqForm({ name: emp.name, employee_number: emp.employee_number, position: emp.position || '', nationality: isCustomNat ? 'OTHER' : (emp.nationality || ''), customNationality: isCustomNat ? (emp.nationality || '') : '' }); setSearchReq(''); }} className="p-2.5 hover:bg-[#3a332d] cursor-pointer text-sm text-[#f4f0ea] border-b border-[#524a43]/50 last:border-0 transition-colors">
                      {emp.name} - {emp.employee_number} ({emp.rig})
                    </div>
                  ))}
                </div>
              )}
            </div>
            {addReqForm.employee_number && (
              <div className="bg-[#3a332d] border border-[#524a43] p-4 rounded-lg space-y-2 relative shadow-inner">
                <button type="button" onClick={() => setAddReqForm({ name: '', employee_number: '', position: '', nationality: '', customNationality: '' })} className="absolute top-2 left-2 text-[#a8a19b] hover:text-[#f4f0ea] transition-colors"><X size={16} /></button>
                <div className="text-[#f4f0ea] font-bold text-lg">{addReqForm.name}</div>
                <div className="text-sm text-[#a8a19b]">{addReqForm.employee_number} • {addReqForm.position} • {addReqForm.nationality}</div>
              </div>
            )}
            <button type="submit" disabled={addReqLoading || !addReqForm.employee_number} className="w-full bg-[#d4b896] hover:bg-[#c4a886] text-[#2a241f] font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 shadow-md disabled:opacity-50">
              {addReqLoading ? <Loader2 className="animate-spin" size={18} /> : 'إرسال الطلب إلى HR'}
            </button>
          </form>
        </div>,
        document.body
      )}

      {editingEmployee && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
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
                  {ALL_RIGS.map(r => <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>)}
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
        </div>,
        document.body
      )}
    </div>
  );
}
