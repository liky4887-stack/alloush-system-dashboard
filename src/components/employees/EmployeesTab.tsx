import { useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { RIGS, EMPLOYEES } from '@/data/mock';

export default function EmployeesTab() {
  const [selectedRig, setSelectedRig] = useState('B2');
  const [search, setSearch] = useState('');
  const [hideContacts, setHideContacts] = useState(false);
  const rigEmployees = EMPLOYEES.filter((e) => e.rig === selectedRig && (search === '' || e.name.includes(search) || e.employeeNumber.includes(search) || e.position.toLowerCase().includes(search.toLowerCase())));
  const selectedRigData = RIGS.find((r) => r.id === selectedRig);

  return (
    <div className="flex flex-col md:flex-row gap-4" dir="rtl">
      <div className="md:w-40 flex-shrink-0">
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/60 overflow-hidden">
          {RIGS.map((rig) => (
            <button key={rig.id} onClick={() => { setSelectedRig(rig.id); setSearch(''); }} className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors border-b border-zinc-700/40 last:border-0 ${selectedRig === rig.id ? 'bg-emerald-700/40 text-emerald-300 border-r-2 border-r-emerald-500' : 'text-zinc-400 hover:bg-zinc-700/40 hover:text-zinc-200'}`}>
              {rig.id === 'FLAME' ? 'ساحة اللهيب' : rig.id}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-4">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div><h2 className="text-base font-bold text-white">موظفو {selectedRigData?.label}</h2><p className="text-xs text-zinc-500 mt-0.5">اختيار الحفارة هنا للتصفية فقط وليس حجياً للبيانات: كل من يملك صلاحية فتح المنظومة يمكنه الاطلاع على بقية الحفارات.</p></div>
            <button onClick={() => setHideContacts((h) => !h)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors">
              {hideContacts ? <Eye size={12} /> : <EyeOff size={12} />}{hideContacts ? 'إظهار' : 'إخفاء'} التواصل
            </button>
          </div>
          <div className="relative"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" /><input type="text" dir="rtl" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم أو المنصب..." className="w-full pr-9 pl-4 py-2.5 rounded-lg border border-zinc-700/70 bg-zinc-900/70 text-sm text-white text-right placeholder-zinc-500 focus:outline-none focus:border-emerald-500/70 transition-colors" /></div>
        </div>
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="border-b border-zinc-700/50 bg-zinc-900/60"><th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">الرقم الوظيفي</th><th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400">الاسم</th><th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">المنصب</th><th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">الجنسية</th>{!hideContacts && <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 whitespace-nowrap">التواصل</th>}</tr></thead>
            <tbody>{rigEmployees.length === 0 ? <tr><td colSpan={hideContacts ? 4 : 5} className="text-center py-16 text-zinc-500 text-sm">لا توجد نتائج</td></tr> : rigEmployees.map((emp, idx) => <tr key={emp.id} className={`border-b border-zinc-700/30 last:border-0 transition-colors hover:bg-zinc-700/20 ${idx % 2 === 0 ? '' : 'bg-zinc-900/20'}`}><td className="px-4 py-3 text-emerald-400 font-mono text-xs whitespace-nowrap">{emp.employeeNumber}</td><td className="px-4 py-3 text-white font-medium">{emp.name}</td><td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{emp.position}</td><td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{emp.nationality}</td>{!hideContacts && <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">{emp.contact || <span className="text-zinc-700">—</span>}</td>}</tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
