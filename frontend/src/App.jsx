import React, { useState, useEffect } from 'react';
import { Upload, Camera, Star, ChevronRight, Sparkles, Award, History, X, Image as ImageIcon, Settings, Plus, Edit, Trash2, Menu, FileText, Trophy, Users, Home } from 'lucide-react';

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
                                        <button onClick={() => setEditingCriterion(c)} className="p-2 text-gray-600 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-600 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
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

const CompetitionManager = ({ competitions, setCompetitions, closeModal }) => {
    const [editingCompetition, setEditingCompetition] = useState(null);
    const [error, setError] = useState(null);

    const api = {
        create: (data) => fetch(`${API_BASE_URL}/competitions/`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        update: (id, data) => fetch(`${API_BASE_URL}/competitions/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }),
        delete: (id) => fetch(`${API_BASE_URL}/competitions/${id}`, { method: 'DELETE' }),
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const competitionData = {
                ...editingCompetition,
                rules: editingCompetition.rules ? JSON.parse(editingCompetition.rules) : {}
            };
            
            const res = editingCompetition.id
                ? await api.update(editingCompetition.id, competitionData)
                : await api.create(competitionData);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to save competition.");
            }
            
            const savedCompetition = await res.json();
            if (editingCompetition.id) {
                setCompetitions(competitions.map(c => c.id === savedCompetition.id ? savedCompetition : c));
            } else {
                setCompetitions([...competitions, savedCompetition]);
            }
            setEditingCompetition(null);
        } catch(e) {
            setError(e.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await api.delete(id);
            if (!res.ok) throw new Error("Failed to delete competition.");
            setCompetitions(competitions.filter(c => c.id !== id));
        } catch(e) {
            setError(e.message);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Manage Competitions</h2>
                    <button onClick={closeModal}><X/></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}
                    {editingCompetition ? (
                         <form onSubmit={handleSave} className="space-y-4 p-4 bg-blue-50 rounded-2xl">
                            <h3 className="text-lg font-semibold">{editingCompetition.id ? 'Edit' : 'Add'} Competition</h3>
                            <div><label>Name</label><input type="text" value={editingCompetition.name} onChange={e => setEditingCompetition({...editingCompetition, name: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
                            <div><label>Description</label><textarea value={editingCompetition.description || ''} onChange={e => setEditingCompetition({...editingCompetition, description: e.target.value})} className="w-full p-2 border rounded-lg" rows="3"/></div>
                            <div><label>Rules (JSON format)</label><textarea value={editingCompetition.rules || ''} onChange={e => setEditingCompetition({...editingCompetition, rules: e.target.value})} className="w-full p-2 border rounded-lg" rows="4" placeholder='{"theme": "Wildlife", "maxPhotos": 5}'/></div>
                            <div className="flex gap-4"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setEditingCompetition(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {competitions.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div>
                                        <p className="font-semibold">{c.name}</p>
                                        <p className="text-sm text-gray-500">{c.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingCompetition({...c, rules: JSON.stringify(c.rules, null, 2)})} className="p-2 text-gray-600 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-600 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setEditingCompetition({ name: '', description: '', rules: '{}' })} className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg hover:bg-gray-100"><Plus/>Add New Competition</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PromptManager = ({ prompts, setPrompts, closeModal }) => {
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [error, setError] = useState(null);

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/prompts/${editingPrompt.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(editingPrompt)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to save prompt.");
            }
            
            const savedPrompt = await res.json();
            setPrompts(prompts.map(p => p.id === savedPrompt.id ? savedPrompt : p));
            setEditingPrompt(null);
        } catch(e) {
            setError(e.message);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Manage Prompts</h2>
                    <button onClick={closeModal}><X/></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}
                    {editingPrompt ? (
                         <form onSubmit={handleSave} className="space-y-4 p-4 bg-blue-50 rounded-2xl">
                            <h3 className="text-lg font-semibold">Edit {editingPrompt.name}</h3>
                            <div><label>Name</label><input type="text" value={editingPrompt.name} className="w-full p-2 border rounded-lg bg-gray-100" disabled/></div>
                            <div><label>Description</label><input type="text" value={editingPrompt.description || ''} onChange={e => setEditingPrompt({...editingPrompt, description: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
                            <div><label>Template</label><textarea value={editingPrompt.template} onChange={e => setEditingPrompt({...editingPrompt, template: e.target.value})} className="w-full p-2 border rounded-lg font-mono text-sm" rows="12" required/></div>
                            <div className="flex gap-4"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setEditingPrompt(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {prompts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div className="flex-1">
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-sm text-gray-500">{p.description}</p>
                                        <p className="text-xs text-gray-400 mt-2 font-mono bg-white p-2 rounded border max-h-20 overflow-y-auto">{p.template}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button onClick={() => setEditingPrompt(p)} className="p-2 text-gray-600 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ 
    competitions, 
    selectedCompetition, 
    setSelectedCompetition, 
    isOpen, 
    setIsOpen,
    setIsCompetitionManagerOpen,
    setIsPromptsManagerOpen,
    setIsCriteriaManagerOpen 
}) => {
    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
                    onClick={() => setIsOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <div className={`
                fixed top-0 left-0 h-full w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200/50 
                transform transition-transform duration-300 ease-in-out z-50
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:h-auto
            `}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold">Competitions</h2>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                        {competitions.map(competition => (
                            <button
                                key={competition.id}
                                onClick={() => {
                                    setSelectedCompetition(competition);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    selectedCompetition?.id === competition.id 
                                        ? 'bg-blue-100 border-blue-200 text-blue-800' 
                                        : 'hover:bg-gray-50 border-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-5 h-5" />
                                    <div>
                                        <p className="font-semibold">{competition.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{competition.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t">
                        <button 
                            onClick={() => setIsCompetitionManagerOpen(true)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-xl border border-dashed"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Manage Competitions</span>
                        </button>
                        
                        <button 
                            onClick={() => setIsCriteriaManagerOpen(true)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-xl"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Manage Criteria</span>
                        </button>
                        
                        <button 
                            onClick={() => setIsPromptsManagerOpen(true)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-xl"
                        >
                            <FileText className="w-5 h-5" />
                            <span>Manage Prompts</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
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
  
  // Modal states
  const [isCriteriaManagerOpen, setIsCriteriaManagerOpen] = useState(false);
  const [isCompetitionManagerOpen, setIsCompetitionManagerOpen] = useState(false);
  const [isPromptsManagerOpen, setIsPromptsManagerOpen] = useState(false);
  
  // Data states
  const [criteria, setCriteria] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch criteria
            const criteriaRes = await fetch(`${API_BASE_URL}/criteria/`);
            if (criteriaRes.ok) setCriteria(await criteriaRes.json());
            
            // Fetch competitions
            const competitionsRes = await fetch(`${API_BASE_URL}/competitions/`);
            if (competitionsRes.ok) {
                const comps = await competitionsRes.json();
                setCompetitions(comps);
                if (comps.length > 0) setSelectedCompetition(comps[0]);
            }
            
            // Fetch prompts
            const promptsRes = await fetch(`${API_BASE_URL}/prompts/`);
            if (promptsRes.ok) setPrompts(await promptsRes.json());
        } catch (e) {
            setError(e.message);
        }
    };
    fetchData();
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
    if (!selectedCompetition) {
        setError("Please select a competition first.");
        return;
    }
    
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
    if (!selectedCompetition) {
        setError("Please select a competition first.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setView('history');
    try {
      const res = await fetch(`${API_BASE_URL}/competitions/${selectedCompetition.id}/judgements`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex">
      {/* Sidebar */}
      <Sidebar 
        competitions={competitions}
        selectedCompetition={selectedCompetition}
        setSelectedCompetition={setSelectedCompetition}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        setIsCompetitionManagerOpen={setIsCompetitionManagerOpen}
        setIsPromptsManagerOpen={setIsPromptsManagerOpen}
        setIsCriteriaManagerOpen={setIsCriteriaManagerOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Modals */}
        {isCriteriaManagerOpen && <CriteriaManager criteria={criteria} setCriteria={setCriteria} closeModal={() => setIsCriteriaManagerOpen(false)} />}
        {isCompetitionManagerOpen && <CompetitionManager competitions={competitions} setCompetitions={setCompetitions} closeModal={() => setIsCompetitionManagerOpen(false)} />}
        {isPromptsManagerOpen && <PromptManager prompts={prompts} setPrompts={setPrompts} closeModal={() => setIsPromptsManagerOpen(false)} />}
        
        <header className="relative z-10 bg-white/80 backdrop-blur-xl border-b">
          <div className="container mx-auto px-6 py-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                      <button 
                          onClick={() => setSidebarOpen(true)}
                          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                      >
                          <Menu className="w-6 h-6" />
                      </button>
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg"><Camera className="w-8 h-8 text-white" /></div>
                      <div>
                          <h1 className="text-4xl font-bold">{selectedCompetition ? selectedCompetition.name : 'Photo Judge AI'}</h1>
                          <p className="text-gray-600 text-lg">{selectedCompetition ? selectedCompetition.description : 'Select a competition to begin'}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <button onClick={() => { setView('upload'); clearSelection(); }} className={`px-5 py-2.5 font-semibold rounded-xl flex items-center gap-2 ${view === 'upload' ? 'bg-blue-600 text-white' : 'bg-white'}`}><Upload className="w-4 h-4"/>Upload</button>
                      <button onClick={fetchHistory} className={`px-5 py-2.5 font-semibold rounded-xl flex items-center gap-2 ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-white'}`}><History className="w-4 h-4"/>History</button>
                  </div>
              </div>
          </div>
        </header>
        
        <main className="relative z-10 container mx-auto px-6 py-12">
          {!selectedCompetition ? (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
              <h2 className="text-2xl font-bold text-gray-700">No Competition Selected</h2>
              <p className="text-gray-500 mt-2">Please select a competition from the sidebar, or create a new one to begin.</p>
            </div>
          ) : view === 'upload' ? (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border">
                  <div className="p-8">
                      <label className="group cursor-pointer block p-8 border-2 border-dashed rounded-2xl" onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files)}} onDragOver={(e) => e.preventDefault()}>
                        <div className="text-center">
                          <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4"/>
                          <h3 className="text-xl font-semibold">Drop photos here or click to browse</h3>
                          <p className="text-gray-500 mt-1">For competition: <span className="font-bold">{selectedCompetition.name}</span></p>
                        </div>
                        <input type="file" onChange={(e) => handleFileChange(e.target.files)} className="hidden" multiple accept="image/*" />
                      </label>
                  </div>
                  <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                      <button onClick={() => setIsCriteriaManagerOpen(true)} className="flex items-center gap-3 px-6 py-4 bg-white border-2 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"><Settings/>Manage Criteria</button>
                      <button onClick={handleUpload} disabled={files.length === 0 || loading} className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center gap-3">
                          <Sparkles className="w-5 h-5"/>
                          {loading ? 'Analyzing...' : `Judge ${files.length || ''} Photo${files.length !== 1 ? 's' : ''}`}
                      </button>
                  </div>
                  {files.length > 0 && <div className="text-center pb-6"><button onClick={clearSelection} className="text-sm text-red-600 hover:underline">Clear Selection</button></div>}
              </div>
              {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}
              {previews.length > 0 && (
                  <div className="mt-12">
                      <h2 className="text-2xl font-bold mb-6">Selected Photos</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {previews.map((p, i) => <img key={i} src={p} alt={`Preview ${i}`} className="w-full h-48 object-cover rounded-xl shadow-md"/>)}
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
          ) : ( // view === 'history'
              <div>
                  <h2 className="text-2xl font-bold mb-6">Past Judgements for {selectedCompetition.name}</h2>
                  {loading && <div className="text-center py-10"><p>Loading History...</p></div>}
                  {error && <div className="mt-8 bg-red-100 p-4 rounded-lg text-red-800 border border-red-200">{error}</div>}
                  {!loading && history.length === 0 && (
                    <div className="text-center py-20 bg-white/50 rounded-3xl">
                      <History className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
                      <h2 className="text-2xl font-bold text-gray-700">No History Found</h2>
                      <p className="text-gray-500 mt-2">There are no past judgements for this competition yet.</p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {history.map((j) => <ResultCard key={j.id} result={j}/>)}
                  </div>
              </div>
          )}
        </main>
      </div>
    </div>
  );
}