import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Employee, CpoRequest, TravelMode } from '@/types';
import { LIBYA_DESTINATIONS, INTERNATIONAL_DESTINATIONS, NATIONALITIES, GRADES } from '@/data/mock';
import { Loader2, Plane, Car, Hotel, CheckCircle2, XCircle, Search, MapPin, Edit2, X } from 'lucide-react';

const uniqueRoute = (nationality: string, destination: string, mode: TravelMode) => {
  if (mode === 'car') return ['الهيب', 'طرابلس', destination];
  if (nationality === 'LIBYA') return ['الهيب', 'طرابلس', destination];
  return ['الهيب', 'طرابلس', 'تونس', destination];
};

const modeLabel = (mode: string) => {
  if (mode === 'car') return 'سيارة';
  if (mode === 'road_half_fly') return 'نصف الطريق ثم طيران';
  return 'طيران مباشر';
};

const statusLabel = (status: string) => {
  if (status === 'pending') return 'قيد الانتظار';
  if (status === 'approved') return 'مقبول';
  return 'مرفوض';
};

const statusIcon = (status: string) => {
  if (status === 'pending') return <Loader2 size={16} className="text-amber-500" />;
  if (status === 'approved') return <CheckCircle2 size={16} className="text-emerald-500" />;
  return <XCircle size={16} className="text-red-500" />;
};

interface Props {
  requests: CpoRequest[];
  employees: Employee[];
  onRefresh: () => void;
  isHr: boolean;
  userRig: string | null;
}

