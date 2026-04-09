import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, ArrowRight, ArrowLeft, Send, ShieldCheck, Loader2, User, AlertTriangle, Vote, UserCheck } from 'lucide-react';
import type { Category, Candidate, Voter } from '../types';

const getSettings = () => {
  try { return JSON.parse(localStorage.getItem('syncra_settings') || '{}'); } catch { return {}; }
};

const VotePage: React.FC = () => {
  const [voter, setVoter] = useState<Voter | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  // 'welcome' → personalised greeting; 'voting' → ballot
  const [phase, setPhase] = useState<'welcome' | 'voting'>('welcome');
  const navigate = useNavigate();
  const settings = getSettings();
  const maintenanceMode = settings.maintenanceMode === true;

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const voterId = localStorage.getItem('syncra_voter_id');
    const electionId = localStorage.getItem('syncra_election_id');
    if (!voterId || !electionId) { navigate('/voter/login'); return; }
    const { data } = await supabase.from('voters').select('*').eq('id', voterId).single();
    if (!data) { navigate('/voter/login'); return; }
    setVoter(data);
    await fetchData(electionId);
  };

  const fetchData = async (electionId: string) => {
    const { data: cats } = await supabase.from('categories').select('*').eq('election_id', electionId);
    if (cats) {
      setCategories(cats);
      const map: Record<string, Candidate[]> = {};
      for (const cat of cats) {
        const { data: cands } = await supabase.from('candidates').select('*').eq('category_id', cat.id);
        if (cands) map[cat.id] = cands;
      }
      setCandidates(map);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!voter) return;
    setSubmitting(true);
    try {
      const votes = categories.map(cat => ({ voter_id: voter.id, category_id: cat.id, candidate_id: selections[cat.id] }));
      const { error } = await supabase.from('votes').insert(votes);
      if (!error) {
        for (const v of votes) await supabase.rpc('increment_candidate_votes', { candidate_uuid: v.candidate_id });
        await supabase.from('voters').update({ voted: true }).eq('id', voter.id);
        setCompleted(true);
        localStorage.removeItem('syncra_voter_id');
        localStorage.removeItem('syncra_election_id');
      }
    } finally { setSubmitting(false); }
  };

  /* ── Maintenance Mode ── */
  if (!loading && maintenanceMode) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 56px)', padding: '2rem' }}>
      <div className="card anim-fade-in-up" style={{ maxWidth: 440, width: '100%', padding: '3rem', textAlign: 'center' }}>
        <div className="icon-box icon-box-xl" style={{ margin: '0 auto 1.5rem', borderRadius: 20, background: 'rgba(234,179,8,0.1)', color: '#ca8a04' }}>
          <AlertTriangle size={28} />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 8, color: 'var(--text-1)' }}>Under Maintenance</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: '2rem', lineHeight: 1.6 }}>
          The voting portal is temporarily unavailable for maintenance. Please try again later.
        </p>
        <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>Return Home</button>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 56px)', gap: 16 }}>
      <div className="anim-spin" style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)' }} />
      <p style={{ color: 'var(--text-2)' }}>Loading your ballot…</p>
    </div>
  );

  /* ── Completed ── */
  if (completed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 56px)', padding: '2rem' }}>
      <div className="card anim-scale-in" style={{ maxWidth: 480, width: '100%', padding: '3.5rem', textAlign: 'center' }}>
        <div className="icon-box icon-box-xl ib-green-filled" style={{ margin: '0 auto 1.5rem', borderRadius: 24 }}>
          <CheckCircle2 size={32} />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-1)', marginBottom: 10 }}>Vote Submitted!</h1>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '2rem', fontSize: '1rem' }}>
          Your ballot has been securely recorded. Thank you for participating.
        </p>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    </div>
  );

  const cat = categories[currentIndex];
  const cands = candidates[cat?.id] || [];
  const hasSelected = !!selections[cat?.id];
  const isLast = currentIndex === categories.length - 1;
  const progress = categories.length > 0 ? ((currentIndex + 1) / categories.length) * 100 : 0;

  /* ── Welcome screen ── */
  if (!loading && !completed && phase === 'welcome' && voter) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100dvh - 56px)', padding: '1.5rem', background: 'var(--bg)' }}>
      <div className="card anim-scale-in" style={{ maxWidth: 480, width: '100%', padding: '3rem 2.5rem', textAlign: 'center' }}>
        {/* Avatar circle */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, #fb923c 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.75rem',
          boxShadow: '0 8px 32px rgba(249,115,22,0.3)',
        }}>
          <User size={38} style={{ color: '#fff' }} />
        </div>

        {/* Greeting */}
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Welcome back</p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
          {voter.name}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '2rem', lineHeight: 1.55 }}>
          You are verified and ready to cast your ballot.<br />
          <span style={{ fontFamily: 'monospace', background: 'var(--surface-2)', padding: '0.125rem 0.5rem', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--text-3)' }}>
            ID: {voter.identifier}
          </span>
        </p>

        {/* Trust badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: '2rem' }}>
          {[
            { icon: <ShieldCheck size={13} />, label: 'Identity Verified' },
            { icon: <UserCheck size={13} />, label: 'Account Confirmed' },
            { icon: <Vote size={13} />, label: `${categories.length} Position${categories.length !== 1 ? 's' : ''} to Vote` },
          ].map(b => (
            <span key={b.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.375rem 0.75rem', borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>
              {b.icon} {b.label}
            </span>
          ))}
        </div>

        <button
          className="btn btn-primary btn-xl btn-full"
          style={{ borderRadius: 14 }}
          onClick={() => setPhase('voting')}
        >
          Start Voting <ArrowRight size={18} />
        </button>

        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <ShieldCheck size={12} style={{ color: '#16a34a' }} />
          Your vote is anonymous and encrypted
        </p>
      </div>
    </div>
  );

  /* ── Ballot ── */
  return (
    <div style={{ minHeight: 'calc(100dvh - 56px)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top progress bar ── */}
      <div style={{ position: 'sticky', top: 56, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>{cat?.name}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 2 }}>Position {currentIndex + 1} of {categories.length}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {voter && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '0.3rem 0.75rem', borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(251,146,60,0.08) 100%)',
                  border: '1px solid rgba(249,115,22,0.25)',
                  fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)',
                }}>
                  <User size={12} /> {voter.name}
                </span>
              )}
              <span className="badge badge-violet">
                <ShieldCheck size={12} /> Secure Ballot
              </span>
              <span className="badge badge-slate">{Math.round(progress)}% Complete</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ── Candidate Grid ── */}
      <div style={{ flex: 1, padding: '2rem 1.5rem 120px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {cands.map((cand, i) => {
            const selected = selections[cat.id] === cand.id;
            return (
              <div
                key={cand.id}
                className={`card card-hover anim-fade-in-up delay-${Math.min(i + 1, 5)}`}
                onClick={() => setSelections(prev => ({ ...prev, [cat.id]: cand.id }))}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  boxShadow: selected ? '0 0 0 4px rgba(249,115,22,0.12), 0 4px 20px rgba(249,115,22,0.15)' : 'var(--shadow-sm)',
                  transform: selected ? 'translateY(-3px)' : '',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.875rem',
                  position: 'relative',
                }}
              >
                {/* Selected check */}
                {selected && (
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }}>
                    <CheckCircle2 size={14} style={{ color: '#fff' }} />
                  </div>
                )}

                {/* Photo */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--surface-2)',
                  border: `2px solid ${selected ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s',
                }}>
                  {cand.photo_url
                    ? <img src={cand.photo_url} alt={cand.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={40} style={{ color: 'var(--text-3)' }} />}
                </div>

                {/* Name */}
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-1)', lineHeight: 1.3 }}>{cand.name}</p>

                {/* State pill */}
                <span className={`badge ${selected ? 'badge-orange' : 'badge-slate'}`} style={{ transition: 'all 0.2s' }}>
                  {selected ? '✓ Selected' : 'Tap to choose'}
                </span>
              </div>
            );
          })}

          {cands.length === 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-2)' }}>
              <User size={40} style={{ margin: '0 auto 1rem', color: 'var(--border)' }} />
              <p style={{ fontWeight: 600 }}>No candidates yet for this position.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Nav Dock ── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        padding: '1rem 1.5rem',
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <button
            className="btn btn-outline"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {categories.map((_, i) => (
              <div key={i} style={{
                height: 6,
                width: i === currentIndex ? 24 : 8,
                borderRadius: 99,
                background: i < currentIndex ? 'var(--primary)' : i === currentIndex ? 'var(--secondary)' : 'var(--border)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {isLast ? (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!hasSelected || submitting}>
              {submitting ? <><Loader2 size={16} className="anim-spin" /> Submitting…</> : <><Send size={16} /> Submit Ballot</>}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setCurrentIndex(prev => prev + 1)} disabled={!hasSelected}>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotePage;
