import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import OverviewTab from '@/components/overview/OverviewTab';
import CrewChangeTab from '@/components/crew/CrewChangeTab';
import EmployeesTab from '@/components/employees/EmployeesTab';
import VacationsTab from '@/components/vacations/VacationsTab';
import EmployeeRequestsTab from '@/components/emp-requests/EmployeeRequestsTab';
import AuthPanel from '@/components/AuthPanel';
import { Tab, CpoRequest, Employee } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ role: string; rig: string | null } | null>(null);

  const [requests, setRequests] = useState<CpoRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [targetRig, setTargetRig] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from('user_profiles').select('*').eq('id', userId).single();

    if (data) {
      setProfile(data);
      if (data.role === 'SUPERVISOR') setActiveTab('vacations');
      fetchData(data.role, data.rig);
    } else {
      await supabase.auth.signOut();
      setProfile(null);
      setLoading(false);
    }
  };

  const fetchData = async (role: string, rig: string | null) => {
    let reqQuery = supabase.from('cpo_requests').select('*').order('created_at', { ascending: false });
    let empQuery = supabase.from('employees').select('*');

    if (role === 'SUPERVISOR' && rig) {
      reqQuery = reqQuery.eq('rig', rig);
      empQuery = empQuery.eq('rig', rig);
    }

    const [reqRes, empRes] = await Promise.all([reqQuery, empQuery]);
    if (reqRes.data) setRequests(reqRes.data as CpoRequest[]);
    if (empRes.data) setEmployees(empRes.data as Employee[]);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab !== 'employees') setTargetRig(null);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">خطأ في الإعدادات</h1>
        <p className="text-zinc-400">مفاتيح Supabase غير موجودة. يرجى إضافتها في إعدادات الاستضافة.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-emerald-500 mb-6">H&E Associate</h1>
        <button onClick={() => setAuthOpen(true)} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold">
          تسجيل الدخول
        </button>
        {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
      </div>
    );
  }

  if (loading || !profile) return <div className="min-h-screen bg-zinc-950 flex justify-center items-center text-white">جاري التحميل...</div>;
  const isHr = profile.role === 'HR';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-12">
      <Header session={session} isHr={isHr} onOpenAuth={() => setAuthOpen(true)} onSignOut={handleSignOut} />
      <main className="max-w-5xl mx-auto px-4 mt-6">
        <TabBar active={activeTab} onChange={handleTabChange} isHr={isHr} />

        {activeTab === 'overview' && isHr && (
          <OverviewTab
            requests={requests}
            employees={employees}
            onRigClick={(rig) => {
              setTargetRig(rig);
              setActiveTab('employees');
            }}
          />
        )}

        {activeTab === 'crew-change' && isHr && (
          <CrewChangeTab
            requests={requests}
            employees={employees}
            onRefresh={() => fetchData(profile.role, profile.rig)}
            isHr={isHr}
            userRig={profile.rig}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesTab
            employees={employees}
            onRefresh={() => fetchData(profile.role, profile.rig)}
            isHr={isHr}
            userRig={profile.rig}
            initialRig={targetRig}
          />
        )}

        {activeTab === 'vacations' && (
          <VacationsTab
            isHr={isHr}
            userRig={profile.rig}
            employees={employees}
          />
        )}

        {activeTab === 'emp-requests' && (
          <EmployeeRequestsTab
            isHr={isHr}
            userRig={profile.rig}
            onRefreshEmployees={() => fetchData(profile.role, profile.rig)}
          />
        )}
      </main>
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
