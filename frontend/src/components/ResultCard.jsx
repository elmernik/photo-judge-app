import React from 'react';

const ResultCard = ({ result, API_BASE_URL }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-emerald-500 to-teal-500';
    if (score >= 6) return 'from-blue-500 to-cyan-500';
    if (score >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  // This logic remains the same, correctly accessing the nested details
  const details = result.judgement_details || result;
  const filename = result.original_filename || details.filename;
  const imageUrl = result.stored_filename ? `${API_BASE_URL}/images/${result.stored_filename}` : null;

  return (
    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
      {imageUrl && <img src={imageUrl} alt={filename} className="w-full h-56 object-cover" onError={(e) => e.target.style.display = 'none'} />}
      <div className="p-6">
        {/* Overall Score Block - No changes here */}
        <div className={`relative mb-6 p-6 rounded-2xl bg-gradient-to-br ${getScoreColor(details.overall_score)} shadow-lg text-white`}>
          <div className="relative z-10">
            <h3 className="text-lg font-bold">Overall Score</h3>
            <div className="text-4xl font-bold">{details.overall_score}<span className="text-xl font-normal opacity-80">/10</span></div>
            <p className="text-white/90 font-medium truncate mt-1" title={filename}>{filename}</p>
          </div>
        </div>

        {/* NEW: Overall Reasoning Section */}
        {details.overall_reasoning && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Overall Reasoning</h3>
            <p className="text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-xl border">
              {details.overall_reasoning}
            </p>
          </div>
        )}

        {/* UPDATED: Collapsible Detailed Analysis */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <h3 className="text-xl font-bold text-gray-800">Detailed Analysis</h3>
            <div className="transition-transform duration-200 group-open:rotate-180">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          
          <div className="space-y-4 mt-4">
            {details.scores && Object.entries(details.scores).map(([key, score]) => (
              <div key={key} className="p-4 bg-gray-50/50 rounded-xl border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-700 capitalize">{key.replace(/_/g, ' ')}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getScoreColor(score)}`}>{score}/10</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{details.rationales[key]}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default ResultCard;