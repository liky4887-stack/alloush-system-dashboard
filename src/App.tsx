import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import TabBar from '@/components/TabBar';
import OverviewTab from '@/components/overview/OverviewTab';
import CrewChangeTab from '@/components/crew/CrewChangeTab';
import EmployeesTab from '@/components/employees/EmployeesTab';
import type { Tab, CpoRequest } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [requests, setRequests] = useState<CpoRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    const { data, error } = await supabase
      .from('cpo_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setReqLoading(false);
    if (!error && data) setRequests(data as CpoRequest[]);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
        <Header />
        <TabBar active={activeTab} onChange={setActiveTab} />

        <main>
          {activeTab === 'overview' && (
            <OverviewTab pendingCount={pendingCount} />
          )}
          {activeTab === 'crew-change' && (
            <CrewChangeTab
              requests={requests}
              loading={reqLoading}
              onRefresh={fetchRequests}
            />
          )}
          {activeTab === 'employees' && <EmployeesTab />}
        </main>
      </div>
    </div>
  );
}
