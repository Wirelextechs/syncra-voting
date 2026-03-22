import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, UserPlus, Upload, Trash2, 
  Search, Filter, CheckCircle2, XCircle,
  Download, Send, Loader2
} from 'lucide-react';
import { Voter } from '../types';

const VoterManagement: React.FC<{ electionId: string }> = ({ electionId }) => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVoter, setNewVoter] = useState({
    name: '',
    identifier: '',
    phone: '',
    class: ''
  });

  useEffect(() => {
    if (electionId) {
      fetchVoters();
    }
  }, [electionId]);

  const fetchVoters = async () => {
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('election_id', electionId)
        .order('name');
      
      if (data) setVoters(data);
    } catch (err) {
      console.error('Error fetching voters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const { data, error } = await supabase
        .from('voters')
        .insert([{ 
          ...newVoter, 
          election_id: electionId, 
          otp,
          otp_sent: false 
        }])
        .select()
        .single();
      
      if (data) {
        setVoters([...voters, data]);
        setNewVoter({ name: '', identifier: '', phone: '', class: '' });
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Error adding voter:', err);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newVoters = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const voter: any = { election_id: electionId, otp: Math.floor(100000 + Math.random() * 900000).toString(), otp_sent: false };
        
        headers.forEach((header, index) => {
          if (header.includes('name')) voter.name = values[index];
          if (header.includes('id') || header.includes('index') || header.includes('staff')) voter.identifier = values[index];
          if (header.includes('phone')) voter.phone = values[index];
          if (header.includes('class')) voter.class = values[index];
        });
        
        return voter;
      }).filter(v => v.name && v.identifier);

      if (newVoters.length > 0) {
        const { data, error } = await supabase.from('voters').insert(newVoters).select();
        if (data) setVoters([...voters, ...data]);
      }
    };
    reader.readAsText(file);
  };

  const sendAllOtps = async () => {
    setLoading(true);
    // In a real system, you'd call an SMS API here.
    // For this implementation, we mark them as sent and logs them.
    const pendingVoters = voters.filter(v => !v.otp_sent);
    console.log('Sending OTPs to:', pendingVoters.map(v => `${v.name}: ${v.otp}`));
    
    const { error } = await supabase
      .from('voters')
      .update({ otp_sent: true })
      .eq('election_id', electionId)
      .eq('otp_sent', false);
    
    if (!error) {
      setVoters(voters.map(v => ({ ...v, otp_sent: true })));
    }
    setLoading(false);
  };

  const filteredVoters = voters.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            className="input-glass pl-12"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Voter
          </button>
          <label className="p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-white cursor-pointer">
            <Upload className="w-5 h-5" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          <button 
            onClick={sendAllOtps}
            disabled={voters.filter(v => !v.otp_sent).length === 0 || loading}
            className="p-3 rounded-xl bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#6366f1] hover:bg-[#6366f1]/30 transition-all flex items-center justify-center gap-2 font-bold disabled:opacity-30"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Send OTPs
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 font-semibold text-white">Voter Details</th>
                <th className="p-4 font-semibold text-white">ID / Index</th>
                <th className="p-4 font-semibold text-white">Class</th>
                <th className="p-4 font-semibold text-white">OTP Status</th>
                <th className="p-4 font-semibold text-white">Voted</th>
                <th className="p-4 font-semibold text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {filteredVoters.map(voter => (
                <tr key={voter.id} className="hover:bg-white/2 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{voter.name}</span>
                      <span className="text-xs text-[#94a3b8]">{voter.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm">{voter.identifier}</td>
                  <td className="p-4 text-sm">{voter.class || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      voter.otp_sent ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {voter.otp_sent ? 'Sent' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    {voter.voted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#94a3b8]" />
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVoters.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#94a3b8]">
                    No voters found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="glass-card w-full max-w-md relative z-110">
            <h2 className="text-2xl font-bold mb-6 text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Add New Voter</h2>
            <form onSubmit={handleAddVoter} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1 text-white">Full Name</label>
                  <input 
                    type="text" 
                    className="input-glass"
                    value={newVoter.name}
                    onChange={e => setNewVoter({...newVoter, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1 text-white">Identifier (ID/Index)</label>
                  <input 
                    type="text" 
                    className="input-glass"
                    value={newVoter.identifier}
                    onChange={e => setNewVoter({...newVoter, identifier: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1 text-white">Class (Optional)</label>
                  <input 
                    type="text" 
                    className="input-glass"
                    value={newVoter.class}
                    onChange={e => setNewVoter({...newVoter, class: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5 ml-1 text-white">Phone Number</label>
                  <input 
                    type="tel" 
                    className="input-glass"
                    placeholder="+233..."
                    value={newVoter.phone}
                    onChange={e => setNewVoter({...newVoter, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Add Voter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterManagement;
