import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Election } from '../types';
import { ArrowRight, ShieldCheck, Globe, Clock, Lock, Zap } from 'lucide-react';

const VoterWelcome: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { if (id) fetchElection(); }, [id]);

  const fetchElection = async () => {
    const { data } = await supabase.from('elections').select('*').eq('id', id).single();
    if (data) setElection(data);
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100dvh - 56px)', flexDirection: 'column', gap: 16 }}>
      <div className="anim-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)' }} />
      <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem' }}>Loading election…</p>
    </div>
  );

  if (!election) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100dvh - 56px)', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '3rem', textAlign: 'center' }}>
        <div className="icon-box icon-box-xl ib-orange" style={{ margin: '0 auto 1.5rem', borderRadius: 20 }}><Lock size={28} /></div>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 8 }}>Election Not Found</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: '2rem', lineHeight: 1.6 }}>The link may be invalid or this election has ended.</p>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/')}>Return Home</button>
      </div>
    </div>
  );

  const features = [
    { icon: <Globe size={20} />, color: 'ib-violet', title: 'Vote Anywhere', desc: 'Cast your ballot securely from any device.' },
    { icon: <ShieldCheck size={20} />, color: 'ib-orange', title: 'Verified Identity', desc: 'OTP authentication ensures vote integrity.' },
    { icon: <Clock size={20} />, color: 'ib-green', title: 'Live Results', desc: 'Tallies update in real-time as votes come in.' },
  ];

  return (
    <div style={{ minHeight: 'calc(100dvh - 56px)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
        padding: 'clamp(3rem, 8vw, 6rem) 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle decoration */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(249,115,22,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.375rem 1rem', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
            <ShieldCheck size={14} style={{ color: '#4ade80' }} /> Secure Institutional Ballot
          </span>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem' }}>
            {election.institution}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.375rem)', color: 'rgba(255,255,255,0.65)', fontWeight: 500, fontStyle: 'italic', marginBottom: '2.5rem' }}>
            {election.title}
          </p>
          <button
            onClick={() => navigate('/voter/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '1rem 2.5rem',
              borderRadius: 14,
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.0625rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(249,115,22,0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 40px rgba(249,115,22,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(249,115,22,0.4)'; }}
          >
            Cast Your Vote <ArrowRight size={20} />
          </button>
          <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Lock size={13} /> Encrypted · Anonymous · Tamper-proof
          </p>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ flex: 1, padding: '3rem 1.5rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {features.map((f, i) => (
            <div key={f.title} className={`card anim-fade-in-up delay-${i + 1}`} style={{ padding: '1.75rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className={`icon-box icon-box-md ${f.color}`} style={{ flexShrink: 0 }}>{f.icon}</div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-1)', marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust footer */}
        <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          {['256-bit Encryption', 'Anonymous Voting', 'Audit Trails', 'Real-time Sync'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>
              <Zap size={14} style={{ color: 'var(--primary)' }} /> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoterWelcome;
