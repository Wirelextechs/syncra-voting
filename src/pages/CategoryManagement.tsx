import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, PlusCircle, Trash2, 
  Image as ImageIcon, User, Save,
  LayoutGrid
} from 'lucide-react';
import type { Category, Candidate } from '../types';

const CategoryManagement: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (electionId) fetchCategories();
  }, [electionId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', electionId);
      
      if (data) {
        setCategories(data);
        data.forEach(cat => fetchCandidates(cat.id));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('category_id', categoryId);
      
      if (data) {
        setCandidates(prev => ({ ...prev, [categoryId]: data }));
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName, election_id: electionId }])
        .select()
        .single();
      
      if (data) {
        setCategories([...categories, data]);
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleAddCandidate = async (categoryId: string, name: string, photoUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([{ name, category_id: categoryId, photo_url: photoUrl }])
        .select()
        .single();
      
      if (data) {
        setCandidates(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), data]
        }));
      }
    } catch (err) {
      console.error('Error adding candidate:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Election Categories</h2>
        <button 
          onClick={() => setShowAddCategory(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(category => (
          <div key={category.id} className="glass-card !p-0 overflow-hidden group">
            <div className="p-6 bg-white/5 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3 text-white">
                <LayoutGrid className="w-5 h-5 text-[#6366f1]" />
                <h3 className="text-lg font-bold">{category.name}</h3>
              </div>
              <button className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {(candidates[category.id] || []).map(candidate => (
                  <div key={candidate.id} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                    <div className="flex items-center gap-3 text-white">
                      {candidate.photo_url ? (
                        <img src={candidate.photo_url} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                          <User className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{candidate.name}</span>
                    </div>
                    <button className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <AddCandidateForm onAdd={(name, photo) => handleAddCandidate(category.id, name, photo)} />
            </div>
          </div>
        ))}

        {categories.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center glass-card text-white">
            <LayoutGrid className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-20" />
            <p className="text-[#94a3b8]">No categories defined yet. Start by adding a position like "President".</p>
          </div>
        )}
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCategory(false)} />
          <div className="glass-card w-full max-w-sm relative z-110">
            <h3 className="text-xl font-bold mb-4 text-white">New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4 text-white">
              <input 
                type="text"
                placeholder="Category Name (e.g. Secretary)"
                className="input-glass"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddCategory(false)} className="flex-1 p-3 rounded-xl border border-white/10 text-white">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AddCandidateForm = ({ onAdd }: { onAdd: (name: string, photo: string) => void }) => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');

  if (!show) {
    return (
      <button 
        onClick={() => setShow(true)}
        className="w-full p-3 rounded-xl border border-dashed border-white/20 text-[#94a3b8] hover:border-[#6366f1]/50 hover:bg-[#6366f1]/5 transition-all text-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Candidate
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/20 space-y-3 animate-fade-in text-white">
      <input 
        type="text"
        placeholder="Full Recognized Name"
        className="input-glass text-sm"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input 
        type="text"
        placeholder="Photo URL (Direct link)"
        className="input-glass text-sm"
        value={photo}
        onChange={e => setPhoto(e.target.value)}
      />
      <div className="flex gap-2">
        <button 
          onClick={() => { if(name) { onAdd(name, photo); setShow(false); setName(''); setPhoto(''); } }}
          className="flex-1 btn-primary py-2 text-sm"
        >
          Add
        </button>
        <button onClick={() => setShow(false)} className="p-2 text-white/50 hover:text-white transition-colors text-sm">Cancel</button>
      </div>
    </div>
  );
};

export default CategoryManagement;
