import React, { useState, useEffect } from 'react';
import {
  Zap, LayoutDashboard, Settings,
  Menu, X, ChevronRight, LogOut, ExternalLink, ShieldCheck
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const SidebarContent: React.FC<{ onClose?: () => void; session: Session | null }> = ({ onClose, session }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isVoterPage = location.pathname.startsWith('/voter') || location.pathname.startsWith('/e/');
  const isHomePage = location.pathname === '/';
  if (isVoterPage || isHomePage) return null;

  const links = [
    { to: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard', exact: true },
    { to: '/admin/settings', icon: <Settings size={16} />, label: 'Settings', exact: false },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <>
      {/* Logo */}
      <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div className="icon-box icon-box-sm ib-orange-filled"><Zap size={15} /></div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-1)', lineHeight: 1.1 }}>Syncra</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Voting Platform</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="btn btn-icon btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.25rem', marginBottom: 4 }}>
          Admin
        </p>
        {links.map(({ to, icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {active && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Signed-in indicator */}
        {session?.user?.email && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.625rem 0.75rem', borderRadius: 10,
            background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)',
            marginBottom: 4,
          }}>
            <ShieldCheck size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span style={{
              fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {session.user.email}
            </span>
          </div>
        )}

        <button className="nav-item" onClick={handleSignOut} style={{ color: '#b91c1c' }}>
          <span className="nav-icon" style={{ color: '#b91c1c' }}><LogOut size={16} /></span>
          Sign Out
        </button>

        <div style={{ padding: '0.75rem 0.25rem 0.25rem', marginTop: 2 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(109,40,217,.06), rgba(249,115,22,.06))', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Syncra v1.0</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.5 }}>Secure · Transparent · Modern</p>
          </div>
        </div>
      </div>
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const isVoterPage = location.pathname.startsWith('/voter') || location.pathname.startsWith('/e/');
  const isHomePage = location.pathname === '/';
  const isAdminLogin = location.pathname === '/admin/login';
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const breadcrumbLabel = () => {
    if (location.pathname === '/admin') return null;
    if (location.pathname === '/admin/settings') return 'Settings';
    return null;
  };

  /* ── Home layout ── */
  if (isHomePage) return <>{children}</>;

  /* ── Voter layout ── */
  if (isVoterPage) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 56, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '1rem', position: 'sticky', top: 0, zIndex: 100 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div className="icon-box icon-box-sm ib-orange-filled"><Zap size={14} /></div>
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-1)' }}>Syncra</span>
          </Link>
          <div style={{ flex: 1 }} />
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)' }}>
            Admin <ExternalLink size={13} />
          </Link>
        </header>
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    );
  }

  /* ── Admin login layout (no sidebar) ── */
  if (isAdminLogin) return <>{children}</>;

  /* ── Admin layout ── */
  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent onClose={() => setMobileOpen(false)} session={session} />
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button className="btn btn-icon btn-outline" onClick={() => setMobileOpen(true)} style={{ display: 'none' }} id="mobile-menu-btn">
            <Menu size={18} />
          </button>
          <style>{`@media(max-width:768px){ #mobile-menu-btn { display:flex !important; } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
            <Link to="/admin" style={{ color: 'var(--text-3)', fontWeight: 500, textDecoration: 'none' }}>Admin</Link>
            {breadcrumbLabel() && (
              <>
                <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
                <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{breadcrumbLabel()}</span>
              </>
            )}
          </div>
          <div style={{ flex: 1 }} />
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.375rem 0.875rem', background: 'rgba(22,163,74,.08)', border: '1px solid rgba(22,163,74,.2)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
              System Live
            </div>
          )}
        </header>
        <main className="page-content anim-fade-in-up">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
