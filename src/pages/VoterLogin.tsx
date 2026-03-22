import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, KeyRound, ArrowRight, Loader2 } from 'lucide-react';
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
        .from('voters')
        .select('*')
        .eq('identifier', identifier)
        .eq('otp', otp)
        .single();

      if (fetchError || !data) {
        throw new Error('Invalid ID or OTP. Please check your credentials.');
      }

      if (data.voted) {
        throw new Error('You have already cast your vote for this election.');
      }

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
    <div className="max-w-md mx-auto mt-20 animate-fade-in">
      <div className="glass-card text-center">
        <h1 className="text-4xl font-bold mb-2 text-white">Voter Access</h1>
        <p className="text-[#94a3b8] mb-8">Enter your index number or staff ID and the OTP sent to your phone.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] w-5 h-5" />
            <input
              type="text"
              placeholder="Index Number / Staff ID"
              className="input-glass pl-12"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] w-5 h-5" />
            <input
              type="text"
              placeholder="Enter OTP"
              className="input-glass pl-12"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Verify & Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VoterLogin;
