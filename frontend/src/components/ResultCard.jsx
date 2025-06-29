import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Trash2 } from 'lucide-react'; // <-- Import lucide icons

// Animation variants for the card itself, passed from the parent
const gridItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

// 1. Wrap the entire component in React.forwardRef
const ResultCard = React.forwardRef(({ result, API_BASE_URL, onDelete }, ref) => {
  const getScoreColor = (score) => {
    // These gradient colors are great, let's keep them.
    if (score >= 8) return 'from-emerald-500 to-teal-500';
    if (score >= 6) return 'from-blue-500 to-cyan-500';
    if (score >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const details = result.judgement_details || result;
  const filename = result.original_filename || details.filename;
  const imageUrl = result.stored_filename ? `${API_BASE_URL}/images/${result.stored_filename}` : null;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the judgement for "${filename}"?`)) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/judgements/${result.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete judgement.');
      }
      // This callback now triggers the "exit" animation in the parent
      if (onDelete) onDelete(result.id);
    } catch (error) {
      console.error('Error deleting judgement:', error);
      alert(`Could not delete judgement: ${error.message}`);
    }
  };

  // 2. Change the root div to motion.div and pass the ref and variants
  return (
    <motion.div
      ref={ref}
      variants={gridItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout // This animates the card's position if the layout changes
      // 3. Apply our new "Content Card" styling
      className="bg-white/70 backdrop-blur-xl border border-slate-900/5 rounded-2xl shadow-sm overflow-hidden flex flex-col"
    >
      {imageUrl && <img src={imageUrl} alt={filename} className="w-full h-56 object-cover" onError={(e) => e.target.style.display = 'none'} />}
      
      <div className="p-6 flex-grow flex flex-col">
        {/* Overall Score Block - refined shadows */}
        <div className={`relative mb-6 p-5 rounded-xl bg-gradient-to-br ${getScoreColor(details.overall_score)} shadow-lg text-white`}>
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80">Overall Score</p>
            <div className="text-4xl font-bold tracking-tight">{details.overall_score}<span className="text-xl font-normal opacity-70">/10</span></div>
            <p className="text-white/90 font-medium truncate mt-1 text-sm" title={filename}>{filename}</p>
          </div>
        </div>

        {/* Overall Reasoning Section - refined styles */}
        {details.overall_reasoning && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Overall Reasoning</h3>
            <p className="text-slate-700 leading-relaxed bg-slate-100/70 p-4 rounded-lg border border-slate-200/80 text-sm">
              {details.overall_reasoning}
            </p>
          </div>
        )}

        {/* Collapsible Detailed Analysis - refined styles */}
        <details className="group flex-grow">
          <summary className="flex items-center justify-between cursor-pointer list-none p-2 -m-2 rounded-lg hover:bg-slate-100/70">
            <h3 className="text-base font-semibold text-slate-800">Detailed Analysis</h3>
            <ChevronDown className="w-5 h-5 text-slate-500 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          
          <div className="space-y-3 mt-4">
            {details.scores && Object.entries(details.scores).map(([key, score]) => (
              <div key={key} className="p-3 bg-slate-100/70 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-semibold text-slate-700 capitalize text-sm">{key.replace(/_/g, ' ')}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getScoreColor(score)}`}>{score}/10</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{details.rationales[key]}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
      
      {/* Delete Button - refined style */}
      <div className="p-4 pt-0">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-500/10 rounded-lg hover:bg-red-500/20 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition-colors duration-200"
        >
          <Trash2 className="w-4 h-4" />
          Delete Judgement
        </button>
      </div>
    </motion.div>
  );
});

export default ResultCard;