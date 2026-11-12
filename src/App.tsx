import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import AuthPanel from '@/components/AuthPanel';
import OverviewTab from '@/components/overview/OverviewTab';
import CrewChangeTab from '@/components/crew/CrewChangeTab';
import EmployeesTab from '@/components/employees/EmployeesTab';
import type { Tab, CpoRequest, Employee } from '@/types';

interface EmployeeRow {
  id: string;
  employee_number: string;
  name: string;
  position: string;
  nationality: string;
  contact: string;
  rig: string;
  is_suspended: boolean;
}

function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    name: row.name,
    position: row.position,
    nationality: row.nationality,
    contact: row.contact,
    rig: row.rig,
    is_suspended: row.is_suspended,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [requests, setRequests] = useState<CpoRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [isHr, setIsHr] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    setRequestError('');
    const { data, error } = await supabase
      .from('cpo_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setReqLoading(false);
    if (error) {
      setRequestError('تعذر تحميل الطلبات حالياً.');
      return;
    }
    setRequests((data ?? []) as CpoRequest[]);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setEmployeeError('');
    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_number, name, position, nationality, contact, rig, is_suspended')
      .order('employee_number', { ascending: true });
    setEmployeesLoading(false);
    if (error) {
      setEmployeeError('تعذر تحميل قائمة الموظفين حالياً.');
      return;
    }
    setEmployees(((data ?? []) as EmployeeRow[]).map(mapEmployee));
  }, []);

  useEffect(() => {
    void fetchRequests();
    void fetchEmployees();
  }, [fetchEmployees, fetchRequests]);

  useEffect(() => {
    let mounted = true;

    const updateHrRole = async (nextSession: Session | null) => {
      if (!nextSession) {
        if (mounted) setIsHr(false);
        return;
      }
      const { data } = await supabase
        .from('hr_roles')
        .select('role')
        .eq('user_id', nextSession.user.id)
        .eq('role', 'hr')
        .eq('is_active', true)
        .maybeSingle();
      if (mounted) setIsHr(data?.role === 'hr');
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      void updateHrRole(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      (async () => {
        await updateHrRole(nextSession);
      })();
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setIsHr(false);
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-16">
        <Header
          session={session}
          isHr={isHr}
          onAuthClick={() => setAuthOpen(true)}
          onSignOut={() => void handleSignOut()}
        />
        <TabBar active={activeTab} onChange={setActiveTab} />

        {activeTab === 'crew-change' && requestError && (
          <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300" dir="rtl">
            {requestError}
          </div>
        )}
        {activeTab === 'employees' && employeeError && (
          <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300" dir="rtl">
            {employeeError}
          </div>
        )}

        <main>
          {activeTab === 'overview' && <OverviewTab pendingCount={pendingCount} />}
          {activeTab === 'crew-change' && (
            <CrewChangeTab
              requests={requests}
              employees={employees}
              loading={reqLoading}
              isHr={isHr}
              onRefresh={fetchRequests}
              onRequireHr={() => setAuthOpen(true)}
            />
          )}
          {activeTab === 'employees' && (
            <EmployeesTab
              employees={employees}
              loading={employeesLoading}
              onRefresh={fetchEmployees}
            />
          )}
        </main>
      </div>

      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
