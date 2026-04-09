import React, { useState, useEffect } from 'react';
import { Bell, Shield, Save, CheckCheck, Globe, Lock, Server, ExternalLink, UserCheck, UserX, Clock, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── Shared UI primitives ── */
const Section: React.FC<{ title: string; desc: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, desc, icon, children }) => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div className="icon-box icon-box-md ib-violet" style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>{title}</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 2 }}>{desc}</p>
      </div>
    </div>
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>{children}</div>
  </div>
);

const SettingRow: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
    <div style={{ flex: 1, minWidth: 200 }}>
      <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-1)' }}>{label}</p>
      {sub && <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 2 }}>{sub}</p>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    style={{
      width: 44, height: 24, borderRadius: 999, border: 'none',
      background: checked ? 'var(--primary)' : 'var(--border)',
      cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s',
      boxShadow: checked ? '0 2px 8px rgba(249,115,22,0.4)' : 'none',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: checked ? 22 : 2,
      width: 20, height: 20, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
    }} />
  </button>
);

/* ── Types ── */
type AdminAccount = { id: string; auth_user_id: string; email: string; status: string; created_at: string };

/* ══════════════════════════════════════════════════════════ */
const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platformName: 'Syncra Voting',
    supportEmail: 'admin@syncra.app',
    allowMultipleElections: true,
    requireOTP: true,
    showLiveResults: false,
    allowVoterReceipt: true,
    otpLength: '6',
    otpExpiry: '60',
    defaultVotingDuration: '480',
    enableAuditLog: true,
    maintenanceMode: false,
  });

  // Admin access state
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [savingSignups, setSavingSignups] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  /* ── Init ── */
  useEffect(() => {
    // Load local settings
    try {
      const stored = JSON.parse(localStorage.getItem('syncra_settings') || '{}');
      if (Object.keys(stored).length > 0) setForm(f => ({ ...f, ...stored }));
    } catch {}

    // Load DB settings + admin accounts
    loadSignupsFlag();
    loadAdminAccounts();

    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  const loadSignupsFlag = async () => {
    const { data } = await supabase.from('platform_config').select('value').eq('key', 'signups_enabled').single();
    if (data) setSignupsEnabled(data.value !== false && data.value !== 'false');
  };

  const loadAdminAccounts = async () => {
    setLoadingAccounts(true);
    const { data } = await supabase.from('admin_accounts').select('*').order('created_at', { ascending: true });
    setAdminAccounts(data || []);
    setLoadingAccounts(false);
  };

  /* ── Toggle signups enabled ── */
  const handleSignupsToggle = async (value: boolean) => {
    setSavingSignups(true);
    setSignupsEnabled(value);
    await supabase.from('platform_config').upsert({ key: 'signups_enabled', value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setSavingSignups(false);
  };

  /* ── Approve / Reject an admin account ── */
  const handleAccountAction = async (account: AdminAccount, newStatus: 'approved' | 'rejected') => {
    setActionLoading(account.id);
    await supabase.from('admin_accounts').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', account.id);
    await loadAdminAccounts();
    setActionLoading(null);
  };

  /* ── Save local settings ── */
  const handleSave = () => {
    localStorage.setItem('syncra_settings', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const pendingAccounts = adminAccounts.filter(a => a.status === 'pending');
  const otherAccounts = adminAccounts.filter(a => a.status !== 'pending');

  const statusBadge = (status: string) => {
    if (status === 'approved') return { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.25)', color: '#15803d', label: 'Approved' };
    if (status === 'rejected') return { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', label: 'Rejected' };
    return { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.3)', color: '#854d0e', label: 'Pending' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--text-1)' }}>Settings</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem', marginTop: 4 }}>Configure platform behaviour and defaults</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? <><CheckCheck size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {/* ══ Admin Access ══ */}
      <Section title="Admin Access" desc="Control who can create and access the admin console" icon={<Users size={18} />}>

        {/* Signups toggle */}
        <SettingRow
          label="Allow New Admin Signups"
          sub="When disabled, the Create Account option is hidden from the login page and new signups are blocked server-side"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {savingSignups && <Loader2 size={14} className="anim-spin" style={{ color: 'var(--text-3)' }} />}
            <Toggle checked={signupsEnabled} onChange={handleSignupsToggle} disabled={savingSignups} />
          </div>
        </SettingRow>

        {!signupsEnabled && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.25)', fontSize: '0.8125rem', color: '#854d0e', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Lock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            Signups are <strong>disabled</strong>. Only existing admin accounts can sign in. No new accounts can be created.
          </div>
        )}

        <hr className="divider" />

        {/* Pending approvals */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-1)' }}>Admin Accounts</p>
            {pendingAccounts.length > 0 && (
              <span style={{ padding: '0.2rem 0.625rem', borderRadius: 999, background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', fontSize: '0.75rem', fontWeight: 700, color: '#854d0e' }}>
                {pendingAccounts.length} pending
              </span>
            )}
          </div>

          {loadingAccounts ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', fontSize: '0.875rem' }}>
              <Loader2 size={16} className="anim-spin" /> Loading accounts…
            </div>
          ) : adminAccounts.length === 0 ? (
            <div style={{ padding: '1.5rem', borderRadius: 10, background: 'var(--surface-2)', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
              No admin accounts yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {/* Pending first */}
              {[...pendingAccounts, ...otherAccounts].map(acct => {
                const badge = statusBadge(acct.status);
                const isCurrentUser = acct.auth_user_id === currentUserId;
                const isLoading = actionLoading === acct.id;
                return (
                  <div key={acct.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '0.875rem 1rem',
                    borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                  }}>
                    {/* Avatar */}
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
                        {acct.email[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Email + meta */}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-1)' }}>{acct.email}</p>
                        {isCurrentUser && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', background: 'var(--border)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>You</span>}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                        Joined {new Date(acct.created_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: 999, background: badge.bg, border: `1px solid ${badge.border}`, fontSize: '0.75rem', fontWeight: 700, color: badge.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {acct.status === 'pending' && <Clock size={11} />}
                      {acct.status === 'approved' && <UserCheck size={11} />}
                      {acct.status === 'rejected' && <UserX size={11} />}
                      {badge.label}
                    </span>

                    {/* Actions — don't show for current user */}
                    {!isCurrentUser && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {acct.status !== 'approved' && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803d', gap: 5 }}
                            onClick={() => handleAccountAction(acct, 'approved')}
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 size={12} className="anim-spin" /> : <UserCheck size={12} />}
                            Approve
                          </button>
                        )}
                        {acct.status !== 'rejected' && (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', gap: 5 }}
                            onClick={() => handleAccountAction(acct, 'rejected')}
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 size={12} className="anim-spin" /> : <UserX size={12} />}
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      {/* ══ General ══ */}
      <Section title="General" desc="Platform identity and basic configuration" icon={<Globe size={18} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Platform Name</label>
            <input className="input" value={form.platformName} onChange={e => set('platformName', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Support Email</label>
            <input className="input" type="email" value={form.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
          </div>
        </div>
        <hr className="divider" />
        <SettingRow label="Allow Multiple Active Elections" sub="Let admins run more than one election simultaneously">
          <Toggle checked={form.allowMultipleElections} onChange={v => set('allowMultipleElections', v)} />
        </SettingRow>
        <SettingRow label="Show Live Results" sub="Show real-time vote counts to voters after they cast their ballot">
          <Toggle checked={form.showLiveResults} onChange={v => set('showLiveResults', v)} />
        </SettingRow>
        <SettingRow label="Voter Ballot Receipt" sub="Send voters a confirmation of their vote">
          <Toggle checked={form.allowVoterReceipt} onChange={v => set('allowVoterReceipt', v)} />
        </SettingRow>
      </Section>

      {/* ══ Security ══ */}
      <Section title="Security & Authentication" desc="OTP and voter verification settings" icon={<Shield size={18} />}>
        <SettingRow label="Require OTP Authentication" sub="Voters must verify with a one-time password before voting">
          <Toggle checked={form.requireOTP} onChange={v => set('requireOTP', v)} />
        </SettingRow>
        <hr className="divider" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>OTP Length (digits)</label>
            <select className="input" value={form.otpLength} onChange={e => set('otpLength', e.target.value)}>
              <option value="4">4 digits</option>
              <option value="6">6 digits</option>
              <option value="8">8 digits</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>OTP Expiry (minutes)</label>
            <input className="input" type="number" min="5" max="1440" value={form.otpExpiry} onChange={e => set('otpExpiry', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Default Voting Duration (mins)</label>
            <input className="input" type="number" min="30" max="10080" value={form.defaultVotingDuration} onChange={e => set('defaultVotingDuration', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ══ Notifications ══ */}
      <Section title="Notifications" desc="Automated alerts and reporting" icon={<Bell size={18} />}>
        <SettingRow label="Enable Audit Log" sub="Record all admin actions and vote events for compliance">
          <Toggle checked={form.enableAuditLog} onChange={v => set('enableAuditLog', v)} />
        </SettingRow>
      </Section>

      {/* ══ System ══ */}
      <Section title="System" desc="Platform maintenance and diagnostics" icon={<Server size={18} />}>
        <SettingRow label="Maintenance Mode" sub="Temporarily block all voter access while maintaining admin access">
          <Toggle checked={form.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
        </SettingRow>
        <hr className="divider" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '1rem 1.25rem', flex: '1 1 200px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Version</p>
            <p style={{ fontWeight: 700, color: 'var(--text-1)' }}>Syncra v1.0.0</p>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem', flex: '1 1 200px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Database</p>
            <p style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Supabase — Connected
            </p>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem', flex: '1 1 200px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Storage</p>
            <p style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Supabase Storage
            </p>
          </div>
        </div>
        <div style={{ padding: '1rem', borderRadius: 10, background: 'rgba(109,40,217,0.05)', border: '1px solid rgba(109,40,217,0.15)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Lock size={16} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: 4 }}>Privacy & Data</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              All voter data and ballots are stored securely in your Supabase project. Votes are anonymous and cannot be linked back to individual voters after submission.
              {' '}<a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Supabase Privacy Policy <ExternalLink size={12} /></a>
            </p>
          </div>
        </div>
      </Section>

      <div style={{ height: '1rem' }} />
    </div>
  );
};

export default SettingsPage;
