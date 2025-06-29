import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // <-- Import motion
import ResultCard from './ResultCard';

// Animation variants for the container of the grid
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // This will make each child animate 0.1s after the previous one
    },
  },
};

// Animation variants for each individual grid item
const gridItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const UploadView = ({ selectedCompetition, criteria, API_BASE_URL }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [judgementPerformed, setJudgementPerformed] = useState(false);

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleFileChange = (selectedFiles) => {
    // ... (no changes in this function)
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    setFiles(newFiles);
    setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    setResults([]);
    setError(null);
    setJudgementPerformed(false);
  };

  const handleUpload = async () => {
    // ... (no changes in this function)
    if (files.length === 0 || !selectedCompetition) return;
    const activeCriteria = criteria.filter(c => c.enabled);
    if (activeCriteria.length === 0) {
        setError("Please enable at least one judging criterion via the manager.");
        return;
    }
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    formData.append('competition_id', selectedCompetition.id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/judge-batch/`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
      setResults(await res.json());
      setJudgementPerformed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewJudgement = () => {
    // ... (no changes in this function)
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setError(null);
    setJudgementPerformed(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait"> {/* Smoothly animates between the uploader and results */}
        {!judgementPerformed ? (
          <motion.div key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Using our new "Content Card" style */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-900/5 rounded-2xl shadow-sm">
              <div className="p-8">
                <label className="group cursor-pointer block p-8 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50/70 transition-colors" onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files) }} onDragOver={(e) => e.preventDefault()}>
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto text-indigo-500 mb-4 transition-transform group-hover:scale-110"/>
                    <h3 className="text-xl font-semibold text-slate-800">Drop photos here or click to browse</h3>
                    <p className="text-slate-500 mt-1">For competition: <span className="font-medium text-slate-700">{selectedCompetition.name}</span></p>
                  </div>
                  <input type="file" onChange={(e) => handleFileChange(e.target.files)} className="hidden" multiple accept="image/*" />
                </label>
              </div>
              {files.length > 0 && (
                <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Using our new "Primary Action Button" style */}
                  <button onClick={handleUpload} disabled={loading} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300">
                    <Sparkles className="w-5 h-5"/>
                    {loading ? 'Analyzing...' : `Judge ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                  </button>
                  <button onClick={() => { setFiles([]); setPreviews([]); }} className="text-sm text-red-600 hover:underline flex items-center gap-2"><Trash2 className="w-4 h-4" />Clear Selection</button>
                </div>
              )}
            </div>

            {previews.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Selected Photos</h2>
                {/* HERE IS THE ANIMATION MAGIC! */}
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 gap-6"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {previews.map((p, i) => (
                    <motion.img
                      key={p} // Use the preview URL as key for stability
                      src={p}
                      alt={`Preview ${i}`}
                      className="w-full h-48 object-cover rounded-xl shadow-md"
                      variants={gridItemVariants}
                      layout // This helps animate position changes if the list re-orders
                    />
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div className="text-center py-10">
                {/* Using our new "Primary Action Button" style */}
                <button onClick={handleNewJudgement} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300">
                  <Upload className="w-5 h-5"/>
                  Perform a New Judgement
                </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}

      {/* Results also get a nice animated container */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Results</h2>
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {results.map((r) => <ResultCard key={r.id} result={r} API_BASE_URL={API_BASE_URL}/>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadView;