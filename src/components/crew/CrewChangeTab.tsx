import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GRADES, NATIONALITIES, DESTINATIONS, EMPLOYEES } from '@/data/mock';
import type { CpoRequest } from '@/types';

interface CrewChangeTabProps {
  requests: CpoRequest[];
  loading: boolean;
  onRefresh: () => void;
}

function Select({ options, value, onChange, placeholder, dir = 'rtl' }: { options: string[]; value: string; onChange: (v: string) => void; placeholder: string; dir?: 'rtl' | 'ltr' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} dir={dir} className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-zinc-700/70 bg-zinc-800/80 text-sm text-right hover:border-emerald-700/60 focus:outline-none focus:border-emerald-500/80 transition-colors">
        <ChevronDown size={14} className={`text-zinc-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        <span className={value ? 'text-white' : 'text-zinc-500'}>{value || placeholder}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden" dir={dir}>
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-zinc-700/60 ${opt === value ? 'text-emerald-400 bg-zinc-800/80' : 'text-zinc-200'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function statusIcon(status: CpoRequest['status']) {
  if (status === 'approved') return <CheckCircle size={14} className="text-emerald-400" />;
  if (status === 'rejected') return <XCircle size={14} className="text-red-400" />;
  return <Clock size={14} className="text-amber-400" />;
}

function statusLabel(status: CpoRequest['status']) {
  if (status === 'approved') return 'موافق عليه';
  if (status === 'rejected') return 'مرفوض';
  return 'معلّق';
}

export default function CrewChangeTab({ requests, loading, onRefresh }: CrewChangeTabProps) {
  const [grade, setGrade] = useState('');
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [error, setError] = useState('');
  const empSuggestions = empSearch.length >= 2 ? EMPLOYEES.filter((e) => e.name.includes(empSearch) || e.employeeNumber.includes(empSearch)).slice(0, 5) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!empSearch || !grade || !nationality || !destination) { setError('يرجى تعبئة جميع الحقول'); return; }
    setSubmitting(true);
    const { error: dbErr } = await supabase.from('cpo_requests').insert({ employee_number: empSearch, grade, nationality, destination });
    setSubmitting(false);
    if (dbErr) { setError('حدث خطأ أثناء الإرسال'); return; }
    setEmpSearch(''); setGrade(''); setNationality(''); setDestination(''); onRefresh();
  }

  const filtered = requests.filter((r) => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/60 backdrop-blur p-5 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">طلب كرو تشينج جديد</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <input type="text" dir="rtl" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="ابحث بالاسم أو الرقم الوظيفي" className="w-full px-4 py-3 rounded-xl border border-zinc-700/70 bg-zinc-900/80 text-sm text-white text-right placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-colors" />
              {empSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                  {empSuggestions.map((e) => (
                    <button key={e.id} type="button" onClick={() => setEmpSearch(`${e.employeeNumber} - ${e.name}`)} className="w-full text-right px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700/60 transition-colors">
                      <span className="font-medium text-emerald-400 ml-2">{e.employeeNumber}</span>{e.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select options={GRADES} value={grade} onChange={setGrade} placeholder="الحفارة / البريقة" />
            <Select options={NATIONALITIES} value={nationality} onChange={setNationality} placeholder="الجنسية" />
            <Select options={DESTINATIONS} value={destination} onChange={setDestination} placeholder="إلى البريقة" />
          </div>
          {error && <p className="text-xs text-red-400 text-right">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-900/40">
              {submitting && <Loader2 size={14} className="animate-spin" />}إرسال الطلب
            </button>
          </div>
        </form>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex gap-1.5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {s === 'all' ? 'الكل' : s === 'pending' ? 'المعلّقة' : s === 'approved' ? 'الموافق عليها' : 'المرفوضة'}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-400">الطلبات ({filtered.length})</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500"><Clock size={32} className="opacity-30" /><p className="text-sm">لا توجد طلبات</p></div>
        ) : (
          <div className="space-y-2">
            {filtered.map((req) => (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-800/80 transition-colors">
                <div className="flex flex-col gap-0.5 items-end"><span className="text-sm font-semibold text-white">{req.employee_number}</span><span className="text-xs text-zinc-400">{req.grade} · {req.nationality} · {req.destination}</span></div>
                <div className="flex items-center gap-1.5 text-xs font-medium">{statusIcon(req.status)}<span className={req.status === 'approved' ? 'text-emerald-400' : req.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}>{statusLabel(req.status)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
