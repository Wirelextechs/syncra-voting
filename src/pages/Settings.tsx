import React, { useState } from 'react';
import { Bell, Shield, Save, CheckCheck, Globe, Lock, Server, ExternalLink } from 'lucide-react';

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

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 999, border: 'none',
      background: checked ? 'var(--primary)' : 'var(--border)',
      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
      boxShadow: checked ? '0 2px 8px rgba(249,115,22,0.4)' : 'none',
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

  const set = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  const handleSave = () => {
    // Save to localStorage as a simple config store
    localStorage.setItem('syncra_settings', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

      {/* General */}
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

      {/* Security */}
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

      {/* Notifications */}
      <Section title="Notifications" desc="Automated alerts and reporting" icon={<Bell size={18} />}>
        <SettingRow label="Enable Audit Log" sub="Record all admin actions and vote events for compliance">
          <Toggle checked={form.enableAuditLog} onChange={v => set('enableAuditLog', v)} />
        </SettingRow>
      </Section>

      {/* System */}
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
