import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, Vote, ShieldCheck, Globe, Clock, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(249,115,22,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 24, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', marginBottom: '1.75rem' }}>
          <Zap size={36} style={{ color: '#fb923c' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '1rem' }}>
          Syncra Voting
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: '3rem', maxWidth: 420, margin: '0 auto 3rem' }}>
          A secure, transparent digital voting platform built for institutions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          <button
            onClick={() => navigate('/voter/login')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              padding: '2rem 1.5rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.2)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Vote size={24} style={{ color: '#fb923c' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 4 }}>Voter Portal</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Sign in with your voter ID to cast your ballot</p>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>

          <button
            onClick={() => navigate('/admin')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              padding: '2rem 1.5rem',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.3)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(109,40,217,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard size={24} style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 4 }}>Admin Console</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Manage elections, voters and view live results</p>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
          {[
            { icon: <ShieldCheck size={14} />, label: 'End-to-end Encrypted' },
            { icon: <Globe size={14} />, label: 'Vote Anywhere' },
            { icon: <Clock size={14} />, label: 'Real-time Results' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              <span style={{ color: '#4ade80' }}>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
