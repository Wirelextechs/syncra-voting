import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Zap, Mail, Lock, ArrowRight, Loader2,
  ShieldCheck, Eye, EyeOff, AlertCircle, UserPlus, LogIn
} from 'lucide-react';

type Mode = 'login' | 'signup';

const AdminLogin: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin', { replace: true });
      else setChecking(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;
      if (data.session) {
        navigate('/admin', { replace: true });
      } else {
        setInfo('Account created! Check your email for a confirmation link, then sign in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="anim-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)' }} />
    </div>
  );

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      gridTemplateColumns: '1fr',
      background: 'var(--bg)',
    }}>
      <style>{`
        @media(min-width: 900px) {
          .aLogin-grid { grid-template-columns: 1fr 1fr !important; }
          .aLogin-brand { display: flex !important; }
        }
      `}</style>
      <div className="aLogin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 'inherit' }}>

        {/* ── Brand panel ── */}
        <div className="aLogin-brand" style={{
          display: 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          background: 'linear-gradient(150deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
          gap: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(249,115,22,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: 'rgba(249,115,22,0.15)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2rem',
              border: '1px solid rgba(249,115,22,0.3)',
              boxShadow: '0 8px 32px rgba(249,115,22,0.2)',
            }}>
              <Zap size={36} style={{ color: '#fb923c' }} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.1 }}>
              Syncra Admin
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.65, maxWidth: 340 }}>
              The secure control panel for managing institutional elections.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%', maxWidth: 320 }}>
            {[
              { icon: <ShieldCheck size={17} />, label: 'Role-based access control' },
              { icon: <Lock size={17} />, label: 'Session-protected console' },
              { icon: <Zap size={17} />, label: 'Real-time election management' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '0.875rem 1rem', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(4px)',
              }}>
                <div style={{ color: '#fb923c', flexShrink: 0 }}>{item.icon}</div>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form panel ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: 420 }} className="anim-fade-in-up">

            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
              <div className="icon-box icon-box-md ib-orange-filled" style={{ borderRadius: 14 }}><Zap size={20} /></div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-1)' }}>Syncra</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>Admin Console</p>
              </div>
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 12, padding: 4, marginBottom: '2rem', gap: 4 }}>
              {([['login', <LogIn size={14} />, 'Sign In'], ['signup', <UserPlus size={14} />, 'Create Account']] as const).map(([m, icon, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setInfo(''); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '0.625rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.18s',
                    background: mode === m ? '#fff' : 'transparent',
                    color: mode === m ? 'var(--text-1)' : 'var(--text-3)',
                    boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                  }}
                >{icon} {label}</button>
              ))}
            </div>

            <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--text-1)', marginBottom: 6, lineHeight: 1.2 }}>
              {mode === 'login' ? 'Welcome back' : 'Set up admin access'}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.55 }}>
              {mode === 'login'
                ? 'Enter your admin credentials to access the console.'
                : 'Create your administrator account for this platform.'}
            </p>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    className="input input-lg input-icon-l"
                    type="email"
                    placeholder="admin@institution.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input
                    className="input input-lg input-icon-l"
                    type={showPw ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                    <input
                      className="input input-lg input-icon-l"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="anim-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.875rem', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.875rem', fontWeight: 500 }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}

              {/* Info */}
              {info && (
                <div className="anim-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.875rem', borderRadius: 10, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803d', fontSize: '0.875rem', fontWeight: 500 }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-xl btn-full"
                style={{ marginTop: '0.25rem', borderRadius: 14 }}
              >
                {loading
                  ? <><Loader2 size={18} className="anim-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                  : <>{mode === 'login' ? <>Sign In <ArrowRight size={18} /></> : <>Create Account <ArrowRight size={18} /></>}</>
                }
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: '0.8rem' }}>
              <ShieldCheck size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
              <span>Secured by Supabase Auth. Sessions expire automatically.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
