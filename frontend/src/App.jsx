import React, { useState, useEffect } from 'react';
import { Upload, Camera, Star, ChevronRight, Sparkles, Award, History, X, Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

// A single result card component for reuse
const ResultCard = ({ result }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-emerald-500 to-teal-500';
    if (score >= 6) return 'from-blue-500 to-cyan-500';
    if (score >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreIcon = (score) => {
    if (score >= 8) return <Award className="w-5 h-5" />;
    if (score >= 6) return <Star className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  const details = result.judgement_details || result;
  const filename = result.original_filename || details.filename;
  const imageUrl = result.stored_filename ? `${API_BASE_URL}/images/${result.stored_filename}` : null;

  return (
    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
      {imageUrl && (
        <img src={imageUrl} alt={filename} className="w-full h-56 object-cover" />
      )}
      <div className="p-6">
        <div className={`relative mb-6 p-6 rounded-2xl bg-gradient-to-br ${getScoreColor(details.overall_score)} shadow-lg text-white overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">Overall Score</h3>
                    {getScoreIcon(details.overall_score)}
                </div>
                <div className="text-4xl font-bold">
                    {details.overall_score}
                    <span className="text-xl font-normal opacity-80">/10</span>
                </div>
                <p className="text-white/90 font-medium truncate mt-1" title={filename}>{filename}</p>
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Detailed Analysis</h3>
            {Object.entries(details.scores).map(([key, score]) => (
                <div key={key} className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/80">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-700 capitalize">
                            {key.replace(/_/g, ' ')}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getScoreColor(score)} text-white`}>
                            {score}/10
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {details.rationales[key]}
                    </p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [view, setView] = useState('upload'); // 'upload' or 'history'

  useEffect(() => {
    // Revoke object URLs on cleanup to prevent memory leaks
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleFileChange = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const newFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    setFiles(newFiles);
    setResults([]);
    setError(null);
    setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    setView('upload');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
      // The key 'files' must match the FastAPI endpoint parameter name
      formData.append('files', file, file.name);
    });

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`${API_BASE_URL}/judge-batch/`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      setResults(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    setView('history');
    try {
      const res = await fetch(`${API_BASE_URL}/judgements/?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch history.');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const clearSelection = () => {
    setFiles([]);
    setPreviews([]);
    setResults([]);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Nature Photography Judge
                </h1>
                <p className="text-gray-600 text-lg font-medium">Batch evaluation with persistent history</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setView('upload')}
                    className={`px-5 py-2.5 font-semibold rounded-xl transition-all ${view === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                >
                  Upload Photos
                </button>
                <button
                    onClick={fetchHistory}
                    className={`px-5 py-2.5 font-semibold rounded-xl transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                >
                  View History
                </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        {view === 'upload' && (
          <div className="max-w-6xl mx-auto">
            <div
              className={`relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border transition-all duration-300 hover:shadow-2xl ${
                dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200/50'
              }`}
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            >
              <div className="p-8">
                <label className={`group cursor-pointer block w-full p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                }`}>
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Drop your photos here</h3>
                    <p className="text-gray-600 mb-4">or click to browse files</p>
                    <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                      <Camera className="w-4 h-4" />
                      JPG, PNG, WebP supported (multiple files)
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} className="hidden" multiple />
                </label>
                
                <div className="flex flex-col items-center gap-4 mt-8">
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || loading}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                    >
                        <div className="flex items-center gap-3">
                        {loading ? (
                            <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Analyzing {files.length} {files.length > 1 ? 'photos' : 'photo'}...
                            </>
                        ) : (
                            <>
                            <Sparkles className="w-5 h-5" />
                            Judge {files.length > 0 ? files.length : ''} {files.length > 1 ? 'Photos' : 'Photo'}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </>
                        )}
                        </div>
                    </button>
                    {files.length > 0 && (
                        <button onClick={clearSelection} className="text-sm text-red-600 hover:underline">Clear Selection</button>
                    )}
                </div>

              </div>
            </div>

            {error && (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><span className="text-red-600 font-bold">!</span></div>
                  <div><h3 className="font-semibold text-red-800">Error occurred</h3><p className="text-red-600">{error}</p></div>
                </div>
              </div>
            )}
            
            {previews.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <ImageIcon className="w-7 h-7 text-blue-600" />
                  Selected Photos
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-48 object-cover rounded-2xl shadow-lg border border-gray-200/50" />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="text-white text-center font-semibold text-sm p-2 truncate">{files[index].name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <Award className="w-7 h-7 text-emerald-600" />
                    Judging Results
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {results.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {view === 'history' && (
           <div>
             <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <History className="w-7 h-7 text-purple-600" />
                Past Judgements
             </h2>
             {loading && <p>Loading history...</p>}
             {error && <p className="text-red-600">{error}</p>}
             {!loading && history.length === 0 && <p>No past judgements found.</p>}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {history.map((judgement) => (
                  <ResultCard key={judgement.id} result={judgement} />
                ))}
             </div>
           </div>
        )}

      </main>
    </div>
  );
}
