import { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Plus, Search, UserPlus, X } from 'lucide-react';
import { RIGS, NATIONALITIES } from '@/data/mock';
import { supabase } from '@/lib/supabase';
import type { Employee } from '@/types';

interface EmployeesTabProps {
  employees: Employee[];
  loading: boolean;
  onRefresh: () => Promise<void> | void;
}

interface EmployeeForm {
  employeeNumber: string;
  name: string;
  position: string;
  nationality: string;
  contact: string;
  rig: string;
}

const EMPTY_FORM: EmployeeForm = {
  employeeNumber: '',
  name: '',
  position: '',
  nationality: '',
  contact: '',
  rig: 'B2',
};

export default function EmployeesTab({ employees, loading, onRefresh }: EmployeesTabProps) {
  const [selectedRig, setSelectedRig] = useState('B2');
  const [search, setSearch] = useState('');
  const [hideContacts, setHideContacts] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedRigData = RIGS.find((rig) => rig.id === selectedRig);
  const rigEmployees = useMemo(
    () => employees.filter((employee) => employee.rig === selectedRig && (
      search === '' ||
      employee.name.includes(search) ||
      employee.employeeNumber.includes(search) ||
      employee.position.toLowerCase().includes(search.toLowerCase())
    )),
    [employees, search, selectedRig]
  );

  function openAddForm() {
    setForm({ ...EMPTY_FORM, rig: selectedRig });
    setError('');
    setAddOpen(true);
  }

  function updateForm(field: keyof EmployeeForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.employeeNumber.trim() || !form.name.trim() || !form.position.trim() || !form.nationality || !form.rig) {
      setError('يرجى تعبئة الرقم والاسم والمنصب والجنسية والحفارة');
      return;
    }

    setSaving(true);
    const { error: dbError } = await supabase.from('employees').insert({
      employee_number: form.employeeNumber.trim(),
      name: form.name.trim(),
      position: form.position.trim(),
      nationality: form.nationality,
      contact: form.contact.trim(),
      rig: form.rig,
    });
    setSaving(false);

    if (dbError) {
      console.error('employee creation failed', dbError);
      setError('تعذر إضافة الموظف. قد يكون الرقم الوظيفي مستخدماً من قبل.');
      return;
    }

    setAddOpen(false);
    setForm(EMPTY_FORM);
    await onRefresh();
  }

  return (
    <div className="flex flex-col md:flex-row gap-4" dir="rtl">
      <div className="md:w-40 flex-shrink-0">
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/60 overflow-hidden">
          {RIGS.map((rig) => (
            <button
              key={rig.id}
              onClick={() => { setSelectedRig(rig.id); setSearch(''); }}
              className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors border-b border-zinc-700/40 last:border-0 ${selectedRig === rig.id ? 'bg-emerald-700/40 text-emerald-300 border-r-2 border-r-emerald-500' : 'text-zinc-400 hover:bg-zinc-700/40 hover:text-zinc-200'}`}
            >
              {rig.id === 'FLAME' ? 'ساحة اللهيب' : rig.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-bold text-white">موظفو {selectedRigData?.label}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">اختيار الحفارة هنا للتصفية فقط، ويمكن عرض بقية الحفارات من القائمة.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHideContacts((current) => !current)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors">
                {hideContacts ? <Eye size={12} /> : <EyeOff size={12} />}
                {hideContacts ? 'إظهار' : 'إخفاء'} التواصل
              </button>
              <button onClick={openAddForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors">
                <UserPlus size={13} /> إضافة موظف
              </button>
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو الرقم أو المنصب..." className="w-full pr-9 pl-4 py-2.5 rounded-lg border border-zinc-700/70 bg-zinc-900/70 text-sm text-white text-right placeholder-zinc-500 focus:outline-none focus:border-emerald-500/70 transition-colors" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-zinc-700/50 bg-zinc-900/60">
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">الرقم الوظيفي</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400">الاسم</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">المنصب</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">الجنسية</th>
                {!hideContacts && <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">التواصل</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={hideContacts ? 4 : 5} className="text-center py-16"><Loader2 size={22} className="mx-auto animate-spin text-emerald-500" /></td></tr>
              ) : rigEmployees.length === 0 ? (
                <tr><td colSpan={hideContacts ? 4 : 5} className="text-center py-16 text-zinc-500 text-sm">لا توجد نتائج</td></tr>
              ) : (
                rigEmployees.map((employee, index) => (
                  <tr key={employee.id} className={`border-b border-zinc-700/30 last:border-0 transition-colors hover:bg-zinc-700/20 ${index % 2 === 0 ? '' : 'bg-zinc-900/20'}`}>
                    <td className="px-4 py-3 text-emerald-400 font-mono text-xs whitespace-nowrap">{employee.employeeNumber}</td>
                    <td className="px-4 py-3 text-white font-medium">{employee.name}</td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{employee.position}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{employee.nationality}</td>
                    {!hideContacts && <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{employee.contact || <span className="text-zinc-700">—</span>}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleAdd} className="w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-5" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setAddOpen(false)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white"><X size={18} /></button>
              <div><h3 className="font-bold text-white">إضافة موظف</h3><p className="text-xs text-zinc-500 mt-1">سيظهر الموظف مباشرة تحت الحفارة المختارة.</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required value={form.employeeNumber} onChange={(event) => updateForm('employeeNumber', event.target.value)} placeholder="الرقم الوظيفي" className="input-dark" />
              <input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="الاسم الكامل" className="input-dark" />
              <input required value={form.position} onChange={(event) => updateForm('position', event.target.value)} placeholder="المنصب" className="input-dark" />
              <input value={form.contact} onChange={(event) => updateForm('contact', event.target.value)} placeholder="رقم التواصل" className="input-dark" />
              <select required value={form.nationality} onChange={(event) => updateForm('nationality', event.target.value)} className="input-dark">
                <option value="">الجنسية</option>
                {NATIONALITIES.map((nationality) => <option key={nationality} value={nationality}>{nationality}</option>)}
              </select>
              <select required value={form.rig} onChange={(event) => updateForm('rig', event.target.value)} className="input-dark">
                {RIGS.map((rig) => <option key={rig.id} value={rig.id}>{rig.label}</option>)}
              </select>
            </div>
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">إلغاء</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                حفظ الموظف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
