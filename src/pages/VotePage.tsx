import { CheckCircle2, ArrowRight, ArrowLeft, Send, ShieldCheck, Loader2 } from 'lucide-react';
import type { Category, Candidate, Voter } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const VotePage: React.FC = () => {
  const [voter, setVoter] = useState<Voter | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const sessionVoter = localStorage.getItem('syncra_voter');
    if (!sessionVoter) {
      navigate('/voter/login');
      return;
    }
    const voterData = JSON.parse(sessionVoter);
    setVoter(voterData);
    fetchData(voterData.election_id);
  };

  const fetchData = async (electionId: string) => {
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('election_id', electionId);
      
      if (catData) {
        setCategories(catData);
        const candidatesMap: Record<string, Candidate[]> = {};
        for (const cat of catData) {
          const { data: candData } = await supabase
            .from('candidates')
            .select('*')
            .eq('category_id', cat.id);
          if (candData) candidatesMap[cat.id] = candData;
        }
        setCandidates(candidatesMap);
      }
    } catch (err) {
      console.error('Error fetching vote data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (categoryId: string, candidateId: string) => {
    setSelections({ ...selections, [categoryId]: candidateId });
  };

  const handleSubmit = async () => {
    if (!voter) return;
    setSubmitting(true);
    try {
      const votesToInsert = categories.map(cat => ({
        voter_id: voter.id,
        category_id: cat.id,
        candidate_id: selections[cat.id]
      }));

      // Insert all votes
      const { error: voteError } = await supabase.from('votes').insert(votesToInsert);
      
      if (!voteError) {
        // Increment candidate vote counts
        for (const vote of votesToInsert) {
          await supabase.rpc('increment_candidate_votes', { candidate_uuid: vote.candidate_id });
        }
        
        // Mark voter as having voted
        await supabase.from('voters').update({ voted: true }).eq('id', voter.id);
        
        setCompleted(true);
        localStorage.removeItem('syncra_voter');
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-white">Loading Ballot...</div>;

  if (completed) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center glass-card p-12 animate-fade-in">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-white">Vote Submitted!</h1>
        <p className="text-[#94a3b8] mb-8 font-medium">Thank you for participating in the electoral process. Your vote has been securely recorded.</p>
        <button onClick={() => navigate('/')} className="btn-primary w-full">Back to Home</button>
      </div>
    );
  }

  const currentCategory = categories[currentIndex];
  const currentCandidates = candidates[currentCategory?.id] || [];
  const progress = ((currentIndex + 1) / categories.length) * 100;

  return (
    <div className="max-w-4xl mx-auto mt-12 mb-20 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{currentCategory?.name}</h1>
          <p className="text-sm text-[#94a3b8] font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6366f1]" />
            Step {currentIndex + 1} of {categories.length}
          </p>
        </div>
        <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#6366f1] to-[#ec4899]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {currentCandidates.map(candidate => (
            <div 
              key={candidate.id}
              onClick={() => handleSelect(currentCategory.id, candidate.id)}
              className={`glass-card p-4 text-center cursor-pointer border-2 transition-all group ${
                selections[currentCategory.id] === candidate.id 
                ? 'border-[#6366f1] bg-[#6366f1]/10' 
                : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-white/5 border border-white/10 group-hover:scale-[1.02] transition-transform">
                {candidate.photo_url ? (
                  <img src={candidate.photo_url} alt={candidate.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#94a3b8]">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                {selections[currentCategory.id] === candidate.id && (
                  <div className="absolute top-3 right-3 p-1.5 bg-[#6366f1] rounded-full shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{candidate.name}</h3>
              <p className="text-xs text-[#94a3b8] uppercase font-bold tracking-widest group-hover:text-[#6366f1] transition-colors">
                {selections[currentCategory.id] === candidate.id ? 'Candidate Selected' : 'Choose Candidate'}
              </p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f172a]/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-4xl mx-auto flex justify-between gap-4">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-8 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all disabled:opacity-20 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Previous
          </button>
          
          {currentIndex === categories.length - 1 ? (
            <button 
              onClick={handleSubmit}
              disabled={!selections[currentCategory?.id] || submitting}
              className="btn-primary px-12 flex items-center gap-2 text-lg disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              Submit Final Ballot
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={!selections[currentCategory?.id]}
              className="btn-primary px-12 flex items-center gap-2 disabled:opacity-50"
            >
              Next Category <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotePage;
