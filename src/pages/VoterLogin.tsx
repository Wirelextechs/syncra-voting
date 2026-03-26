import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, KeyRound, ArrowRight, Loader2, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VoterLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('voters').select('*').eq('identifier', identifier).eq('otp', otp).single();
      if (fetchError || !data) throw new Error('Invalid credentials. Please check your ID and OTP.');
      if (data.voted) throw new Error('You have already submitted your vote for this election.');
      localStorage.setItem('syncra_voter_id', data.id);
      localStorage.setItem('syncra_election_id', data.election_id);
      navigate('/voter/vote');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      minHeight: 'calc(100dvh - 56px)',
    }}>
      <style>{`
        @media(min-width:768px){
          .login-grid { grid-template-columns: 1fr 1fr !important; }
          .login-brand { display:flex !important; }
        }
      `}</style>
      <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 'inherit' }}>

        {/* ── Brand Panel (desktop only) ── */}
        <div className="login-brand" style={{
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          background: 'linear-gradient(135deg, #3b0764 0%, #581c87 40%, #7c3aed 100%)',
          gap: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Zap size={32} style={{ color: '#fb923c' }} />
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', marginBottom: '1rem', lineHeight: 1.1 }}>
              Syncra Voting
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.0625rem', lineHeight: 1.65, maxWidth: 340 }}>
              A secure, transparent digital voting platform built for institutions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 320 }}>
            {[
              { icon: <ShieldCheck size={18} />, label: 'End-to-end encrypted ballots' },
              { icon: <Lock size={18} />, label: 'OTP-verified voter identity' },
              { icon: <Zap size={18} />, label: 'Real-time transparent results' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.875rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <div style={{ color: '#fb923c', flexShrink: 0 }}>{item.icon}</div>
                <span style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Login Form Panel ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg)' }}>
          <div style={{ width: '100%', maxWidth: 420 }} className="anim-fade-in-up">
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
              <div className="icon-box icon-box-md ib-orange-filled" style={{ borderRadius: 14 }}>
                <Zap size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-1)' }}>Syncra</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>Voter Portal</p>
              </div>
            </div>

            <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-1)', marginBottom: 8, lineHeight: 1.2 }}>
              Sign in to vote
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.55 }}>
              Enter your voter ID and the OTP sent to your phone.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Index Number / Staff ID</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    className="input input-lg input-icon-l"
                    type="text"
                    placeholder="e.g. UCC/2024/0012"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>One-Time Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    className="input input-lg input-icon-l"
                    type="password"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    style={{ letterSpacing: '0.2em' }}
                  />
                </div>
              </div>

              {error && (
                <div className="anim-fade-in" style={{ padding: '0.875rem', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary btn-xl btn-full" style={{ marginTop: '0.5rem', borderRadius: 14 }}>
                {loading
                  ? <><Loader2 size={18} className="anim-spin" /> Verifying…</>
                  : <>Continue to Ballot <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: '0.8125rem' }}>
              <ShieldCheck size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span>Secured with end-to-end encryption. Your vote is anonymous.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterLogin;
