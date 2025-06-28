import React, { useState, useEffect } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import ResultCard from './ResultCard';

const HistoryView = ({ selectedCompetition, API_BASE_URL }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedCompetition) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/competitions/${selectedCompetition.id}/judgements`);
        if (!res.ok) throw new Error('Failed to fetch history for this competition.');
        const data = await res.json();
        setHistory(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [selectedCompetition, API_BASE_URL]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Past Judgements for {selectedCompetition.name}</h2>
      {loading && <div className="text-center py-10"><p>Loading History...</p></div>}
      {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}
      {!loading && !error && history.length === 0 && (
        <div className="text-center py-20 bg-white/50 rounded-3xl">
          <HistoryIcon className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
          <h2 className="text-2xl font-bold text-gray-700">No History Found</h2>
          <p className="text-gray-500 mt-2">There are no past judgements for this competition yet.</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {history.map((j) => <ResultCard key={j.id} result={j} API_BASE_URL={API_BASE_URL}/>)}
      </div>
    </div>
  );
};

export default HistoryView;