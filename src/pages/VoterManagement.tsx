import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  UserPlus, Upload, Trash2, Search,
  CheckCircle2, XCircle, Send, Loader2, Users, X, Download,
  Copy, MessageSquare, ExternalLink, FileDown
} from 'lucide-react';
import type { Voter, Election } from '../types';

/* ── Phone normalisation ─────────────────────────────────── */
const normalizePhone = (raw: string): string => {
  if (!raw) return raw;
  const clean = raw.replace(/[\s\-().]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('00')) return '+' + clean.slice(2);
  if (/^0\d{9}$/.test(clean)) return '+233' + clean.slice(1);
  if (/^\d{9}$/.test(clean)) return '+233' + clean;
  return clean;
};

/* ── OTP helpers ─────────────────────────────────────────── */
const getOtpLength = (): number => {
  try {
    const s = JSON.parse(localStorage.getItem('syncra_settings') || '{}');
    const len = parseInt(s.otpLength || '6', 10);
    return [4, 6, 8].includes(len) ? len : 6;
  } catch { return 6; }
};

const generateOtp = () => {
  const len = getOtpLength();
  const min = Math.pow(10, len - 1);
  const max = Math.pow(10, len) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/* ── OTP message builder ─────────────────────────────────── */
const buildOtpMessage = (voter: Voter, electionTitle: string, electionLink: string): string =>
  `Hello ${voter.name},\n\nYou have been registered to vote in the ${electionTitle}.\n\nYour Voter ID: ${voter.identifier}\nYour OTP: ${voter.otp}\n\nCast your vote here:\n${electionLink}\n\nDo not share your OTP with anyone. It is valid for this election only.`;

/* ── Sample CSV template ── */
const SAMPLE_CSV = `name,identifier,phone,class
Kwame Mensah,UCC/2024/001,+233241234567,Level 300
Abena Serwaa,UCC/2024/002,+233501234567,Level 200
Kofi Asante,UCC/2024/003,+233271234567,Level 400
Ama Owusu,UCC/2024/004,+233201234567,Level 100`;

const downloadSampleCsv = () => {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'syncra_voters_template.csv';
  link.click();
  URL.revokeObjectURL(url);
};

/* ─────────────────────────────────────────── Component ──── */
const VoterManagement: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newVoter, setNewVoter] = useState({ name: '', identifier: '', phone: '', class: '' });
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showOtpPreview, setShowOtpPreview] = useState(false);

  useEffect(() => { if (electionId) { fetchVoters(); fetchElection(); } }, [electionId]);

  const fetchElection = async () => {
    const { data } = await supabase.from('elections').select('*').eq('id', electionId).single();
    if (data) setElection(data);
  };

  const fetchVoters = async () => {
    const { data } = await supabase.from('voters').select('*').eq('election_id', electionId).order('name');
    if (data) setVoters(data);
    setLoading(false);
  };

  const electionLink = `${window.location.origin}/e/${electionId}`;
  const electionTitle = election ? `${election.title} — ${election.institution}` : 'this election';

  const getMsg = (voter: Voter) => buildOtpMessage(voter, electionTitle, electionLink);

  const copyMsg = (voter: Voter) => {
    navigator.clipboard.writeText(getMsg(voter));
    setCopiedId(voter.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadAllMessages = () => {
    const unsent = voters.filter(v => !v.otp_sent);
    const content = unsent.map(v =>
      `──────────────────────────────\n${getMsg(v)}\n`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otp_messages_${electionId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = generateOtp();
    const voterToInsert = { ...newVoter, phone: normalizePhone(newVoter.phone) };
    const { data } = await supabase
      .from('voters')
      .insert([{ ...voterToInsert, election_id: electionId, otp, otp_sent: false }])
      .select().single();
    if (data) {
      setVoters(p => [...p, data]);
      setNewVoter({ name: '', identifier: '', phone: '', class: '' });
      setShowAdd(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this voter? This cannot be undone.')) return;
    setDeleting(id);
    const { error } = await supabase.from('voters').delete().eq('id', id);
    if (!error) setVoters(p => p.filter(v => v.id !== id));
    setDeleting(null);
  };

  const handleCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async ev => {
      const lines = (ev.target?.result as string).split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const batch = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        const v: any = { election_id: electionId, otp: generateOtp(), otp_sent: false };
        headers.forEach((h, i) => {
          if (h.includes('name')) v.name = vals[i];
          if (h.includes('id') || h.includes('index') || h.includes('staff')) v.identifier = vals[i];
          if (h.includes('phone')) v.phone = normalizePhone(vals[i] || '');
          if (h.includes('class')) v.class = vals[i];
        });
        return v;
      }).filter(v => v.name && v.identifier);
      if (batch.length) {
        const { data } = await supabase.from('voters').insert(batch).select();
        if (data) setVoters(p => [...p, ...data]);
      }
    };
    reader.readAsText(file);
  };

  const confirmSendOtps = async () => {
    setSending(true);
    const { error } = await supabase.from('voters').update({ otp_sent: true }).eq('election_id', electionId).eq('otp_sent', false);
    if (!error) setVoters(p => p.map(v => ({ ...v, otp_sent: true })));
    setSending(false);
    setShowOtpPreview(false);
  };

  const unsentVoters = voters.filter(v => !v.otp_sent);
  const filtered = voters.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.identifier.toLowerCase().includes(search.toLowerCase())
  );
  const voted = voters.filter(v => v.voted).length;
  const otpSent = voters.filter(v => v.otp_sent).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Mini stats */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { l: 'Registered', v: voters.length },
          { l: 'OTPs Sent',  v: otpSent },
          { l: 'Voted',      v: voted },
          { l: 'Pending',    v: voters.length - voted },
        ].map(s => (
          <div key={s.l} className="card" style={{ padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
            <p style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-1)', lineHeight: 1 }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search by name or ID…" style={{ paddingLeft: '2.375rem' }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} /> Add Voter
          </button>

          {/* CSV upload + sample download */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', borderRadius: 0, border: 'none', borderRight: '1px solid var(--border)' }}>
              <Upload size={14} style={{ color: 'var(--primary)' }} /> Upload CSV
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsv} />
            </label>
            <button className="btn btn-ghost btn-sm" onClick={downloadSampleCsv} title="Download sample CSV template" style={{ borderRadius: 0, gap: 4 }}>
              <Download size={14} style={{ color: 'var(--secondary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>Sample</span>
            </button>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            disabled={unsentVoters.length === 0 || sending || loading}
            onClick={() => setShowOtpPreview(true)}
          >
            {sending ? <Loader2 size={14} className="anim-spin" /> : <Send size={14} />}
            Send OTPs {unsentVoters.length > 0 && `(${unsentVoters.length})`}
          </button>
        </div>
      </div>

      {/* CSV helper tip */}
      <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(109,40,217,0.04)', border: '1px solid rgba(109,40,217,0.12)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-2)' }}>
        <Download size={14} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
        <span>Download the <button onClick={downloadSampleCsv} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}>sample CSV template</button>, fill it with voter data, and upload it directly. Share the template with institutions for easy onboarding.</span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Voter</th>
                <th>ID / Index</th>
                <th className="hide-mobile">Class</th>
                <th>OTP Status</th>
                <th>Voted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(voter => (
                <tr key={voter.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-box icon-box-sm ib-violet" style={{ flexShrink: 0 }}><Users size={14} /></div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.2 }}>{voter.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{voter.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-2)' }}>{voter.identifier}</td>
                  <td className="hide-mobile" style={{ color: 'var(--text-2)', fontSize: '0.8125rem' }}>{voter.class || '—'}</td>
                  <td>
                    <span className={`badge ${voter.otp_sent ? 'badge-green' : 'badge-yellow'}`}>
                      {voter.otp_sent ? 'Sent' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {voter.voted
                      ? <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                      : <XCircle size={18} style={{ color: 'var(--border)' }} />}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        onClick={() => copyMsg(voter)}
                        title="Copy OTP message with election link"
                        style={{ color: copiedId === voter.id ? '#16a34a' : 'var(--secondary)' }}
                      >
                        {copiedId === voter.id ? <CheckCircle2 size={13} /> : <MessageSquare size={13} />}
                      </button>
                      <button
                        className="btn btn-icon btn-danger-ghost btn-sm"
                        disabled={deleting === voter.id}
                        onClick={() => handleDelete(voter.id)}
                        title="Delete voter"
                      >
                        {deleting === voter.id ? <Loader2 size={13} className="anim-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
                    {search ? `No voters match "${search}"` : 'No voters registered. Use Upload CSV or Add Voter to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── OTP Preview Modal ── */}
      {showOtpPreview && (
        <div className="modal-overlay" onClick={() => !sending && setShowOtpPreview(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="icon-box icon-box-md ib-orange-filled"><Send size={18} /></div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-1)' }}>OTP Message Preview</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{unsentVoters.length} voter{unsentVoters.length !== 1 ? 's' : ''} will be marked as notified</p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowOtpPreview(false)} disabled={sending}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Election link */}
              <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(109,40,217,0.05)', border: '1px solid rgba(109,40,217,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
                <ExternalLink size={14} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-2)' }}>Election link included in every message:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--secondary)', fontWeight: 600, wordBreak: 'break-all' }}>{electionLink}</span>
              </div>

              {/* Sample message */}
              {unsentVoters[0] && (
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Sample message (first voter):</p>
                  <pre style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '1rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-1)',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                    margin: 0,
                  }}>
                    {getMsg(unsentVoters[0])}
                  </pre>
                </div>
              )}

              {/* Voter list preview */}
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Recipients ({unsentVoters.length}):</p>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {unsentVoters.map(v => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--surface-2)', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{v.name}</span>
                        <span style={{ color: 'var(--text-3)', marginLeft: 8 }}>{v.phone || 'No phone'}</span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ gap: 4, fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: copiedId === v.id ? '#16a34a' : 'var(--secondary)' }}
                        onClick={() => copyMsg(v)}
                      >
                        {copiedId === v.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        {copiedId === v.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.55 }}>
                Clicking <strong>Confirm</strong> marks all pending voters as notified in the system. Copy individual messages above or download all to send via SMS, WhatsApp, or email.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={downloadAllMessages} style={{ gap: 6 }}>
                <FileDown size={15} /> Download All Messages
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button className="btn btn-outline" onClick={() => setShowOtpPreview(false)} disabled={sending}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmSendOtps} disabled={sending}>
                  {sending ? <><Loader2 size={14} className="anim-spin" /> Marking sent…</> : <><Send size={14} /> Confirm Sent</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Voter Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="icon-box icon-box-md ib-orange-filled"><UserPlus size={18} /></div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-1)' }}>Add Voter</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>Register a new voter manually</p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Full Name *</label>
                  <input className="input" placeholder="e.g. Kwame Mensah" value={newVoter.name} onChange={e => setNewVoter({ ...newVoter, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>ID / Index *</label>
                  <input className="input" placeholder="UCC/2024/001" value={newVoter.identifier} onChange={e => setNewVoter({ ...newVoter, identifier: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Class</label>
                  <input className="input" placeholder="e.g. Level 300" value={newVoter.class} onChange={e => setNewVoter({ ...newVoter, class: e.target.value })} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Phone Number *</label>
                  <input className="input" type="tel" placeholder="e.g. 0241234567 or +233241234567" value={newVoter.phone} onChange={e => setNewVoter({ ...newVoter, phone: e.target.value })} required />
                  {newVoter.phone && normalizePhone(newVoter.phone) !== newVoter.phone.replace(/[\s\-().]/g, '') && (
                    <p style={{ marginTop: 5, fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700 }}>Will be saved as:</span> {normalizePhone(newVoter.phone)}
                    </p>
                  )}
                  <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-3)' }}>Local numbers (e.g. 024…) are auto-converted to international format.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full"><UserPlus size={15} /> Add Voter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterManagement;
