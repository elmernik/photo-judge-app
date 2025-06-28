import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Trash2 } from 'lucide-react';
import ResultCard from './ResultCard';

const UploadView = ({ selectedCompetition, criteria, API_BASE_URL }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [judgementPerformed, setJudgementPerformed] = useState(false); // New state for UX improvement

  useEffect(() => {
    // Cleanup object URLs on unmount
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
      setJudgementPerformed(true); // UX IMPROVEMENT: Set to true on success
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
      {!judgementPerformed ? (
        <>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border">
            <div className="p-8">
              <label className="group cursor-pointer block p-8 border-2 border-dashed rounded-2xl hover:bg-gray-50 transition-colors" onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files) }} onDragOver={(e) => e.preventDefault()}>
                <div className="text-center">
                  <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4"/>
                  <h3 className="text-xl font-semibold">Drop photos here or click to browse</h3>
                  <p className="text-gray-500 mt-1">For competition: <span className="font-bold">{selectedCompetition.name}</span></p>
                </div>
                <input type="file" onChange={(e) => handleFileChange(e.target.files)} className="hidden" multiple accept="image/*" />
              </label>
            </div>
            {files.length > 0 && (
              <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                <button onClick={handleUpload} disabled={loading} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-3">
                  <Sparkles className="w-5 h-5"/>
                  {loading ? 'Analyzing...' : `Judge ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                </button>
                <button onClick={handleNewJudgement} className="text-sm text-red-600 hover:underline flex items-center gap-2"><Trash2 className="w-4 h-4" />Clear Selection</button>
              </div>
            )}
          </div>

          {previews.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Selected Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {previews.map((p, i) => <img key={i} src={p} alt={`Preview ${i}`} className="w-full h-48 object-cover rounded-xl shadow-md"/>)}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <button onClick={handleNewJudgement} className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transition-shadow">
            <Upload className="w-5 h-5"/>
            Perform a New Judgement
          </button>
        </div>
      )}

      {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}

      {results.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Results</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((r) => <ResultCard key={r.id} result={r} API_BASE_URL={API_BASE_URL}/>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadView;