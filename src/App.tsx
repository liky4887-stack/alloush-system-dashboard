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
import SignIn1 from '@/components/ui/modern-stunning-sign-in';
import { GlassReveal21st } from '@/components/ui/liquid-glass-logo-reveal';
import { glassStyles } from '@/components/ui/adjustable-glass-dashboard';
import { Tab, CpoRequest, Employee } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ role: string; rig: string | null } | null>(null);

  const [requests, setRequests] = useState<CpoRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">خطأ في الإعدادات</h1>
        <p className="text-foreground">مفاتيح Supabase غير موجودة. يرجى إضافتها في إعدادات الاستضافة.</p>
      </div>
    );
  }

  if (!session) {
    return <SignIn1 />;
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <GlassReveal21st 
          className="h-[80vh] w-full max-w-lg" 
          background="#E9E4D8" 
          logoColor="#1E1E1E"
          look="light"
        />
      </div>
    );
  }

  const isHr = profile.role === 'HR';

  return (
    <div 
      className="gw-root" 
      data-theme="light" 
      style={{
        '--gw-background': '#E9E4D8',
        '--gw-surface': '#F4EFE4',
        '--gw-ink': '#1E1E1E',
        '--gw-muted': '#5E5A52',
        '--gw-accent': '#F26A4B',
        '--gw-border': '#D2CBBB',
        '--gw-blur': '22px',
        '--gw-opacity': '0.4',
        '--gw-saturation': '1.2',
        '--gw-edge': '0.6',
        '--gw-tint': '#F4EFE4',
      } as React.CSSProperties}
    >
      <style>{glassStyles}</style>
      <div className="gw-workspace">
        <div className="gw-stage">
          <main className="gw-main gw-glass">
            
            <Header session={session} isHr={isHr} onOpenAuth={() => {}} onSignOut={handleSignOut} />
            <TabBar active={activeTab} onChange={handleTabChange} isHr={isHr} />
            
            <div className="gw-view mt-8">
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
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
