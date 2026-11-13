import { useState, useEffect } from 'react';
import { Employee } from '@/types';
import { ChevronDown, ChevronRight, Search, UserPlus, Phone, X, Loader2, Edit2, Palmtree, UserMinus } from 'lucide-react';
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
  const [addForm, setAddForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: userRig || 'B2'
  });

  // Request Add/Remove Employee State
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [addReqLoading, setAddReqLoading] = useState(false);
  const [addReqForm, setAddReqForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', customNationality: ''
  });
  const [allDbEmployees, setAllDbEmployees] = useState<Employee[]>([]);
  const [searchReq, setSearchReq] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', customNationality: '', rig: '', is_suspended: false
  });

  const fetchActiveVacations = async () => {
    const { data } = await supabase.from('vacation_requests').select('employee_number').in('status', ['pending', 'approved']);
    if (data) setActiveVacations(data.map(r => r.employee_number));
  };

  useEffect(() => {
    fetchActiveVacations();
  }, []);

  useEffect(() => {
    if (initialRig && !expandedRigs.includes(initialRig)) {
      setExpandedRigs(prev => [...prev, initialRig]);
    }
  }, [initialRig]);

  useEffect(() => {
    if (isAddingReq) {
      supabase.from('employees').select('*').then(({ data }) => {
        if (data) setAllDbEmployees(data as Employee[]);
      });
    }
  }, [isAddingReq]);

  const toggleRig = (rig: string) => {
    setExpandedRigs(prev => prev.includes(rig) ? prev.filter(r => r !== rig) : [...prev, rig]);
  };

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.employee_number.includes(search) || (e.position && e.position.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = filtered.reduce((acc, emp) => {
    let rig = emp.rig || 'UNASSIGNED';
    if (rig === 'ساحة اللهيب' || rig === 'الهيب' || rig === 'laheeb' || rig === 'لهيب') rig = 'LAHEEB';
    if (!acc[rig]) acc[rig] = [];
    acc[rig].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  const sortedRigs = ALL_RIGS.filter(rig => grouped[rig] && grouped[rig].length > 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    
    const finalNat = addForm.nationality === 'OTHER' ? addForm.customNationality : addForm.nationality;

    const { error } = await supabase.from('employees').insert({
      name: addForm.name, employee_number: addForm.employee_number, position: addForm.position, nationality: finalNat, rig: addForm.rig
    });
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

    const { error } = await supabase.from('employee_requests').insert({
      name: addReqForm.name, employee_number: addReqForm.employee_number, position: addReqForm.position, nationality: finalNat, rig: userRig, requested_by: (await supabase.auth.getUser()).data.user?.id, request_type: 'ADD'
    });
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
    
    const { error } = await supabase.from('employee_requests').insert({
      name: emp.name, employee_number: emp.employee_number, position: emp.position, nationality: emp.nationality, rig: emp.rig, requested_by: (await supabase.auth.getUser()).data.user?.id, request_type: 'REMOVE'
    });
    
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

    const { error } = await supabase.from('employees').update({
      name: editForm.name, employee_number: editForm.employee_number, position: editForm.position, nationality: finalNat, rig: editForm.rig, is_suspended: editForm.is_suspended
    }).eq('id', editingEmployee.id);
    setEditLoading(false);
    if (error) return setEditError(error.message);
    setEditingEmployee(null);
    onRefresh();
  };

  const handleVacationRequest = async (emp: Employee) => {
    setVacationLoading(emp.id);
    const { error } = await supabase.from('vacation_requests').insert({
      employee_number: emp.employee_number, employee_name: emp.name, rig: emp.rig, requested_by: (await supabase.auth.getUser()).data.user?.id,
    });
    setVacationLoading(null);
    if (error) alert("Error: " + error.message);
    else {
      alert("تم إرسال طلب الإجازة بنجاح إلى الموارد البشرية.");
      fetchActiveVacations();
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card/50 p-4 rounded-xl border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3 text-zinc-500" size={18} />
          <input type="text" placeholder="ابحث بالاسم أو الرقم الوظيفي..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-muted border border-border rounded-lg py-2 pr-10 pl-3 text-foreground focus:outline-none focus:border-emerald-500" />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            <input type="checkbox" checked={showContact} onChange={e => setShowContact(e.target.checked)} className="rounded border-border bg-muted text-emerald-500" />
            عرض أرقام الهواتف
          </label>

          {isHr ? (
            <button onClick={() => setIsAdding(true)} className="bg-emerald-600 hover:bg-emerald-500 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <UserPlus size={16} /> إضافة موظف
            </button>
          ) : (
            <button onClick={() => setIsAddingReq(true)} className="bg-blue-600 hover:bg-blue-500 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <UserPlus size={16} /> طلب إضافة موظف
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedRigs.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 bg-card/50 rounded-xl border border-border">لا يوجد موظفين لعرضهم.</div>
        ) : (
          sortedRigs.map(rig => {
            const isExpanded = expandedRigs.includes(rig);
            const rigEmployees = grouped[rig] || [];
            return (
              <div key={rig} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => toggleRig(rig)} className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-700/50 p-2 rounded-lg text-emerald-500">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <span className="text-lg font-bold text-zinc-100">{rig === 'LAHEEB' ? 'ساحة اللهيب' : rig === 'UNASSIGNED' ? 'غير محدد' : `حفارة ${rig}`}</span>
                    <span className="bg-zinc-700 text-zinc-300 text-xs py-1 px-2.5 rounded-full">{rigEmployees.length} موظف</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-card/80 text-muted-foreground border-b border-border">
                          <tr>
                            <th className="px-6 py-3 font-medium">الاسم</th>
                            <th className="px-6 py-3 font-medium">الرقم الوظيفي</th>
                            <th className="px-6 py-3 font-medium">الوظيفة</th>
                            <th className="px-6 py-3 font-medium">الجنسية</th>
                            <th className="px-6 py-3 font-medium">الحالة</th>
                            {showContact && <th className="px-6 py-3 font-medium">الهاتف</th>}
                            <th className="px-6 py-3 font-medium text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {rigEmployees.map(emp => {
                            const hasActiveRequest = activeVacations.includes(emp.employee_number);
                            return (
                              <tr key={emp.id} className="hover:bg-muted/20">
                                <td className="px-6 py-3 text-foreground">{emp.name}</td>
                                <td className="px-6 py-3 text-muted-foreground font-mono">{emp.employee_number}</td>
                                <td className="px-6 py-3 text-muted-foreground">{emp.position}</td>
                                <td className="px-6 py-3 text-muted-foreground">{emp.nationality}</td>
                                <td className="px-6 py-3">
                                  {emp.is_suspended ? <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs">موقوف</span> : <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs">نشط</span>}
                                </td>
                                {showContact && (
                                  <td className="px-6 py-3 text-muted-foreground font-mono flex items-center gap-2">
                                    <Phone size={14} className="text-zinc-500" /> {emp.phone || 'غير مسجل'}
                                  </td>
                                )}
                                <td className="px-6 py-3 text-center flex items-center justify-center gap-2">
                                  {isHr && (
                                    <button onClick={() => openEdit(emp)} className="p-1.5 bg-muted hover:bg-zinc-700 text-emerald-500 rounded transition-colors" title="تعديل">
                                      <Edit2 size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleVacationRequest(emp)}
                                    disabled={vacationLoading === emp.id || hasActiveRequest}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                                      hasActiveRequest ? 'bg-muted text-zinc-500 cursor-not-allowed border border-border' : 'bg-amber-600 hover:bg-amber-500 text-foreground disabled:opacity-50'
                                    }`}
                                  >
                                    {vacationLoading === emp.id ? <Loader2 size={14} className="animate-spin" /> : <Palmtree size={14} />}
                                    {hasActiveRequest ? 'قيد الإجراء' : 'طلب إجازة'}
                                  </button>
                                  {!isHr && (
                                    <button
                                      onClick={() => handleRemoveRequest(emp)}
                                      className="px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                      title="طلب إزالة الموظف من الحفارة"
                                    >
                                      <UserMinus size={14} />
                                      إزالة
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* HR Add Employee Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-card rounded-xl border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">إضافة موظف</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-foreground"><X size={20} /></button>
            </div>
            {addError && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm">{addError}</div>}
            <div className="space-y-3">
              <input type="text" placeholder="الاسم الكامل" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" />
              <input type="text" placeholder="الرقم الوظيفي" required value={addForm.employee_number} onChange={e => setAddForm({...addForm, employee_number: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" />
              <input type="text" placeholder="الوظيفة" value={addForm.position} onChange={e => setAddForm({...addForm, position: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" />
              <select value={addForm.nationality} onChange={e => setAddForm({...addForm, nationality: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500">
                <option value="" disabled>الجنسية</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {addForm.nationality === 'OTHER' && (
                <input type="text" placeholder="اكتب الجنسية" required value={addForm.customNationality} onChange={e => setAddForm({...addForm, customNationality: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" />
              )}
              <select value={addForm.rig} onChange={e => setAddForm({...addForm, rig: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500">
                {ALL_RIGS.map(r => <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>)}
              </select>
            </div>
            <button type="submit" disabled={addLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-foreground font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4">
              {addLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ'}
            </button>
          </form>
        </div>
      )}

      {/* Supervisor Request Add Employee Modal */}
      {isAddingReq && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddRequest} className="bg-card rounded-xl border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">طلب إضافة موظف إلى {userRig}</h3>
              <button type="button" onClick={() => setIsAddingReq(false)} className="text-zinc-500 hover:text-foreground"><X size={20} /></button>
            </div>

            <div className="relative pb-2">
              <label className="text-xs text-blue-400 mb-1 block">ابحث عن موظف موجود (لتعبئة البيانات تلقائياً)</label>
              <input
                type="text"
                placeholder="ابحث بالاسم أو الرقم..."
                value={searchReq}
                onChange={e => setSearchReq(e.target.value)}
                className="w-full bg-muted border border-blue-900/50 rounded-lg py-2 px-3 text-foreground focus:border-blue-500"
              />
              {searchReq.length >= 2 && !addReqForm.employee_number && (
                <div className="absolute z-10 w-full mt-1 bg-muted border border-border rounded-lg max-h-40 overflow-y-auto shadow-xl">
                  {allDbEmployees
                    .filter(e => e.name.includes(searchReq) || e.employee_number.includes(searchReq))
                    .map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          const isCustomNat = emp.nationality && !NATIONALITIES.includes(emp.nationality);
                          setAddReqForm({
                            name: emp.name,
                            employee_number: emp.employee_number,
                            position: emp.position || '',
                            nationality: isCustomNat ? 'OTHER' : (emp.nationality || ''),
                            customNationality: isCustomNat ? (emp.nationality || '') : ''
                          });
                          setSearchReq('');
                        }}
                        className="p-2 hover:bg-zinc-700 cursor-pointer text-sm text-foreground border-b border-border/50 last:border-0"
                      >
                        {emp.name} - {emp.employee_number} ({emp.rig})
                      </div>
                    ))}
                  {allDbEmployees.filter(e => e.name.includes(searchReq) || e.employee_number.includes(searchReq)).length === 0 && (
                    <div className="p-2 text-sm text-zinc-500">لا يوجد موظف مطابق.</div>
                  )}
                </div>
              )}
            </div>

            {addReqForm.employee_number && (
              <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-2 relative">
                <button type="button" onClick={() => setAddReqForm({ name: '', employee_number: '', position: '', nationality: '', customNationality: '' })} className="absolute top-2 left-2 text-zinc-500 hover:text-foreground"><X size={16} /></button>
                <div className="text-foreground font-bold text-lg">{addReqForm.name}</div>
                <div className="text-sm text-muted-foreground">{addReqForm.employee_number} • {addReqForm.position} • {addReqForm.nationality}</div>
              </div>
            )}

            <button type="submit" disabled={addReqLoading || !addReqForm.employee_number} className="w-full bg-blue-600 hover:bg-blue-500 text-foreground font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4 disabled:opacity-50">
              {addReqLoading ? <Loader2 className="animate-spin" size={18} /> : 'إرسال الطلب إلى HR'}
            </button>
          </form>
        </div>
      )}

      {/* HR Edit Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEdit} className="bg-card rounded-xl border border-border w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">تعديل بيانات الموظف</h3>
              <button type="button" onClick={() => setEditingEmployee(null)} className="text-zinc-500 hover:text-foreground"><X size={20} /></button>
            </div>
            {editError && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm">{editError}</div>}
            <div className="space-y-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">الاسم الكامل</label><input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">الرقم الوظيفي</label><input type="text" required value={editForm.employee_number} onChange={e => setEditForm({...editForm, employee_number: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">الوظيفة</label><input type="text" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500" /></div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الجنسية</label>
                <select value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500">
                  <option value="" disabled>الجنسية</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {editForm.nationality === 'OTHER' && (
                  <input type="text" placeholder="اكتب الجنسية" required value={editForm.customNationality} onChange={e => setEditForm({...editForm, customNationality: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500 mt-2" />
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الحفارة / المجموعة</label>
                <select value={editForm.rig} onChange={e => setEditForm({...editForm, rig: e.target.value})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500">
                  {ALL_RIGS.map(r => <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الحالة</label>
                <select value={editForm.is_suspended ? 'true' : 'false'} onChange={e => setEditForm({...editForm, is_suspended: e.target.value === 'true'})} className="w-full bg-muted border border-border rounded-lg py-2 px-3 text-foreground focus:border-emerald-500">
                  <option value="false">نشط</option>
                  <option value="true">موقوف</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={editLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-foreground font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4">
              {editLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ التعديلات'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
