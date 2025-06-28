import React, { useState, useEffect } from 'react';
import { Upload, Camera, Star, ChevronRight, Sparkles, Award, History, X, Image as ImageIcon, Settings, Plus, Edit, Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

// --- Reusable Components ---

const ResultCard = ({ result }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-emerald-500 to-teal-500';
    if (score >= 6) return 'from-blue-500 to-cyan-500';
    if (score >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };
  const details = result.judgement_details || result;
  const filename = result.original_filename || details.filename;
  const imageUrl = result.stored_filename ? `${API_BASE_URL}/images/${result.stored_filename}` : null;
  return (
    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
      {imageUrl && <img src={imageUrl} alt={filename} className="w-full h-56 object-cover" onError={(e) => e.target.style.display = 'none'} />}
      <div className="p-6">
        <div className={`relative mb-6 p-6 rounded-2xl bg-gradient-to-br ${getScoreColor(details.overall_score)} shadow-lg text-white`}>
          <div className="relative z-10">
            <h3 className="text-lg font-bold">Overall Score</h3>
            <div className="text-4xl font-bold">{details.overall_score}<span className="text-xl font-normal opacity-80">/10</span></div>
            <p className="text-white/90 font-medium truncate mt-1" title={filename}>{filename}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Detailed Analysis</h3>
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
      </div>
    </div>
  );
};

const CriteriaManager = ({ criteria, setCriteria, closeModal }) => {
    const [editingCriterion, setEditingCriterion] = useState(null);
    const [error, setError] = useState(null);

    const api = {
        update: (id, data) => fetch(`${API_BASE_URL}/criteria/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        create: (data) => fetch(`${API_BASE_URL}/criteria/`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        delete: (id) => fetch(`${API_BASE_URL}/criteria/${id}`, { method: 'DELETE' }),
    };

    const handleToggle = async (criterionToToggle) => {
        try {
            const res = await api.update(criterionToToggle.id, { enabled: !criterionToToggle.enabled });
            if (!res.ok) throw new Error("Failed to toggle criterion.");
            const updatedCriterion = await res.json();
            setCriteria(criteria.map(c => c.id === updatedCriterion.id ? updatedCriterion : c));
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await api.delete(id);
            if (!res.ok) throw new Error("Failed to delete criterion.");
            setCriteria(criteria.filter(c => c.id !== id));
        } catch(e) {
            setError(e.message);
        }
    };
    
    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = editingCriterion.id
                ? await api.update(editingCriterion.id, editingCriterion)
                : await api.create(editingCriterion);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to save criterion.");
            }
            
            const savedCriterion = await res.json();
            if (editingCriterion.id) {
                setCriteria(criteria.map(c => c.id === savedCriterion.id ? savedCriterion : c));
            } else {
                setCriteria([...criteria, savedCriterion]);
            }
            setEditingCriterion(null);
        } catch(e) {
            setError(e.message);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-6 border-b flex justify-between items-center"><h2 className="text-2xl font-bold">Manage Judging Criteria</h2><button onClick={closeModal}><X/></button></header>
                <div className="p-6 overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}
                    {editingCriterion ? (
                         <form onSubmit={handleSave} className="space-y-4 p-4 bg-blue-50 rounded-2xl">
                            <h3 className="text-lg font-semibold">{editingCriterion.id ? 'Edit' : 'Add'} Criterion</h3>
                            <div><label>Name</label><input type="text" value={editingCriterion.name} onChange={e => setEditingCriterion({...editingCriterion, name: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
                            <div><label>Description (Prompt)</label><textarea value={editingCriterion.description} onChange={e => setEditingCriterion({...editingCriterion, description: e.target.value})} className="w-full p-2 border rounded-lg" rows="3" required/></div>
                            <div><label>Weight</label><input type="number" step="0.1" value={editingCriterion.weight} onChange={e => setEditingCriterion({...editingCriterion, weight: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" required/></div>
                            <div className="flex gap-4"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setEditingCriterion(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {criteria.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div className="flex items-center gap-4">
                                        <input type="checkbox" checked={c.enabled} onChange={() => handleToggle(c)} className="h-5 w-5 rounded"/>
                                        <div><p className="font-semibold">{c.name}</p><p className="text-sm text-gray-500">{c.description}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingCriterion(c)} className="p-2 text-gray-600"><Edit className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-600"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setEditingCriterion({ name: '', description: '', weight: 1.0, enabled: true })} className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg hover:bg-gray-100"><Plus/>Add New</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('upload');
  const [isCriteriaManagerOpen, setIsCriteriaManagerOpen] = useState(false);
  const [criteria, setCriteria] = useState([]);

  // Fetch criteria from DB on component mount
  useEffect(() => {
    const fetchCriteria = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/criteria/`);
            if (!res.ok) throw new Error("Could not fetch criteria");
            setCriteria(await res.json());
        } catch (e) {
            setError(e.message);
        }
    };
    fetchCriteria();
  }, []);

  useEffect(() => { return () => previews.forEach(url => URL.revokeObjectURL(url)); }, [previews]);

  const handleFileChange = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    setFiles(newFiles);
    setResults([]);
    setError(null);
    setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    setView('upload');
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    const activeCriteria = criteria.filter(c => c.enabled);
    if (activeCriteria.length === 0) {
        setError("Please enable at least one judging criterion via the manager.");
        return;
    }
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    
    // No longer need to send criteria, backend fetches from DB
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(`${API_BASE_URL}/judge-batch/`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
      {isCriteriaManagerOpen && <CriteriaManager criteria={criteria} setCriteria={setCriteria} closeModal={() => setIsCriteriaManagerOpen(false)} />}
      <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg"><Camera className="w-8 h-8 text-white" /></div>
                    <div>
                        <h1 className="text-4xl font-bold">Nature Photography Judge</h1>
                        <p className="text-gray-600 text-lg">Database-Driven AI Evaluation</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('upload')} className={`px-5 py-2.5 font-semibold rounded-xl ${view === 'upload' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Upload</button>
                    <button onClick={fetchHistory} className={`px-5 py-2.5 font-semibold rounded-xl ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-white'}`}>History</button>
                </div>
            </div>
        </div>
      </header>
      <main className="relative z-10 container mx-auto px-6 py-12">
        {view === 'upload' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border">
                <div className="p-8">
                    <label className="group cursor-pointer block p-8 border-2 border-dashed rounded-2xl" onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files)}} onDragOver={(e) => e.preventDefault()}>
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4"/>
                        <h3 className="text-xl font-semibold">Drop photos here or click to browse</h3>
                      </div>
                      <input type="file" onChange={(e) => handleFileChange(e.target.files)} className="hidden" multiple />
                    </label>
                </div>
                <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button onClick={() => setIsCriteriaManagerOpen(true)} className="flex items-center gap-3 px-6 py-4 bg-white border-2 font-semibold rounded-2xl"><Settings/>Manage Criteria</button>
                    <button onClick={handleUpload} disabled={files.length === 0 || loading} className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50">
                        {loading ? 'Analyzing...' : `Judge ${files.length || ''} Photos`}
                    </button>
                </div>
                {files.length > 0 && <div className="text-center pb-6"><button onClick={clearSelection} className="text-sm text-red-600">Clear</button></div>}
            </div>
            {error && <div className="mt-8 bg-red-100 p-4 rounded-lg">{error}</div>}
            {previews.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Selected Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {previews.map((p, i) => <img key={i} src={p} className="w-full h-48 object-cover rounded-xl"/>)}
                    </div>
                </div>
            )}
            {results.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Results</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {results.map((r) => <ResultCard key={r.id} result={r}/>)}
                    </div>
                </div>
            )}
          </div>
        )}
        {view === 'history' && (
            <div>
                <h2 className="text-2xl font-bold mb-6">Past Judgements</h2>
                {loading && <p>Loading...</p>}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {history.map((j) => <ResultCard key={j.id} result={j}/>)}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

