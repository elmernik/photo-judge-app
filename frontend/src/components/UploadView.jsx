import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultCard from './ResultCard';

// ActionButton component matching the modal buttons
const ActionButton = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Animation variants for the container of the grid
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    setFiles(newFiles);
    setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    setResults([]);
    setError(null);
    setJudgementPerformed(false);
  };

  const handleUpload = async () => {
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
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setError(null);
    setJudgementPerformed(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {!judgementPerformed ? (
          <motion.div key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ActionButton 
                    variant="primary" 
                    onClick={handleUpload} 
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-3"
                  >
                    <Sparkles className="w-5 h-5"/>
                    {loading ? 'Analyzing...' : `Judge ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                  </ActionButton>
                  <ActionButton 
                    variant="secondary" 
                    onClick={() => { setFiles([]); setPreviews([]); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Selection
                  </ActionButton>
                </div>
              )}
            </div>

            {previews.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Selected Photos</h2>
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 gap-6"
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {previews.map((p, i) => (
                    <motion.img
                      key={p}
                      src={p}
                      alt={`Preview ${i}`}
                      className="w-full h-48 object-cover rounded-xl shadow-md"
                      variants={gridItemVariants}
                      layout
                    />
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Results section with better button placement */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  className="mt-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Results</h2>
                    <ActionButton 
                      variant="primary" 
                      onClick={handleNewJudgement}
                      className="flex items-center justify-center gap-3 px-6 py-3"
                    >
                      <Upload className="w-5 h-5"/>
                      Perform New Judgement
                    </ActionButton>
                  </div>
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
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}
    </div>
  );
};

export default UploadView;