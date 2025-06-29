import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // <-- Import motion
import ResultCard from './ResultCard';

// We can reuse the same animation variants from UploadView
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07, // A bit faster for history
    },
  },
};

const gridItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
  exit: { // This is new: defines how items animate out
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};


const HistoryView = ({ selectedCompetition, API_BASE_URL }) => {
  const [judgements, setJudgements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ... (no changes to fetchHistory logic)
    const fetchHistory = async () => {
      if (!selectedCompetition) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/competitions/${selectedCompetition.id}/judgements`);
        if (!res.ok) throw new Error('Failed to fetch history for this competition.');
        const data = await res.json();
        setJudgements(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedCompetition, API_BASE_URL]);

  const handleDeletion = (deletedId) => {
    setJudgements(currentJudgements =>
      currentJudgements.filter(judgement => judgement.id !== deletedId)
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-slate-800 mb-8">
        Judgement History for {selectedCompetition?.name}
      </h2>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      )}

      {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}

      {!loading && !error && judgements.length === 0 && (
        // Applying our "Content Card" style to the empty state
        <div className="text-center py-20 bg-white/70 backdrop-blur-xl border border-slate-900/5 rounded-2xl shadow-sm">
          <HistoryIcon className="w-16 h-16 mx-auto text-slate-400 mb-4"/>
          <h2 className="text-2xl font-bold text-slate-700">No History Found</h2>
          <p className="text-slate-500 mt-2">There are no past judgements for this competition yet.</p>
        </div>
      )}
      
      {!loading && judgements.length > 0 && (
        <motion.div
          className="grid md:grid-cols-2 xl:grid-cols-3 gap-8"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* AnimatePresence will watch for items being removed from this list */}
          <AnimatePresence>
            {judgements.map((j) => (
              <ResultCard
                key={j.id}
                result={j}
                API_BASE_URL={API_BASE_URL}
                onDelete={handleDeletion}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default HistoryView;