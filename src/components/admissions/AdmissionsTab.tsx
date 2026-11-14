import { useState } from 'react';
import { Employee } from '@/types';
import { CalendarDays, Search, Users } from 'lucide-react';

export default function AdmissionsTab({ employees }: { employees: Employee[] }) {
  const [selectedDate, setSelectedDate] = useState('');

  const filteredEmployees = selectedDate
    ? employees.filter(emp => emp.joining_date === selectedDate)
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#2a241f] p-6 rounded-xl border border-[#524a43] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-[#d4b896]/20 p-3 rounded-lg text-[#d4b896]">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f4f0ea]">سجل التعيينات</h2>
            <p className="text-sm text-[#a8a19b]">ابحث عن الموظفين الذين تم تعيينهم في تاريخ محدد</p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-[#3a332d] border border-[#524a43] rounded-lg py-2.5 px-4 text-[#f4f0ea] focus:outline-none focus:border-[#d4b896]"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      <div className="bg-[#3a332d] border border-[#524a43] rounded-xl p-6 shadow-lg min-h-[300px]">
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center h-full text-[#a8a19b] mt-20">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-lg">الرجاء اختيار تاريخ للبحث</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#a8a19b] mt-20">
            <CalendarDays size={48} className="mb-4 opacity-50" />
            <p className="text-lg">لا يوجد موظفين تم تعيينهم في هذا التاريخ</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-[#f4f0ea] mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#d4b896]" />
              الموظفين المعينين في {selectedDate} ({filteredEmployees.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="bg-[#2a241f] border border-[#524a43]/50 p-4 rounded-lg flex flex-col gap-1 transition-all hover:border-[#d4b896]/50">
                  <div className="text-[#f4f0ea] font-bold text-lg">{emp.name}</div>
                  <div className="text-[#a8a19b] text-sm font-mono">{emp.employee_number}</div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#524a43]/50">
                    <span className="text-xs text-[#d4b896] bg-[#d4b896]/10 px-2 py-1 rounded-md">{emp.rig === 'LAHEEB' ? 'ساحة اللهيب' : emp.rig}</span>
                    <span className="text-xs text-[#a8a19b]">{emp.position}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
