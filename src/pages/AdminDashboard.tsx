import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Users, Vote, Clock, 
  BarChart3, Settings, Play, Square,
  PlusCircle, LayoutGrid
} from 'lucide-react';
import type { Election } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import VoterManagement from './VoterManagement';
import CategoryManagement from './CategoryManagement';

const AdminDashboard: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newElection, setNewElection] = useState({ title: '', institution: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'voters' | 'categories'>('overview');
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [stats, setStats] = useState({ totalVoters: 0, votedCount: 0, otpSentCount: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (activeElection) {
      fetchStats();
      fetchChartData();
      
      const voterSub = supabase
        .channel('voters_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voters', filter: `election_id=eq.${activeElection.id}` }, () => fetchStats())
        .subscribe();
      
      const candidateSub = supabase
        .channel('candidates_realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, () => fetchChartData())
        .subscribe();

      const timer = setInterval(() => {
        if (activeElection.end_time) {
          const distance = new Date(activeElection.end_time).getTime() - new Date().getTime();
          if (distance < 0) {
            setTimeLeft('EXPIRED');
          } else {
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
          }
        }
      }, 1000);

      return () => {
        supabase.removeChannel(voterSub);
        supabase.removeChannel(candidateSub);
        clearInterval(timer);
      };
    }
  }, [activeElection]);

  const fetchStats = async () => {
    if (!activeElection) return;
    const { count: total } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', activeElection.id);
    const { count: voted } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', activeElection.id).eq('voted', true);
    const { count: sent } = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', activeElection.id).eq('otp_sent', true);
    setStats({ totalVoters: total || 0, votedCount: voted || 0, otpSentCount: sent || 0 });
  };

  const fetchChartData = async () => {
    if (!activeElection) return;
    const { data: categories } = await supabase.from('categories').select('id, name').eq('election_id', activeElection.id);
    if (!categories || categories.length === 0) return;
    
    // For simplicity, we just show the first category's candidates in the main chart
    const { data: candidates } = await supabase.from('candidates').select('name, votes_count').eq('category_id', categories[0].id);
    if (candidates) {
      setChartData(candidates.map((c: any) => ({ name: c.name, votes: c.votes_count })));
    }
  };

  const updateElectionStatus = async (status: 'open' | 'closed', endOffsetMinutes?: number) => {
    if (!activeElection) return;
    const updates: any = { status };
    if (endOffsetMinutes) {
      updates.end_time = new Date(Date.now() + endOffsetMinutes * 60000).toISOString();
    } else if (status === 'closed') {
      updates.end_time = new Date().toISOString();
    }

    const { data, error } = await supabase.from('elections').update(updates).eq('id', activeElection.id).select().single();
    if (data) setActiveElection(data);
  };

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setElections(data);
        if (data.length > 0 && !activeElection) {
          setActiveElection(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching elections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('elections')
        .insert([newElection])
        .select()
        .single();
      
      if (data) {
        setElections([data, ...elections]);
        setActiveElection(data);
        setShowCreateModal(false);
        setNewElection({ title: '', institution: '' });
      }
    } catch (err) {
      console.error('Error creating election:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading Syncra Dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {activeElection ? activeElection.title : 'Admin Console'}
          </h1>
          <p className="text-[#94a3b8] mt-1">
            {activeElection ? activeElection.institution : 'Manage your elections and real-time results.'}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            className="input-glass bg-white/5 border-white/10 text-sm py-2 px-4 h-fit flex-1 md:flex-none text-white appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
            onChange={(e) => setActiveElection(elections.find(ev => ev.id === e.target.value) || null)}
            value={activeElection?.id || ''}
          >
            {elections.map(e => <option key={e.id} value={e.id} className="bg-slate-900">{e.title}</option>)}
          </select>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Election
          </button>
        </div>
      </div>

      {activeElection ? (
        <>
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={<BarChart3 className="w-4 h-4" />} />
            <TabButton active={activeTab === 'voters'} onClick={() => setActiveTab('voters')} label="Electorate" icon={<Users className="w-4 h-4" />} />
            <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} label="Categories" icon={<LayoutGrid className="w-4 h-4" />} />
          </div>

          <div className="mt-8 transition-all">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={<Users className="text-blue-400" />} label="Total Voters" value={stats.totalVoters.toString()} trend={`${stats.otpSentCount} OTPs sent`} />
                    <StatCard icon={<Vote className="text-green-400" />} label="Votes Cast" value={stats.votedCount.toString()} trend={`${stats.totalVoters > 0 ? Math.round((stats.votedCount / stats.totalVoters) * 100) : 0}% Turnout`} />
                    <StatCard icon={<Clock className="text-purple-400" />} label="Time Left" value={timeLeft} trend={activeElection.status === 'open' ? 'Live' : 'Stopped'} />
                  </div>

                  <div className="glass-card p-6 min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-white">Live Results</h2>
                      <BarChart3 className="text-[#6366f1] w-5 h-5" />
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.length > 0 ? chartData : mockChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ background: '#1e293b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                            {(chartData.length > 0 ? chartData : mockChartData).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                      <Settings className="w-5 h-5" />
                      Election Control
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-sm font-medium text-white">Status</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {activeElection.status}
                        </span>
                      </div>
                      {activeElection.status !== 'open' ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-[10px] text-[#94a3b8] ml-1 uppercase font-bold tracking-widest">Set Duration (Minutes)</p>
                          <div className="flex gap-2">
                            <button onClick={() => updateElectionStatus('open', 60)} className="flex-1 btn-primary text-xs py-3">1 Hour</button>
                            <button onClick={() => updateElectionStatus('open', 1440)} className="flex-1 btn-primary text-xs py-3">24 Hours</button>
                          </div>
                          <button onClick={() => updateElectionStatus('open', 5)} className="w-full btn-primary bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 flex items-center justify-center gap-2 py-3 mt-1 text-xs">
                          <Play className="w-4 h-4" /> Custom Start (5m)
                        </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => updateElectionStatus('closed')}
                          className="w-full py-4 rounded-2xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <Square className="w-4 h-4" /> Override: Stop Now
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-2 text-white">Voter Link</h3>
                    <p className="text-xs text-[#94a3b8] mb-4">Share this link with your electorate.</p>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-white overflow-hidden text-ellipsis whitespace-nowrap">
                        {window.location.origin}/e/{activeElection.id}
                      </span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/e/${activeElection.id}`);
                          alert('Link copied to clipboard!');
                        }}
                        className="text-xs font-bold text-[#6366f1] hover:text-[#8b5cf6] transition-colors whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'voters' && <VoterManagement electionId={activeElection.id} />}
            {activeTab === 'categories' && <CategoryManagement electionId={activeElection.id} />}
          </div>
        </>
      ) : (
        <div className="glass-card text-center py-24">
          <Vote className="w-16 h-16 text-[#94a3b8] mx-auto mb-4 opacity-10" />
          <h2 className="text-2xl font-bold mb-2 text-white">No Elections Configured</h2>
          <p className="text-[#94a3b8] mb-8 max-w-sm mx-auto">Create your first election to begin managing your institution's voting process.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary px-8">Create New Election</button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <div className="glass-card w-full max-w-md relative z-110 p-8">
            <h2 className="text-3xl font-bold mb-6 text-white text-gradient">Start New Election</h2>
            <form onSubmit={handleCreateElection} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-white">Election Title</label>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="e.g. SRC General Election 2024"
                  value={newElection.title}
                  onChange={e => setNewElection({...newElection, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1 text-white">Institution Name</label>
                <input 
                  type="text"
                  className="input-glass"
                  placeholder="e.g. University of Cape Coast"
                  value={newElection.institution}
                  onChange={e => setNewElection({...newElection, institution: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-4">Create & Start</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-sm ${
      active ? 'bg-[#6366f1] text-white shadow-lg' : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    {label}
  </button>
);

const StatCard = ({ icon, label, value, trend }: any) => (
  <div className="glass-card p-6">
    <div className="flex items-center gap-4">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">{icon}</div>
      <div>
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        <p className="text-[10px] font-bold mt-2 text-[#6366f1] bg-[#6366f1]/10 px-2 py-0.5 rounded-full w-fit">{trend}</p>
      </div>
    </div>
  </div>
);

const mockChartData = [
  { name: 'Michael Adewale', votes: 450 },
  { name: 'Sarah Mensah', votes: 320 },
  { name: 'Kwame Asante', votes: 120 },
  { name: 'Linda Boakye', votes: 85 },
];

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4'];

export default AdminDashboard;
