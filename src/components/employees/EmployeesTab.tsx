import { useState, useEffect } from 'react';
import { Employee } from '@/types';
import { ChevronDown, ChevronRight, Search, UserPlus, Phone, X, Loader2, Edit2, Palmtree } from 'lucide-react';
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
  
  // State for tracking active vacation requests
  const [activeVacations, setActiveVacations] = useState<string[]>([]);
  const [vacationLoading, setVacationLoading] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', rig: userRig || 'B2'
  });

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    name: '', employee_number: '', position: '', nationality: '', rig: '', is_suspended: false
  });

  // Fetch active requests so we know which buttons to fade
  const fetchActiveVacations = async () => {
    const { data } = await supabase
      .from('vacation_requests')
      .select('employee_number')
      .in('status', ['pending', 'approved']);
      
    if (data) {
      setActiveVacations(data.map(r => r.employee_number));
    }
  };

  useEffect(() => {
    fetchActiveVacations();
  }, []);

  useEffect(() => {
    if (initialRig && !expandedRigs.includes(initialRig)) {
      setExpandedRigs(prev => [...prev, initialRig]);
    }
  }, [initialRig]);

  const toggleRig = (rig: string) => {
    setExpandedRigs(prev =>
      prev.includes(rig) ? prev.filter(r => r !== rig) : [...prev, rig]
    );
  };

  const filtered = employees.filter(e =>
    e.name.includes(search) ||
    e.employee_number.includes(search) ||
    (e.position && e.position.toLowerCase().includes(search.toLowerCase()))
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

    const { error: insertError } = await supabase.from('employees').insert({
      name: addForm.name,
      employee_number: addForm.employee_number,
      position: addForm.position,
      nationality: addForm.nationality,
      rig: addForm.rig
    });

    setAddLoading(false);
    if (insertError) return setAddError(insertError.message);

    setIsAdding(false);
    setAddForm({ name: '', employee_number: '', position: '', nationality: '', rig: userRig || 'B2' });
    onRefresh();
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditError('');
    setEditForm({
      name: emp.name,
      employee_number: emp.employee_number,
      position: emp.position || '',
      nationality: emp.nationality || '',
      rig: emp.rig || 'UNASSIGNED',
      is_suspended: emp.is_suspended || false
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditLoading(true);
    setEditError('');

    const { error: updateError } = await supabase.from('employees').update({
      name: editForm.name,
      employee_number: editForm.employee_number,
      position: editForm.position,
      nationality: editForm.nationality,
      rig: editForm.rig,
      is_suspended: editForm.is_suspended
    }).eq('id', editingEmployee.id);

    setEditLoading(false);
    if (updateError) return setEditError(updateError.message);

    setEditingEmployee(null);
    onRefresh();
  };

  const handleVacationRequest = async (emp: Employee) => {
    if (isHr) return; 
    setVacationLoading(emp.id);
    
    const { error } = await supabase.from('vacation_requests').insert({
      employee_number: emp.employee_number,
      employee_name: emp.name,
      rig: emp.rig,
      requested_by: (await supabase.auth.getUser()).data.user?.id,
    });
    
    setVacationLoading(null);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("تم إرسال طلب الإجازة بنجاح إلى الموارد البشرية.");
      fetchActiveVacations(); // Refresh the faded states immediately
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-3 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الرقم الوظيفي..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-10 pl-3 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400 hover:text-zinc-200">
            <input type="checkbox" checked={showContact} onChange={e => setShowContact(e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
            عرض أرقام الهواتف
          </label>

          {isHr && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <UserPlus size={16} />
              إضافة موظف
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedRigs.length === 0 ? (
          <div className="text-center text-zinc-500 py-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
            لا يوجد موظفين لعرضهم. يرجى استيراد البيانات.
          </div>
        ) : (
          sortedRigs.map(rig => {
            const isExpanded = expandedRigs.includes(rig);
            const rigEmployees = grouped[rig] || [];

            return (
              <div key={rig} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleRig(rig)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-700/50 p-2 rounded-lg text-emerald-500">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <span className="text-lg font-bold text-zinc-100">
                      {rig === 'LAHEEB' ? 'ساحة اللهيب' : rig === 'UNASSIGNED' ? 'غير محدد (UNASSIGNED)' : `حفارة ${rig}`}
                    </span>
                    <span className="bg-zinc-700 text-zinc-300 text-xs py-1 px-2.5 rounded-full">
                      {rigEmployees.length} موظف
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="px-6 py-3 font-medium">الاسم</th>
                            <th className="px-6 py-3 font-medium">الرقم الوظيفي</th>
                            <th className="px-6 py-3 font-medium">الوظيفة</th>
                            <th className="px-6 py-3 font-medium">الجنسية</th>
                            <th className="px-6 py-3 font-medium">الحالة</th>
                            {showContact && <th className="px-6 py-3 font-medium">الهاتف</th>}
                            {isHr && <th className="px-6 py-3 font-medium text-center">تعديل</th>}
                            {!isHr && <th className="px-6 py-3 font-medium text-center">إجراء</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {rigEmployees.map(emp => {
                            // Check if this employee has an active pending/approved request
                            const hasActiveRequest = activeVacations.includes(emp.employee_number);

                            return (
                              <tr key={emp.id} className="hover:bg-zinc-800/20">
                                <td className="px-6 py-3 text-zinc-200">{emp.name}</td>
                                <td className="px-6 py-3 text-zinc-400 font-mono">{emp.employee_number}</td>
                                <td className="px-6 py-3 text-zinc-400">{emp.position}</td>
                                <td className="px-6 py-3 text-zinc-400">{emp.nationality}</td>
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    {emp.is_suspended ? (
                                      <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs">موقوف</span>
                                    ) : (
                                      <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs">نشط</span>
                                    )}
                                  </div>
                                </td>
                                {showContact && (
                                  <td className="px-6 py-3 text-zinc-400 font-mono flex items-center gap-2">
                                    <Phone size={14} className="text-zinc-500" />
                                    {emp.phone || 'غير مسجل'}
                                  </td>
                                )}
                                {isHr && (
                                  <td className="px-6 py-3 text-center">
                                    <button
                                      onClick={() => openEdit(emp)}
                                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-500 rounded transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  </td>
                                )}
                                {!isHr && (
                                  <td className="px-6 py-3 text-center">
                                    <button
                                      onClick={() => handleVacationRequest(emp)}
                                      disabled={vacationLoading === emp.id || hasActiveRequest}
                                      className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 mx-auto ${
                                        hasActiveRequest 
                                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                          : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
                                      }`}
                                    >
                                      {vacationLoading === emp.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Palmtree size={14} />
                                      )}
                                      {hasActiveRequest ? 'قيد الإجراء' : 'طلب إجازة'}
                                    </button>
                                  </td>
                                )}
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

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">إضافة موظف</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            {addError && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm">{addError}</div>}

            <div className="space-y-3">
              <input type="text" placeholder="الاسم الكامل" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              <input type="text" placeholder="الرقم الوظيفي" required value={addForm.employee_number} onChange={e => setAddForm({...addForm, employee_number: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              <input type="text" placeholder="الوظيفة" value={addForm.position} onChange={e => setAddForm({...addForm, position: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />

              <select value={addForm.nationality} onChange={e => setAddForm({...addForm, nationality: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500">
                <option value="" disabled>الجنسية</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <select value={addForm.rig} onChange={e => setAddForm({...addForm, rig: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500">
                {ALL_RIGS.map(r => (
                  <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={addLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4">
              {addLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ'}
            </button>
          </form>
        </div>
      )}

      {editingEmployee && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEdit} className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">تعديل بيانات الموظف</h3>
              <button type="button" onClick={() => setEditingEmployee(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            {editError && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm">{editError}</div>}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">الاسم الكامل</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">الرقم الوظيفي</label>
                <input type="text" required value={editForm.employee_number} onChange={e => setEditForm({...editForm, employee_number: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">الوظيفة</label>
                <input type="text" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">الجنسية</label>
                <select value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500">
                  <option value="" disabled>الجنسية</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">الحفارة / المجموعة</label>
                <select value={editForm.rig} onChange={e => setEditForm({...editForm, rig: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500">
                  {ALL_RIGS.map(r => (
                    <option key={r} value={r}>{r === 'LAHEEB' ? 'ساحة اللهيب' : r === 'UNASSIGNED' ? 'غير محدد' : r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">الحالة</label>
                <select
                  value={editForm.is_suspended ? 'true' : 'false'}
                  onChange={e => setEditForm({...editForm, is_suspended: e.target.value === 'true'})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:border-emerald-500"
                >
                  <option value="false">نشط</option>
                  <option value="true">موقوف</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={editLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4">
              {editLoading ? <Loader2 className="animate-spin" size={18} /> : 'حفظ التعديلات'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
