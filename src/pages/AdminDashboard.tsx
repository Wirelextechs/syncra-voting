import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Users, Vote, Clock, LayoutGrid, Search,
  Building2, Calendar, ChevronRight, BarChart3,
  Settings, Play, Square, TrendingUp, Share2,
  Copy, CheckCheck, Zap, PlusCircle, X, Loader2, AlertCircle,
  Trash2, UploadCloud
} from 'lucide-react';
import type { Election } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import VoterManagement from './VoterManagement';
import CategoryManagement from './CategoryManagement';

const CHART_COLORS = ['#6d28d9', '#f97316', '#ec4899', '#0ea5e9', '#16a34a'];
const MOCK_DATA = [
  { name: 'Candidate A', votes: 420 },
  { name: 'Candidate B', votes: 310 },
  { name: 'Candidate C', votes: 180 },
  { name: 'Candidate D', votes: 95 },
];

/* ── Logo upload helper ── */
const uploadLogo = async (file: File, electionHint: string): Promise<string> => {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${electionHint.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}_${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('logos').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from('logos').getPublicUrl(data.path);
  return urlData.publicUrl;
};

/* ══════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newElection, setNewElection] = useState({ title: '', institution: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [activeTab, setActiveTab] = useState<'elections' | 'overview' | 'voters' | 'positions'>('elections');
  const [timeLeft, setTimeLeft] = useState('--:--:--');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, voted: 0, sent: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Election | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toLocalDatetimeValue = (offset: number = 0) => {
    const d = new Date(Date.now() + offset);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  };
  const [startTime, setStartTime] = useState(toLocalDatetimeValue());
  const [endTime, setEndTime] = useState(toLocalDatetimeValue(8 * 60 * 60 * 1000));

  useEffect(() => { fetchElections(); }, []);

  useEffect(() => {
    if (!activeElection) return;
    fetchStats();
    fetchChartData();

    const voterSub = supabase.channel('v_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voters', filter: `election_id=eq.${activeElection.id}` }, fetchStats)
      .subscribe();
    const candSub = supabase.channel('c_rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidates' }, fetchChartData)
      .subscribe();

    let timer: ReturnType<typeof setInterval>;
    if (activeElection.end_time) {
      timer = setInterval(() => {
        const dist = new Date(activeElection.end_time!).getTime() - Date.now();
        if (dist < 0) { setTimeLeft('Ended'); return; }
        const h = Math.floor(dist / 3600000);
        const m = Math.floor((dist % 3600000) / 60000);
        const s = Math.floor((dist % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      }, 1000);
    }

    return () => {
      supabase.removeChannel(voterSub);
      supabase.removeChannel(candSub);
      clearInterval(timer);
    };
  }, [activeElection]);

  const fetchElections = async () => {
    const { data } = await supabase.from('elections').select('*').order('created_at', { ascending: false });
    if (data) setElections(data);
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!activeElection) return;
    const id = activeElection.id;
    const [{ count: total }, { count: voted }, { count: sent }] = await Promise.all([
      supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', id),
      supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', id).eq('voted', true),
      supabase.from('voters').select('*', { count: 'exact', head: true }).eq('election_id', id).eq('otp_sent', true),
    ]);
    setStats({ total: total || 0, voted: voted || 0, sent: sent || 0 });
  };

  const fetchChartData = async () => {
    if (!activeElection) return;
    const { data: cats } = await supabase.from('categories').select('id').eq('election_id', activeElection.id);
    if (!cats?.length) return;
    const { data: cands } = await supabase.from('candidates').select('name, votes_count').eq('category_id', cats[0].id);
    if (cands) setChartData(cands.map((c: any) => ({ name: c.name, votes: c.votes_count || 0 })));
  };

  const updateStatus = async (status: 'open' | 'closed', startIso?: string, endIso?: string) => {
    if (!activeElection) return;
    const updates: any = { status };
    if (status === 'open') {
      updates.start_time = startIso || new Date().toISOString();
      updates.end_time   = endIso   || null;
    } else {
      updates.end_time = new Date().toISOString();
    }
    const { data } = await supabase.from('elections').update(updates).eq('id', activeElection.id).select().single();
    if (data) { setActiveElection(data); setElections(prev => prev.map(e => e.id === data.id ? data : e)); }
  };

  /* ── Logo file handling ── */
  const handleLogoFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }, [logoPreview]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleLogoFile(file);
  }, [handleLogoFile]);

  const clearLogoModal = () => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setShowModal(false);
    setNewElection({ title: '', institution: '' });
    setCreateError('');
  };

  /* ── Create election ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    let logo_url: string | null = null;
    if (logoFile) {
      try {
        setUploadingLogo(true);
        logo_url = await uploadLogo(logoFile, newElection.institution || newElection.title);
      } catch (err: any) {
        setCreateError('Logo upload failed: ' + err.message);
        setCreating(false);
        setUploadingLogo(false);
        return;
      } finally {
        setUploadingLogo(false);
      }
    }

    const { data, error } = await supabase
      .from('elections')
      .insert([{ ...newElection, logo_url }])
      .select().single();

    setCreating(false);
    if (error || !data) {
      setCreateError(error?.message || 'Failed to create election. Check your database permissions.');
      return;
    }
    setElections(prev => [data, ...prev]);
    setActiveElection(data);
    setActiveTab('overview');
    clearLogoModal();
  };

  /* ── Delete election ── */
  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    const id = showDeleteConfirm.id;
    const { error } = await supabase.from('elections').delete().eq('id', id);
    if (!error) {
      setElections(prev => prev.filter(e => e.id !== id));
      if (activeElection?.id === id) {
        setActiveElection(null);
        setActiveTab('elections');
      }
    }
    setDeleting(false);
    setShowDeleteConfirm(null);
  };

  const copyLink = () => {
    if (!activeElection) return;
    navigator.clipboard.writeText(`${window.location.origin}/e/${activeElection.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = elections.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.institution.toLowerCase().includes(search.toLowerCase())
  );

  const turnout = stats.total > 0 ? Math.round((stats.voted / stats.total) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="anim-spin" style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)' }} />
      <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem' }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {activeElection?.logo_url && activeTab !== 'elections' && (
            <img
              src={activeElection.logo_url}
              alt="logo"
              style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }}
            />
          )}
          <div>
            <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
              {activeTab === 'elections' ? 'Elections Hub' : activeElection?.title || 'Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem', marginTop: 4 }}>
              {activeTab === 'elections'
                ? `${elections.length} election${elections.length !== 1 ? 's' : ''} total`
                : activeElection?.institution || ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeElection && activeTab !== 'elections' && (
            <select
              className="input"
              style={{ width: 'auto', minWidth: 180, height: 38, padding: '0 0.75rem', fontSize: '0.875rem' }}
              value={activeElection?.id}
              onChange={e => {
                const sel = elections.find(el => el.id === e.target.value);
                if (sel) { setActiveElection(sel); setActiveTab('overview'); }
              }}
            >
              {elections.map(el => <option key={el.id} value={el.id}>{el.title}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setCreateError(''); }}>
            <PlusCircle size={16} /> New Election
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ overflowX: 'auto' }}>
        <div className="tab-list" style={{ width: 'fit-content', borderRadius: 10 }}>
          <button className={`tab-btn ${activeTab === 'elections' ? 'active' : ''}`}
            onClick={() => { setActiveTab('elections'); setActiveElection(null); }}>
            <LayoutGrid size={14} /> All Elections
          </button>
          {activeElection && <>
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <BarChart3 size={14} /> Overview
            </button>
            <button className={`tab-btn ${activeTab === 'voters' ? 'active' : ''}`} onClick={() => setActiveTab('voters')}>
              <Users size={14} /> Voters
            </button>
            <button className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`} onClick={() => setActiveTab('positions')}>
              <LayoutGrid size={14} /> Positions
            </button>
          </>}
        </div>
      </div>

      {/* ═══════════════════ ELECTIONS HUB ═══════════════════ */}
      {activeTab === 'elections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input className="input" placeholder="Search elections…" style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map((el, i) => (
              <ElectionCard
                key={el.id}
                election={el}
                delay={i}
                onClick={() => { setActiveElection(el); setActiveTab('overview'); }}
                onDelete={e => { e.stopPropagation(); setShowDeleteConfirm(el); }}
              />
            ))}
            <div
              onClick={() => { setShowModal(true); setCreateError(''); }}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                minHeight: 180,
                cursor: 'pointer',
                padding: '2rem',
                transition: 'all 0.2s',
                color: 'var(--text-3)',
              }}
              className="card-hover"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
            >
              <div className="icon-box icon-box-md" style={{ background: 'var(--surface-2)', color: 'inherit', borderRadius: 12 }}>
                <Plus size={20} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'inherit' }}>Create Election</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: 2 }}>Set up a new ballot</p>
              </div>
            </div>
          </div>

          {filtered.length === 0 && elections.length > 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>No results for "{search}"</div>
          )}
          {elections.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div className="icon-box icon-box-xl ib-orange-filled" style={{ margin: '0 auto 1.5rem' }}>
                <Vote size={28} />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: 8 }}>No elections yet</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: '2rem' }}>Create your first election to get started.</p>
              <button className="btn btn-primary btn-lg" onClick={() => { setShowModal(true); setCreateError(''); }}>
                <PlusCircle size={18} /> Create First Election
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ OVERVIEW ════════════════════════ */}
      {activeElection && activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem' }}>
          <div className="stat-grid" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <StatCard label="Total Voters" value={stats.total} sub={`${stats.sent} OTPs sent`} color="#6d28d9" icon={<Users size={18} />} className="ib-violet" />
            <StatCard label="Votes Cast" value={stats.voted} sub={`${turnout}% turnout`} color="#f97316" icon={<Vote size={18} />} className="ib-orange" />
            <StatCard label="Time Remaining" value={timeLeft} sub={activeElection.status === 'open' ? 'Election live' : 'Not started'} color={activeElection.status === 'open' ? '#16a34a' : '#94a3b8'} icon={<Clock size={18} />} className={activeElection.status === 'open' ? 'ib-green' : 'ib-sky'} />
          </div>

          <div className="card" style={{ gridColumn: 'span 8', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '1rem' }}>Voter Turnout</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.8125rem', marginTop: 2 }}>{stats.voted} of {stats.total} voters have cast ballots</p>
              </div>
              <span style={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1 }} className="text-gradient">{turnout}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${turnout}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>
              <span>0% — 0 votes</span>
              <span className="badge badge-orange">{turnout}% participation</span>
              <span>100% — {stats.total} votes</span>
            </div>
          </div>

          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <div className="icon-box icon-box-sm ib-violet"><Settings size={14} /></div>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Election Control</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 10, background: 'var(--surface-2)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>Status</span>
                <span className={`badge badge-dot ${activeElection.status === 'open' ? 'badge-green' : 'badge-slate'}`} style={{ textTransform: 'capitalize' }}>
                  {activeElection.status === 'open' ? 'Live' : 'Inactive'}
                </span>
              </div>
              {activeElection.status !== 'open' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Start Date &amp; Time</label>
                    <input type="datetime-local" className="input" style={{ fontSize: '0.8125rem' }} value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>End Date &amp; Time</label>
                    <input type="datetime-local" className="input" style={{ fontSize: '0.8125rem' }} value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                  <button
                    className="btn btn-primary btn-sm btn-full"
                    onClick={() => updateStatus('open', new Date(startTime).toISOString(), new Date(endTime).toISOString())}
                    disabled={!startTime || !endTime || new Date(endTime) <= new Date(startTime)}
                  >
                    <Play size={13} /> Start Election
                  </button>
                  {endTime && startTime && new Date(endTime) <= new Date(startTime) && (
                    <p style={{ fontSize: '0.75rem', color: '#dc2626' }}>End time must be after start time</p>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeElection.end_time && (
                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--surface-2)', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                      <span style={{ fontWeight: 600 }}>Ends:</span> {new Date(activeElection.end_time).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  )}
                  <button className="btn btn-full btn-sm" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }} onClick={() => updateStatus('closed')}>
                    <Square size={13} /> Stop Election
                  </button>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                <div className="icon-box icon-box-sm ib-orange"><Share2 size={14} /></div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Voter Link</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                <span style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  /e/{activeElection.id.slice(0, 16)}…
                </span>
                <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.625rem', gap: 4, color: copied ? '#16a34a' : 'var(--primary)', flexShrink: 0 }} onClick={copyLink}>
                  {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '1rem' }}>Live Results</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.8125rem', marginTop: 2 }}>Real-time vote distribution</p>
              </div>
              <div className="icon-box icon-box-sm ib-orange"><BarChart3 size={15} /></div>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.length ? chartData : MOCK_DATA} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-3)" tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#64748b' }} />
                  <YAxis stroke="var(--text-3)" tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#64748b' }} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-md)', fontFamily: 'Inter', fontSize: 13 }} />
                  <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                    {(chartData.length ? chartData : MOCK_DATA).map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="icon-box icon-box-sm ib-violet"><TrendingUp size={14} /></div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Participation Breakdown</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 0 }}>
              {[
                { label: 'Registered', val: stats.total },
                { label: 'OTPs Sent', val: stats.sent },
                { label: 'Voted', val: stats.voted },
                { label: 'Abstained', val: stats.total - stats.voted },
              ].map((row, i) => (
                <div key={row.label} style={{ padding: '1.25rem 1.5rem', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 }}>{row.label}</p>
                  <p style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-1)', lineHeight: 1 }}>{row.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeElection && activeTab === 'voters'    && <VoterManagement electionId={activeElection.id} />}
      {activeElection && activeTab === 'positions' && <CategoryManagement electionId={activeElection.id} />}

      {/* ═══════════════════ CREATE MODAL ════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={clearLogoModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="icon-box icon-box-md ib-orange-filled"><Vote size={20} /></div>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-1)' }}>New Election</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 2 }}>Configure election details</p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={clearLogoModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Logo upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                    Institution Logo <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span>
                  </label>

                  {logoPreview ? (
                    /* Preview */
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 14, border: '2px solid var(--border)', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoPreview(null); }}
                        style={{
                          position: 'absolute', top: -8, right: -8,
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#ef4444', border: '2px solid white',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                      <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-3)' }}>{logoFile?.name}</p>
                    </div>
                  ) : (
                    /* Drop zone */
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 14,
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? 'rgba(109,40,217,0.04)' : 'var(--surface-2)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: dragOver ? 'rgba(109,40,217,0.1)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UploadCloud size={20} style={{ color: dragOver ? 'var(--primary)' : 'var(--text-3)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: dragOver ? 'var(--primary)' : 'var(--text-2)' }}>
                          Drop image here or click to browse
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>PNG, JPG, SVG, WEBP — any size</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ''; }}
                  />
                </div>

                {/* Title & Institution */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Election Title</label>
                  <input className="input" placeholder="e.g. SRC General Election 2024" value={newElection.title} onChange={e => setNewElection({ ...newElection, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Institution</label>
                  <input className="input" placeholder="e.g. University of Cape Coast" value={newElection.institution} onChange={e => setNewElection({ ...newElection, institution: e.target.value })} required />
                </div>
              </div>

              {createError && (
                <div style={{ margin: '0 1.5rem', padding: '0.875rem', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  {createError}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-full" onClick={clearLogoModal}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={creating}>
                  {creating
                    ? <><Loader2 size={15} className="anim-spin" /> {uploadingLogo ? 'Uploading logo…' : 'Creating…'}</>
                    : <><Zap size={15} /> Create Election</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ DELETE CONFIRMATION ════════════ */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={20} style={{ color: '#dc2626' }} />
                </div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-1)' }}>Delete Election</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>This action cannot be undone</p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {showDeleteConfirm.logo_url
                    ? <img src={showDeleteConfirm.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <div className="icon-box icon-box-sm ib-orange-filled" style={{ flexShrink: 0 }}><Vote size={14} /></div>}
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>{showDeleteConfirm.title}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{showDeleteConfirm.institution}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.875rem 1rem', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '0.875rem', color: '#b91c1c', fontWeight: 600, marginBottom: 4 }}>The following will be permanently deleted:</p>
                <ul style={{ fontSize: '0.8125rem', color: '#b91c1c', paddingLeft: '1.25rem', margin: 0, lineHeight: 2 }}>
                  <li>All registered voters and their OTPs</li>
                  <li>All positions (categories) and candidates</li>
                  <li>All cast votes and audit records</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline btn-full" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button
                className="btn btn-full"
                style={{ background: '#dc2626', color: 'white', border: 'none' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 size={15} className="anim-spin" /> Deleting…</> : <><Trash2 size={15} /> Yes, Delete Election</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Election Card ── */
const ElectionCard = ({ election, delay, onClick, onDelete }: { election: Election; delay: number; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) => {
  const statusClass = election.status === 'open' ? 'badge-green' : election.status === 'closed' ? 'badge-red' : 'badge-orange';
  const iconClass   = election.status === 'open' ? 'ib-green-filled' : election.status === 'closed' ? 'ib-pink-filled' : 'ib-orange-filled';

  return (
    <div
      className={`card card-hover delay-${Math.min(delay + 1, 5)} anim-fade-in-up`}
      style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: 20 }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {election.logo_url
          ? <img src={election.logo_url} alt="logo" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
          : <div className={`icon-box icon-box-md ${iconClass}`}><Vote size={18} /></div>}
        <span className={`badge badge-dot ${statusClass}`} style={{ textTransform: 'capitalize' }}>{election.status}</span>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)', lineHeight: 1.3, marginBottom: 8 }} className="line-clamp-2">{election.title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-2)' }}>
            <Building2 size={13} /><span className="truncate">{election.institution}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-3)' }}>
            <Calendar size={13} />
            <span>{new Date(election.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Open <ChevronRight size={14} />
        </span>
        <button
          className="btn btn-icon btn-sm"
          style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}
          onClick={onDelete}
          title="Delete election"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, sub, color, icon, className }: any) => (
  <div className="stat-card" style={{ '--stat-color': color } as any}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div className={`icon-box icon-box-md ${className}`}>{icon}</div>
    </div>
    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
    <p style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--text-1)', lineHeight: 1, marginBottom: 8 }}>{value}</p>
    <span className="badge badge-slate" style={{ fontSize: '0.75rem' }}>{sub}</span>
  </div>
);

export default AdminDashboard;
