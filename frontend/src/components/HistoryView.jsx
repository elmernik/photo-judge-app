import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Loader2 } from 'lucide-react'; // Added Loader2 for a better loading state
import ResultCard from './ResultCard';

const HistoryView = ({ selectedCompetition, API_BASE_URL }) => {
  // Renamed 'history' to 'judgements' for clarity, but this is optional.
  const [judgements, setJudgements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedCompetition) {
        setLoading(false); // Set loading to false if no competition is selected
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/competitions/${selectedCompetition.id}/judgements`);
        if (!res.ok) throw new Error('Failed to fetch history for this competition.');
        const data = await res.json();
        // Sort by most recent first for a better user experience
        setJudgements(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedCompetition, API_BASE_URL]);

  // --- NEW: This is the function that will handle removing the card from the view ---
  const handleDeletion = (deletedId) => {
    setJudgements(currentJudgements =>
      currentJudgements.filter(judgement => judgement.id !== deletedId)
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
        Judgement History for {selectedCompetition?.name}
      </h2>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      )}

      {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}

      {!loading && !error && judgements.length === 0 && (
        <div className="text-center py-20 bg-white/60 rounded-3xl shadow-sm">
          <HistoryIcon className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
          <h2 className="text-2xl font-bold text-gray-700">No History Found</h2>
          <p className="text-gray-500 mt-2">There are no past judgements for this competition yet.</p>
        </div>
      )}
      
      {!loading && judgements.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {judgements.map((j) => (
            <ResultCard
              key={j.id}
              result={j}
              API_BASE_URL={API_BASE_URL}
              onDelete={handleDeletion} // <-- UPDATED: Pass the handler function as a prop
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;