export default function CrewChangeTab({ requests, employees, onRefresh, isHr, userRig }: Props) {
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [grade, setGrade] = useState('');
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('fly');
  const [flightConfirmed, setFlightConfirmed] = useState(false);
  const [hotelConfirmed, setHotelConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingRequest, setEditingRequest] = useState<CpoRequest | null>(null);
  const [editDestination, setEditDestination] = useState('');
  const [editFlight, setEditFlight] = useState(false);
  const [editHotel, setEditHotel] = useState(false);

  const filteredEmployees = employeeSearch.length >= 2
    ? employees.filter(e => e.name.includes(employeeSearch) || e.employee_number.includes(employeeSearch))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return setError('يرجى اختيار الموظف');
    if (!destination) return setError('يرجى اختيار الوجهة');

    setLoading(true);
    setError('');

    const route = uniqueRoute(nationality, destination, travelMode);

    const { error: insertError } = await supabase.from('cpo_requests').insert({
      employee_name: selectedEmployee.name,
      employee_number: selectedEmployee.employee_number,
      grade,
      nationality,
      destination: 'الهيب',
      route_stops: route,
      travel_mode: travelMode,
      status: 'pending',
      rig: isHr ? selectedEmployee.rig : userRig,
      flight_ticket_confirmed: flightConfirmed,
      hotel_confirmed: hotelConfirmed
    });

    setLoading(false);
    if (insertError) return setError(insertError.message);

    setEmployeeSearch('');
    setSelectedEmployee(null);
    setGrade('');
    setNationality('');
    setDestination('');
    setTravelMode('fly');
    setFlightConfirmed(false);
    setHotelConfirmed(false);
    onRefresh();
  };

  const handleHrUpdate = async () => {
    if (!editingRequest) return;
    setLoading(true);

    const { error: updateError } = await supabase.rpc('hr_update_cpo_request_destination', {
      p_request_id: editingRequest.id,
      p_new_destination: editDestination
    });

    if (!updateError) {
      await supabase.from('cpo_requests').update({
        flight_ticket_confirmed: editFlight,
        hotel_confirmed: editHotel
      }).eq('id', editingRequest.id);
    }

    setLoading(false);
    if (updateError) return alert(updateError.message);
    setEditingRequest(null);
    onRefresh();
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
          <Plane className="text-emerald-500" />
          طلب كرو تشينج جديد
        </h2>

        {error && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الرقم الوظيفي"
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                if (selectedEmployee) setSelectedEmployee(null);
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-10 pl-3 text-white focus:outline-none focus:border-emerald-500"
            />
            {filteredEmployees.length > 0 && !selectedEmployee && (
              <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredEmployees.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setEmployeeSearch(emp.name);
                      setGrade(emp.position || '');
                      setNationality(emp.nationality || '');
                    }}
                    className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0"
                  >
                    <div className="text-white font-medium">{emp.name}</div>
                    <div className="text-zinc-400 text-sm">{emp.employee_number} - {emp.position}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
              <option value="" disabled>الدرجة الوظيفية</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select value={nationality} onChange={e => setNationality(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
              <option value="" disabled>الجنسية</option>
              {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
              <option value="" disabled>الوجهة النهائية</option>
              <optgroup label="داخل ليبيا">{LIBYA_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
              <optgroup label="دولي">{INTERNATIONAL_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
            </select>

            <select value={travelMode} onChange={e => setTravelMode(e.target.value as TravelMode)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
              <option value="fly">طيران مباشر</option>
              <option value="road_half_fly">نصف الطريق ثم طيران</option>
              <option value="car">سيارة</option>
            </select>
          </div>

          {isHr && destination && (
            <div className="space-y-4 pt-2 border-t border-zinc-800 mt-4">
              <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                <div className="text-emerald-500 font-medium mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  خط سير الإجازة
                </div>
                <div className="flex flex-wrap items-center gap-2" dir="rtl">
                  {uniqueRoute(nationality, destination, travelMode).map((stop, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="bg-zinc-700 text-zinc-200 px-3 py-1 rounded-md text-sm">{stop}</span>
                      {i < arr.length - 1 && <span className="text-zinc-500 text-sm">←</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input type="checkbox" checked={flightConfirmed} onChange={e => setFlightConfirmed(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900" />
                  <Plane size={16} className="text-zinc-400" />
                  تأكيد تذكرة الطيران
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input type="checkbox" checked={hotelConfirmed} onChange={e => setHotelConfirmed(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900" />
                  <Hotel size={16} className="text-zinc-400" />
                  تأكيد حجز الفندق
                </label>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'إرسال الطلب'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-100">الطلبات ({requests.length})</h3>

        {requests.length === 0 ? (
          <div className="text-center text-zinc-500 py-8">لا توجد طلبات حالياً</div>
        ) : (
          <div className="grid gap-4">
            {requests.map(req => (
              <div key={req.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-zinc-100 text-lg">{req.employee_name}</div>
                    <div className="text-zinc-400 text-sm">{req.employee_number} • {req.grade} • {req.nationality}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {statusIcon(req.status)}
                      {statusLabel(req.status)}
                    </div>
                    {isHr && (
                      <button
                        onClick={() => {
                          setEditingRequest(req);
                          setEditDestination(req.final_destination || req.route_stops[req.route_stops.length - 1] || '');
                          setEditFlight(req.flight_ticket_confirmed || false);
                          setEditHotel(req.hotel_confirmed || false);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-emerald-500 bg-zinc-800 rounded-md transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-zinc-300 bg-zinc-800/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    {req.travel_mode === 'car' ? <Car size={16} /> : <Plane size={16} />}
                    {modeLabel(req.travel_mode)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    {req.route_stops.join(' ← ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">تعديل الطلب (HR)</h3>
              <button onClick={() => setEditingRequest(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="text-sm text-zinc-400 mb-4">{editingRequest.employee_name}</div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">الوجهة النهائية</label>
              <select value={editDestination} onChange={e => setEditDestination(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500 appearance-none">
                <optgroup label="داخل ليبيا">{LIBYA_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                <optgroup label="دولي">{INTERNATIONAL_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
              </select>
            </div>

            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input type="checkbox" checked={editFlight} onChange={e => setEditFlight(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                <Plane size={16} />
                تأكيد التذكرة
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input type="checkbox" checked={editHotel} onChange={e => setEditHotel(e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                <Hotel size={16} />
                تأكيد الفندق
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button onClick={() => setEditingRequest(null)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">إلغاء</button>
              <button onClick={handleHrUpdate} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
