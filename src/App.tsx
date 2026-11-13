import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import OverviewTab from '@/components/overview/OverviewTab';
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
      data-theme="dark" 
      style={{
        // Warm dark brown palette from the screenshot
        '--gw-background': '#2a241f',
        '--gw-surface': '#3a332d',
        '--gw-panel': '#3a332d',
        '--gw-ink': '#f4f0ea',
        '--gw-muted': '#a8a19b',
        '--gw-accent': '#d4b896',
        '--gw-border': '#524a43',
        '--gw-blur': '24px',
        '--gw-opacity': '0.35',
        '--gw-saturation': '1.2',
        '--gw-edge': '0.4',
        '--gw-tint': '#4a4038',
        '--color-foreground': '#f4f0ea',
        '--color-muted-foreground': '#a8a19b',
        '--color-border': '#524a43',
        '--color-background': '#2a241f',
        '--color-card': '#3a332d',
        '--color-primary': '#d4b896',
        '--color-primary-foreground': '#2a241f',
        '--color-input': '#3a332d',
        '--color-secondary': '#4a4038',
        '--color-secondary-foreground': '#f4f0ea',
        '--color-destructive': '#ef4444',
        '--color-destructive-foreground': '#ffffff',
      } as React.CSSProperties}
    >
      <style>{glassStyles}</style>
      
      {/* Background Image */}
      <img 
        className="gw-room" 
        src="https://cdn.21st.dev/assets/mirror/4a/4a0ed73b8ab76bd427aa70ab124329127f3df27cc7f31223a832ed7d28b3dda4.jpg" 
        alt="" 
      />
      <div className="gw-room-shade" aria-hidden="true" />
      
      <div className="gw-workspace">
        {/* Topbar */}
        <header className="gw-topbar gw-glass">
          <div className="gw-brand">
            <span className="gw-brand-icon">
              <span className="font-bold text-sm">H&E</span>
            </span>
            <strong>H&E Associate</strong>
            <span className="gw-brand-divider" />
            <span className="gw-personal">
              {isHr ? 'HR Management' : `Rig ${profile.rig} Supervisor`}
            </span>
          </div>
          <div className="gw-toolbar">
            <Header session={session} isHr={isHr} onOpenAuth={() => {}} onSignOut={handleSignOut} />
          </div>
        </header>

        <div className="gw-stage">
          <main className="gw-main gw-glass">
            
            <div className="gw-view-heading">
              <div>
                <p className="gw-greeting">
                  Welcome back, {isHr ? 'HR Admin' : `${profile.rig} Supervisor`}.
                </p>
                <h1>
                  {activeTab === 'overview' ? 'Overview' 
                   : activeTab === 'employees' ? 'Employees'
                   : activeTab === 'vacations' ? 'Vacations & Requests'
                   : 'Employee Requests'}
                </h1>
              </div>
            </div>

            {/* The Liquid Navbar Switch */}
            <div className="mb-8">
              <TabBar active={activeTab} onChange={handleTabChange} isHr={isHr} />
            </div>
            
            <div className="gw-view mt-4">
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

            <footer className="gw-footer">
              <span>
                <i />
                All figures are live from Supabase
              </span>
            </footer>

          </main>
        </div>
      </div>
    </div>
  );
}
