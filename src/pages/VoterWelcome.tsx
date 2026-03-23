import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Election } from '../types';
import { Vote, ArrowRight, ShieldCheck, Globe } from 'lucide-react';

const VoterWelcome: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchElection();
  }, [id]);

  const fetchElection = async () => {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) setElection(data);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-white">Connecting to Syncra...</div>;

  if (!election) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card text-white">
        <h1 className="text-2xl font-bold mb-4">Election Not Found</h1>
        <p className="text-[#94a3b8] mb-8">The link you followed may be invalid or the election has been removed.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Go Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 animate-fade-in text-white">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] text-xs font-bold uppercase tracking-widest mb-6">
          <ShieldCheck className="w-4 h-4" />
          Secure Voting Portal
        </div>
        <h1 className="text-5xl font-bold mb-4 text-gradient">{election.institution}</h1>
        <p className="text-2xl text-[#94a3b8] font-medium">{election.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="glass-card flex flex-col items-center text-center p-8">
          <Globe className="w-10 h-10 text-[#6366f1] mb-4" />
          <h3 className="text-lg font-bold mb-2">Access Anywhere</h3>
          <p className="text-sm text-[#94a3b8]">Cast your vote securely from any device with internet access.</p>
        </div>
        <div className="glass-card flex flex-col items-center text-center p-8">
          <ShieldCheck className="w-10 h-10 text-[#6366f1] mb-4" />
          <h3 className="text-lg font-bold mb-2">Identity Verified</h3>
          <p className="text-sm text-[#94a3b8]">Unique OTP-based verification ensure 100% integrity.</p>
        </div>
      </div>

      <div className="glass-card p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-50" />
        <p className="text-[#94a3b8] mb-8 text-lg font-medium">Ready to participate in this election?</p>
        <button 
          onClick={() => navigate('/voter/login')}
          className="btn-primary px-12 py-4 text-lg flex items-center gap-3 mx-auto"
        >
          Start Voting
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
      
      <p className="text-center mt-12 text-xs text-[#94a3b8] uppercase tracking-tighter opacity-50">
        Powered by Syncra Transparent Voting Technology
      </p>
    </div>
  );
};

export default VoterWelcome;
