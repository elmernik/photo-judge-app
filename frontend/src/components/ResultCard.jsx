import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Trash2, GitCommitVertical } from 'lucide-react';

// Animation variants for the card itself
const gridItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const ResultCard = React.forwardRef(({ result, API_BASE_URL, onDelete }, ref) => {
    const getScoreColor = (score) => {
        if (score >= 8) return 'from-emerald-500 to-teal-500';
        if (score >= 6) return 'from-blue-500 to-sky-500';
        if (score >= 4) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-pink-500';
    };

    const details = result.judgement_details || result;
    const filename = result.original_filename || details.filename;
    const imageUrl = result.stored_filename ? `${API_BASE_URL}/images/${result.stored_filename}` : null;
    
    const finalScore = details.overall_reasoning_score ?? details.overall_score;
    const originalScore = details.overall_score;
    const scoresDiffer = details.overall_reasoning_score !== null && finalScore !== originalScore;

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
            if (onDelete) onDelete(result.id);
        } catch (error) {
            console.error('Error deleting judgement:', error);
            alert(`Could not delete judgement: ${error.message}`);
        }
    };

    return (
        <motion.div
            ref={ref}
            variants={gridItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
        >
            {imageUrl && <img src={imageUrl} alt={filename} className="w-full h-56 object-cover" onError={(e) => e.target.style.display = 'none'} />}
            
            <div className="p-5 flex-grow flex flex-col">
                {/* Overall Score Block */}
                <div className={`relative mb-6 p-5 rounded-xl bg-gradient-to-br ${getScoreColor(finalScore)} shadow-lg text-white`}>
                    <div className="relative z-10">
                        <p className="text-sm font-medium opacity-80">Final Score</p>
                        <div className="text-4xl font-bold tracking-tight">{finalScore}<span className="text-xl font-normal opacity-70">/10</span></div>

                        {scoresDiffer && (
                            <div className="mt-2 pt-2 border-t border-white/20 text-xs font-medium opacity-80 flex items-center gap-1.5">
                                <GitCommitVertical className="w-3 h-3" />
                                <span>Adjusted from calculated score of {originalScore}/10</span>
                            </div>
                        )}
                        
                        <p className={`text-white/90 font-medium truncate text-sm ${scoresDiffer ? 'mt-2' : 'mt-1'}`} title={filename}>
                            {filename}
                        </p>
                    </div>
                </div>

                {/* Overall Reasoning Section */}
                {details.overall_reasoning && (
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-800 mb-2">Overall Reasoning</h3>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm shadow-inner">
                            {details.overall_reasoning}
                        </p>
                    </div>
                )}

                {/* Collapsible Detailed Analysis */}
                <details className="group flex-grow">
                    <summary className="flex items-center justify-between cursor-pointer list-none p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <h3 className="text-base font-semibold text-gray-800">Detailed Analysis</h3>
                        <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    
                    <div className="space-y-3 mt-4">
                        {details.scores && Object.entries(details.scores).map(([key, score]) => (
                            <div key={key} className="p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="font-semibold text-gray-700 capitalize text-sm">{key.replace(/_/g, ' ')}</h4>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getScoreColor(score)}`}>{score}/10</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{details.rationales[key]}</p>
                            </div>
                        ))}
                    </div>
                </details>
            </div>
            
            {/* Delete Button */}
            {onDelete && (
                <div className="p-4 pt-0">
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-500/10 rounded-xl hover:bg-red-500/20 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 transition-colors duration-200"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Judgement
                    </button>
                </div>
            )}
        </motion.div>
    );
});

export default ResultCard;