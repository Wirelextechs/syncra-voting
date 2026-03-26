import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, User, LayoutGrid, X, Upload, Loader2, ImageIcon } from 'lucide-react';
import type { Category, Candidate } from '../types';

const ICON_CLASSES = ['ib-violet-filled', 'ib-orange-filled', 'ib-pink-filled', 'ib-green-filled', 'ib-sky'];

/* ─── Upload candidate photo to Supabase Storage ─────────── */
const uploadPhoto = async (file: File, candidateId: string): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const path = `candidates/${candidateId}.${ext}`;
  const { error } = await supabase.storage.from('candidate-photos').upload(path, file, { upsert: true });
  if (error) { console.error('Upload error:', error); return null; }
  const { data } = supabase.storage.from('candidate-photos').getPublicUrl(path);
  return data.publicUrl;
};


/* ─────────────────────────────────────────── Main ────────── */
const CategoryManagement: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [catName, setCatName] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [deletingCand, setDeletingCand] = useState<string | null>(null);

  useEffect(() => { if (electionId) fetchAll(); }, [electionId]);

  const fetchAll = async () => {
    const { data: cats } = await supabase.from('categories').select('*').eq('election_id', electionId);
    if (cats) {
      setCategories(cats);
      for (const c of cats) {
        const { data: cands } = await supabase.from('candidates').select('*').eq('category_id', c.id);
        if (cands) setCandidates(p => ({ ...p, [c.id]: cands }));
      }
    }
    setLoading(false);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('categories').insert([{ name: catName, election_id: electionId }]).select().single();
    if (data) { setCategories(p => [...p, data]); setCandidates(p => ({ ...p, [data.id]: [] })); setCatName(''); setShowAdd(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this position and all its candidates? This cannot be undone.')) return;
    setDeletingCat(id);
    // Delete candidates first
    await supabase.from('candidates').delete().eq('category_id', id);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(p => p.filter(c => c.id !== id));
      setCandidates(p => { const n = { ...p }; delete n[id]; return n; });
    }
    setDeletingCat(null);
  };

  const addCandidate = async (catId: string, name: string, file: File | null, photoUrl?: string) => {
    // Insert candidate first to get ID, then upload photo
    const { data } = await supabase.from('candidates').insert([{ name, category_id: catId, photo_url: photoUrl || null }]).select().single();
    if (!data) return;

    let finalPhotoUrl = photoUrl || null;
    if (file) {
      const uploaded = await uploadPhoto(file, data.id);
      if (uploaded) {
        finalPhotoUrl = uploaded;
        await supabase.from('candidates').update({ photo_url: finalPhotoUrl }).eq('id', data.id);
      }
    }
    setCandidates(p => ({ ...p, [catId]: [...(p[catId] || []), { ...data, photo_url: finalPhotoUrl }] }));
  };

  const deleteCandidate = async (catId: string, candId: string) => {
    if (!window.confirm('Remove this candidate?')) return;
    setDeletingCand(candId);
    const { error } = await supabase.from('candidates').delete().eq('id', candId);
    if (!error) setCandidates(p => ({ ...p, [catId]: (p[catId] || []).filter(c => c.id !== candId) }));
    setDeletingCand(null);
  };

  const totalCandidates = Object.values(candidates).flat().length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-1)' }}>Ballot Positions</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginTop: 2 }}>{categories.length} positions · {totalCandidates} candidates</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Position
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {categories.map((cat, idx) => (
          <div key={cat.id} className="card anim-fade-in-up" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Card header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)' }}>
              <div className={`icon-box icon-box-sm ${ICON_CLASSES[idx % ICON_CLASSES.length]}`}>
                <LayoutGrid size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{(candidates[cat.id] || []).length} candidate{(candidates[cat.id] || []).length !== 1 ? 's' : ''}</p>
              </div>
              <button
                className="btn btn-icon btn-danger-ghost btn-sm"
                title="Delete position"
                disabled={deletingCat === cat.id}
                onClick={() => deleteCategory(cat.id)}
              >
                {deletingCat === cat.id ? <Loader2 size={13} className="anim-spin" /> : <Trash2 size={13} />}
              </button>
            </div>

            {/* Candidate list */}
            <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {(candidates[cat.id] || []).map(cand => (
                <div key={cand.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                >
                  {cand.photo_url ? (
                    <img src={cand.photo_url} alt={cand.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={16} style={{ color: 'var(--text-3)' }} />
                    </div>
                  )}
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cand.name}</span>
                  <button
                    className="btn btn-icon btn-danger-ghost btn-sm"
                    disabled={deletingCand === cand.id}
                    onClick={() => deleteCandidate(cat.id, cand.id)}
                    title="Remove candidate"
                  >
                    {deletingCand === cand.id ? <Loader2 size={12} className="anim-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              ))}

              <AddCandidateInline onAdd={(n, f) => addCandidate(cat.id, n, f)} />
            </div>
          </div>
        ))}

        {categories.length === 0 && !loading && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
            <div className="icon-box icon-box-xl ib-violet" style={{ margin: '0 auto 1rem', borderRadius: 20 }}><LayoutGrid size={28} /></div>
            <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: 8 }}>No positions yet</h3>
            <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>Add ballot positions like "President" or "Secretary".</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add First Position</button>
          </div>
        )}
      </div>

      {/* Add Position Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="icon-box icon-box-md ib-violet-filled"><LayoutGrid size={18} /></div>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-1)' }}>New Position</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>Add a ballot position</p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowAdd(false)}><X size={18} /></button>
            </div>
            <form onSubmit={addCategory}>
              <div className="modal-body">
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Position Name *</label>
                <input className="input" placeholder="e.g. General Secretary" value={catName} onChange={e => setCatName(e.target.value)} required autoFocus />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full"><Plus size={15} /> Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Inline Candidate Add Form ─────────────────────────────── */
const AddCandidateInline = ({ onAdd }: { onAdd: (name: string, file: File | null) => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleAdd = async () => {
    if (!name) return;
    setUploading(true);
    await onAdd(name, file);
    setOpen(false);
    setName('');
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploading(false);
  };

  if (!open) return (
    <button
      className="btn btn-ghost btn-sm btn-full"
      style={{ border: '1px dashed var(--border)', color: 'var(--text-3)', justifyContent: 'center', marginTop: 4 }}
      onClick={() => setOpen(true)}
    >
      <Plus size={14} /> Add Candidate
    </button>
  );

  return (
    <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.875rem', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', marginTop: 4 }}>
      <input className="input" style={{ fontSize: '0.875rem' }} placeholder="Candidate full name *" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ImageIcon size={12} /> Photo (optional)
        </label>
        <PhotoPicker onFile={handleFile} preview={preview} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1 }}
          disabled={!name || uploading}
          onClick={handleAdd}
        >
          {uploading ? <><Loader2 size={13} className="anim-spin" /> Saving…</> : <><Plus size={13} /> Add</>}
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => { setOpen(false); setName(''); setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ── Photo Picker ─────────────────────────────────────────── */
const PhotoPicker: React.FC<{ onFile: (file: File) => void; preview: string | null }> = ({ onFile, preview }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) onFile(f); }}
      onClick={() => inputRef.current?.click()}
      style={{
        height: 90, borderRadius: 10,
        border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
        background: dragging ? 'rgba(249,115,22,0.04)' : 'var(--surface)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s', overflow: 'hidden', position: 'relative',
      }}
    >
      {preview ? (
        <>
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <p style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>Click to change</p>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <Upload size={16} style={{ color: dragging ? 'var(--primary)' : 'var(--text-3)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
            {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
          </span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
};

export default CategoryManagement;
