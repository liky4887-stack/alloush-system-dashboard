import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Hotel,
  LockKeyhole,
  Plane,
  Route,
  X,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  GRADES,
  INTERNATIONAL_DESTINATIONS,
  LIBYA_DESTINATIONS,
  NATIONALITIES,
  TRAVEL_MODES,
} from '@/data/mock';
import type { CpoRequest, Employee, TravelMode } from '@/types';

interface CrewChangeTabProps {
  requests: CpoRequest[];
  employees: Employee[];
  loading: boolean;
  isHr: boolean;
  onRefresh: () => void;
  onRequireHr: () => void;
}

interface SelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function Select({ options, value, onChange, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-zinc-700/70 bg-zinc-800/80 text-sm text-right hover:border-emerald-700/60 focus:outline-none focus:border-emerald-500/80 transition-colors"
      >
        <ChevronDown size={14} className={`text-zinc-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className={value ? 'text-white' : 'text-zinc-500'}>{value || placeholder}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className={`w-full text-right px-4 py-2.5 text-sm transition-colors hover:bg-zinc-700/60 ${option === value ? 'text-emerald-400 bg-zinc-800/80' : 'text-zinc-200'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function uniqueRoute(nationality: string, finalDestination: string): string[] {
  const stops = nationality === 'LIBYA'
    ? ['الهيب', finalDestination]
    : ['الهيب', 'طرابلس', 'تونس', finalDestination];
  return stops.filter((stop, index) => stop && stops.indexOf(stop) === index);
}

function modeLabel(mode: TravelMode): string {
  return TRAVEL_MODES.find((item) => item.id === mode)?.label ?? 'طيران مباشر';
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

function RoutePreview({ nationality, destination }: { nationality: string; destination: string }) {
  const route = uniqueRoute(nationality, destination);
  return (
    <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3" dir="rtl">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-300">
        <Route size={14} />
        خط سير الإجازة
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
        {route.map((stop, index) => (
          <span key={`${stop}-${index}`} className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">{stop}</span>
            {index < route.length - 1 && <span className="text-emerald-500">←</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function TicketOptions({
  mode,
  flightConfirmed,
  hotelConfirmed,
  onFlightChange,
  onHotelChange,
}: {
  mode: TravelMode;
  flightConfirmed: boolean;
  hotelConfirmed: boolean;
  onFlightChange: (value: boolean) => void;
  onHotelChange: (value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <button
        type="button"
        disabled={mode === 'car'}
        onClick={() => onFlightChange(!flightConfirmed)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs text-right transition-colors ${flightConfirmed ? 'border-emerald-600 bg-emerald-900/30 text-emerald-300' : 'border-zinc-700 bg-zinc-900/50 text-zinc-400'} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span className={`flex items-center justify-center w-5 h-5 rounded-md border ${flightConfirmed ? 'border-emerald-400 bg-emerald-500 text-zinc-950' : 'border-zinc-600'}`}>
          {flightConfirmed && <Check size={13} />}
        </span>
        <Plane size={14} />
        تأكيد تذكرة الطيران
      </button>
      <button
        type="button"
        onClick={() => onHotelChange(!hotelConfirmed)}
        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs text-right transition-colors ${hotelConfirmed ? 'border-emerald-600 bg-emerald-900/30 text-emerald-300' : 'border-zinc-700 bg-zinc-900/50 text-zinc-400'}`}
      >
        <span className={`flex items-center justify-center w-5 h-5 rounded-md border ${hotelConfirmed ? 'border-emerald-400 bg-emerald-500 text-zinc-950' : 'border-zinc-600'}`}>
          {hotelConfirmed && <Check size={13} />}
        </span>
        <Hotel size={14} />
        تأكيد حجز الفندق
      </button>
    </div>
  );
}

export default function CrewChangeTab({
  requests,
  employees,
  loading,
  isHr,
  onRefresh,
  onRequireHr,
}: CrewChangeTabProps) {
  const [grade, setGrade] = useState('');
  const [nationality, setNationality] = useState('');
  const [finalDestination, setFinalDestination] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('fly');
  const [flightConfirmed, setFlightConfirmed] = useState(false);
  const [hotelConfirmed, setHotelConfirmed] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [error, setError] = useState('');
  const [editingRequest, setEditingRequest] = useState<CpoRequest | null>(null);
  const [editDestination, setEditDestination] = useState('');
  const [editMode, setEditMode] = useState<TravelMode>('fly');
  const [editFlightConfirmed, setEditFlightConfirmed] = useState(false);
  const [editHotelConfirmed, setEditHotelConfirmed] = useState(false);
  const [editBusy, setEditBusy] = useState(false);

  const destinationOptions = nationality === 'LIBYA' ? LIBYA_DESTINATIONS : INTERNATIONAL_DESTINATIONS;
  const empSuggestions = empSearch.length >= 2
    ? employees.filter((employee) => employee.name.includes(empSearch) || employee.employeeNumber.includes(empSearch)).slice(0, 5)
    : [];
  const filtered = requests.filter((request) => filterStatus === 'all' || request.status === filterStatus);

  function handleNationalityChange(value: string) {
    setNationality(value);
    setFinalDestination(value === 'LIBYA' ? 'الهيب' : 'تونس');
  }

  function resetForm() {
    setGrade('');
    setNationality('');
    setFinalDestination('');
    setTravelMode('fly');
    setFlightConfirmed(false);
    setHotelConfirmed(false);
    setEmpSearch('');
    setSelectedEmployee(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!empSearch.trim() || !grade || !nationality || !finalDestination) {
      setError('يرجى تعبئة جميع الحقول واختيار الوجهة النهائية');
      return;
    }

    setSubmitting(true);
    const { error: dbError } = await supabase.from('cpo_requests').insert({
      employee_number: selectedEmployee?.employeeNumber ?? empSearch.trim(),
      grade,
      nationality,
      destination: 'الهيب',
      final_destination: finalDestination,
      route_stops: uniqueRoute(nationality, finalDestination),
      travel_mode: travelMode,
      flight_ticket_confirmed: travelMode !== 'car' && flightConfirmed,
      hotel_ticket_confirmed: hotelConfirmed,
    });
    setSubmitting(false);

    if (dbError) {
      console.error('request creation failed', dbError);
      setError('تعذر إرسال الطلب حالياً. حاول مرة أخرى.');
      return;
    }

    resetForm();
    onRefresh();
  }

  function beginEdit(request: CpoRequest) {
    setEditingRequest(request);
    setEditDestination(request.final_destination || 'الهيب');
    setEditMode(request.travel_mode || 'fly');
    setEditFlightConfirmed(request.flight_ticket_confirmed);
    setEditHotelConfirmed(request.hotel_ticket_confirmed);
  }

  async function saveEdit() {
    if (!editingRequest || !editDestination) return;
    setEditBusy(true);
    const { error: dbError } = await supabase.rpc('hr_update_cpo_request_destination', {
      p_request_id: editingRequest.id,
      p_final_destination: editDestination,
      p_travel_mode: editMode,
      p_flight_ticket_confirmed: editMode !== 'car' && editFlightConfirmed,
      p_hotel_ticket_confirmed: editHotelConfirmed,
    });
    setEditBusy(false);

    if (dbError) {
      console.error('HR destination update failed', dbError);
      setError('تعذر تعديل الوجهة. تأكد من أن الحساب يحمل صلاحية HR.');
      return;
    }

    setEditingRequest(null);
    onRefresh();
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/60 backdrop-blur p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">طلب كرو تشينج جديد</h2>
            <p className="text-xs text-zinc-500 mt-1">الانطلاق من الهيب، ومسار غير الليبيين يمر عبر طرابلس وتونس.</p>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-900/60 bg-emerald-950/30 text-[11px] text-emerald-300 whitespace-nowrap">
            <Route size={12} /> الهيب
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="text"
                value={empSearch}
                onChange={(event) => { setEmpSearch(event.target.value); setSelectedEmployee(null); }}
                placeholder="ابحث بالاسم أو الرقم الوظيفي"
                className="w-full px-4 py-3 rounded-xl border border-zinc-700/70 bg-zinc-900/80 text-sm text-white text-right placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
              />
              {empSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                  {empSuggestions.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => { setSelectedEmployee(employee); setEmpSearch(employee.employeeNumber); handleNationalityChange(employee.nationality); }}
                      className="w-full text-right px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700/60 transition-colors"
                    >
                      <span className="font-medium text-emerald-400 ml-2">{employee.employeeNumber}</span>
                      {employee.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select options={GRADES} value={grade} onChange={setGrade} placeholder="الحفارة" />
            <Select options={NATIONALITIES} value={nationality} onChange={handleNationalityChange} placeholder="الجنسية" />
            <Select options={destinationOptions} value={finalDestination} onChange={setFinalDestination} placeholder="الوجهة النهائية" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select options={TRAVEL_MODES.map((mode) => mode.label)} value={modeLabel(travelMode)} onChange={(label) => setTravelMode(TRAVEL_MODES.find((mode) => mode.label === label)?.id ?? 'fly')} placeholder="طريقة الوصول" />
            <RoutePreview nationality={nationality} destination={finalDestination || 'الوجهة النهائية'} />
          </div>

          <TicketOptions
            mode={travelMode}
            flightConfirmed={flightConfirmed}
            hotelConfirmed={hotelConfirmed}
            onFlightChange={setFlightConfirmed}
            onHotelChange={setHotelConfirmed}
          />

          {error && <p className="text-xs text-red-400 text-right">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/40">
              {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex gap-1.5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === status ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {status === 'all' ? 'الكل' : status === 'pending' ? 'المعلّقة' : status === 'approved' ? 'الموافق عليها' : 'المرفوضة'}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-400">الطلبات ({filtered.length})</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Clock size={24} className="animate-pulse text-emerald-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500"><Clock size={32} className="opacity-30" /><p className="text-sm">لا توجد طلبات</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((request) => {
              const route = request.route_stops?.length > 1 ? request.route_stops : uniqueRoute(request.nationality, request.final_destination);
              return (
                <div key={request.id} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-800/80 transition-colors p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-sm font-semibold text-white">{request.employee_number}</span>
                      <span className="text-xs text-zinc-400">{request.grade} · {request.nationality}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {statusIcon(request.status)}
                      <span className={request.status === 'approved' ? 'text-emerald-400' : request.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}>{statusLabel(request.status)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                    {route.map((stop, index) => <span key={`${stop}-${index}`} className="flex items-center gap-2"><span className="px-2 py-1 rounded-md bg-zinc-900/70 border border-zinc-700">{stop}</span>{index < route.length - 1 && <span className="text-emerald-500">←</span>}</span>)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-1 rounded-md bg-zinc-900/70 text-zinc-400">{modeLabel(request.travel_mode)}</span>
                      {request.flight_ticket_confirmed && <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/40 text-emerald-300"><Plane size={12} /> تذكرة طيران مؤكدة</span>}
                      {request.hotel_ticket_confirmed && <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/40 text-emerald-300"><Hotel size={12} /> فندق مؤكد</span>}
                    </div>
                    {isHr ? (
                      <button onClick={() => beginEdit(request)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-700/70 text-xs text-emerald-300 hover:bg-emerald-900/30 transition-colors">تعديل الوجهة بالكامل</button>
                    ) : (
                      <button onClick={onRequireHr} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"><LockKeyhole size={12} /> HR فقط</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingRequest && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-5" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setEditingRequest(null)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white"><X size={18} /></button>
              <div><h3 className="font-bold text-white">تعديل الوجهة بالكامل</h3><p className="text-xs text-zinc-500 mt-1">الطلب: {editingRequest.employee_number}</p></div>
            </div>
            <div className="space-y-3">
              <Select options={editingRequest.nationality === 'LIBYA' ? LIBYA_DESTINATIONS : INTERNATIONAL_DESTINATIONS} value={editDestination} onChange={setEditDestination} placeholder="الوجهة النهائية" />
              <Select options={TRAVEL_MODES.map((mode) => mode.label)} value={modeLabel(editMode)} onChange={(label) => setEditMode(TRAVEL_MODES.find((mode) => mode.label === label)?.id ?? 'fly')} placeholder="طريقة الوصول" />
              <RoutePreview nationality={editingRequest.nationality} destination={editDestination || 'الوجهة النهائية'} />
              <TicketOptions mode={editMode} flightConfirmed={editFlightConfirmed} hotelConfirmed={editHotelConfirmed} onFlightChange={setEditFlightConfirmed} onHotelChange={setEditHotelConfirmed} />
              <button onClick={() => void saveEdit()} disabled={editBusy || !editDestination} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">{editBusy ? 'جارٍ الحفظ...' : 'حفظ تعديل HR'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
