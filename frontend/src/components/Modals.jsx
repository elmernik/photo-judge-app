import React, { useState, useMemo } from 'react';
import { X, Edit, Trash2, Plus, CheckCircle, ToggleLeft, ToggleRight, AlertTriangle, Info } from 'lucide-react';

// Shared Components
const ModalContainer = ({ children, title, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <header className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </header>
            {children}
        </div>
    </div>
);

const ErrorAlert = ({ error }) => error && (
    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl mb-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
    </div>
);

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

const FormField = ({ label, children, required = false }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
        {children}
    </div>
);

// Prompt Manager Components
const PromptHint = ({ title, variables, outputFormat }) => (
    <div className="mt-3 p-4 bg-blue-100/50 border border-blue-200/60 rounded-lg text-sm shadow-sm">
        <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-semibold text-blue-800 mb-2">{title}</h4>
                <div className="space-y-2 text-blue-700">
                    <div>
                        <p className="font-medium text-xs text-blue-600 uppercase tracking-wider mb-1">Required Variables</p>
                        <div className="flex flex-wrap gap-2">
                            {variables.map(v => <code key={v} className="text-xs font-mono bg-blue-200/70 text-blue-900 px-1.5 py-0.5 rounded">{v}</code>)}
                        </div>
                    </div>
                    <div>
                        <p className="font-medium text-xs text-blue-600 uppercase tracking-wider mb-1">Required Output</p>
                         <div className="flex flex-wrap gap-2">
                            {outputFormat.map(o => <code key={o} className="text-xs font-mono bg-blue-200/70 text-blue-900 px-1.5 py-0.5 rounded">{o}</code>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const PromptCard = ({ prompt, onEdit, onDelete, onToggleEnabled }) => {
    const isEnabled = prompt.enabled;

    return (
        <Card className={`${isEnabled ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {isEnabled && (
                        <div className="flex items-center gap-2 text-green-700 mb-3">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Active Prompt</span>
                        </div>
                    )}
                    <p className="text-sm text-gray-600 mb-4">{prompt.description || "No description provided."}</p>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                        <pre className="text-xs text-gray-700 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {prompt.template}
                        </pre>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onToggleEnabled(prompt)}
                        title={isEnabled ? "This prompt is active" : "Click to activate this prompt"}
                        className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={isEnabled}
                    >
                        {isEnabled ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={() => onEdit(prompt)} 
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors" 
                        title="Edit Prompt"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(prompt)} 
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors" 
                        title="Delete Prompt"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

const PROMPT_HINTS = {
  EVALUATION_PROMPT: {
    title: "Evaluation Prompt Requirements",
    variables: ["{criterion_name}", "{criterion_description}"],
    outputFormat: ["SCORE: [number]", "RATIONALE: [explanation]"],
  },
  REASONING_PROMPT: {
    title: "Reasoning Prompt Requirements",
    variables: ["{overall_score}", "{rules}", "{feedback_summary}"],
    outputFormat: ["FINAL_SCORE: [score]", "RATIONALE: [summary]"],
  },
};


const PromptForm = ({ initialPrompt, onSave, onCancel }) => {
    const [prompt, setPrompt] = useState(
        initialPrompt || { type: 'EVALUATION_PROMPT', description: '', template: '', enabled: false }
    );
    const isEditing = !!initialPrompt;

    // Get the hints for the currently selected prompt type
    const currentHint = PROMPT_HINTS[prompt.type];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(prompt);
    };
    
    return (
        <Card className="bg-blue-50 border-blue-200">
            <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
                </h3>
                
                <FormField label="Prompt Type" required>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={prompt.type.replace(/_/g, ' ')} 
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500" 
                            disabled 
                        />
                    ) : (
                        <select
                            value={prompt.type}
                            onChange={e => setPrompt({ ...prompt, type: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="EVALUATION_PROMPT">Evaluation Prompt</option>
                            <option value="REASONING_PROMPT">Reasoning Prompt</option>
                        </select>
                    )}
                </FormField>

                <FormField label="Description">
                    <input
                        type="text"
                        placeholder="e.g., A prompt for harsher judging"
                        value={prompt.description || ''}
                        onChange={e => setPrompt({ ...prompt, description: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </FormField>

                <FormField label="Template" required>
                    <textarea
                        value={prompt.template}
                        onChange={e => setPrompt({ ...prompt, template: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="8"
                        placeholder="Enter the prompt template here..."
                        required
                    />
                    {/* --- HINT IS ADDED HERE --- */}
                    {currentHint && (
                        <PromptHint
                            title={currentHint.title}
                            variables={currentHint.variables}
                            outputFormat={currentHint.outputFormat}
                        />
                    )}
                </FormField>

                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="enable_prompt"
                        checked={prompt.enabled}
                        onChange={e => setPrompt({ ...prompt, enabled: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="enable_prompt" className="text-sm text-gray-700">
                        <span className="font-medium">Enable this prompt upon saving</span>
                        <span className="block text-xs text-gray-500 mt-1">
                            Note: This will disable any other active prompt of the same type.
                        </span>
                    </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <ActionButton type="submit">
                        {isEditing ? 'Save Changes' : 'Create Prompt'}
                    </ActionButton>
                    <ActionButton variant="secondary" type="button" onClick={onCancel}>
                        Cancel
                    </ActionButton>
                </div>
            </form>
        </Card>
    );
};

// Main Prompt Manager Component
const PromptManager = ({ prompts, setPrompts, closeModal, API_BASE_URL }) => {
    const [view, setView] = useState('list');
    const [currentPrompt, setCurrentPrompt] = useState(null);
    const [error, setError] = useState(null);

    const groupedPrompts = useMemo(() => {
        return prompts.reduce((acc, p) => {
            (acc[p.type] = acc[p.type] || []).push(p);
            return acc;
        }, {});
    }, [prompts]);

    const handleApiCall = async (url, options, successCallback) => {
        setError(null);
        try {
            const res = await fetch(url, options);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `Request failed with status ${res.status}`);
            }
            const result = await res.json();
            successCallback(result);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleCreate = (newPrompt) => {
        handleApiCall(`${API_BASE_URL}/prompts/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(newPrompt)
        }, (createdPrompt) => {
            const updatedPrompts = prompts
                .map(p => (p.type === createdPrompt.type ? { ...p, enabled: false } : p))
                .concat(createdPrompt);
            setPrompts(updatedPrompts);
            setView('list');
        });
    };
    
    const handleUpdate = (promptToUpdate) => {
        handleApiCall(`${API_BASE_URL}/prompts/${promptToUpdate.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(promptToUpdate)
        }, (savedPrompt) => {
            const updatedPrompts = prompts.map(p => {
                if (savedPrompt.enabled && p.type === savedPrompt.type && p.id !== savedPrompt.id) {
                    return { ...p, enabled: false };
                }
                return p.id === savedPrompt.id ? savedPrompt : p;
            });
            setPrompts(updatedPrompts);
            setView('list');
            setCurrentPrompt(null);
        });
    };

    const handleDelete = (promptToDelete) => {
        if (window.confirm(`Are you sure you want to delete this prompt?`)) {
            handleApiCall(`${API_BASE_URL}/prompts/${promptToDelete.id}`, {
                method: 'DELETE'
            }, () => {
                setPrompts(prompts.filter(p => p.id !== promptToDelete.id));
            });
        }
    };

    const handleToggleEnabled = (promptToEnable) => {
        handleUpdate({ ...promptToEnable, enabled: true });
    };

    const showEditForm = (prompt) => {
        setCurrentPrompt(prompt);
        setView('edit');
    };
    
    const showCreateForm = () => {
        setCurrentPrompt(null);
        setView('create');
    };

    const showListView = () => {
        setView('list');
        setCurrentPrompt(null);
    };

    return (
        <ModalContainer title="Prompt Library" onClose={closeModal}>
            <div className="p-6 overflow-y-auto">
                <ErrorAlert error={error} />
                
                {view === 'list' && (
                    <div className="flex justify-end mb-6">
                        <ActionButton onClick={showCreateForm} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add New Prompt
                        </ActionButton>
                    </div>
                )}
                
                {view === 'list' ? (
                    <div className="space-y-8">
                        {Object.entries(groupedPrompts).map(([type, promptList]) => (
                            <section key={type}>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200 uppercase tracking-wide">
                                    {type.replace(/_/g, ' ')}
                                </h3>
                                <div className="space-y-4">
                                    {promptList.map(p => (
                                        <PromptCard 
                                            key={p.id} 
                                            prompt={p}
                                            onEdit={showEditForm}
                                            onDelete={handleDelete}
                                            onToggleEnabled={handleToggleEnabled}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <PromptForm 
                        initialPrompt={currentPrompt}
                        onSave={view === 'create' ? handleCreate : handleUpdate}
                        onCancel={showListView}
                    />
                )}
            </div>
        </ModalContainer>
    );
};

// Criteria Manager Component
const CriteriaManager = ({ criteria, setCriteria, closeModal, API_BASE_URL }) => {
    const [editingCriterion, setEditingCriterion] = useState(null);
    const [error, setError] = useState(null);

    const api = {
        update: (id, data) => fetch(`${API_BASE_URL}/criteria/${id}`, { 
            method: 'PUT', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(data) 
        }),
        create: (data) => fetch(`${API_BASE_URL}/criteria/`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(data) 
        }),
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
        if (!window.confirm('Are you sure you want to delete this criterion?')) return;
        
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
        <ModalContainer title="Manage Judging Criteria" onClose={closeModal}>
            <div className="p-6 overflow-y-auto">
                <ErrorAlert error={error} />
                
                {editingCriterion ? (
                    <Card className="bg-blue-50 border-blue-200">
                        <form onSubmit={handleSave} className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingCriterion.id ? 'Edit Criterion' : 'Add New Criterion'}
                            </h3>
                            
                            <FormField label="Name" required>
                                <input 
                                    type="text" 
                                    value={editingCriterion.name || ''} 
                                    onChange={e => setEditingCriterion({...editingCriterion, name: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    placeholder="e.g., Creativity"
                                    required
                                />
                            </FormField>
                            
                            <FormField label="Description (Prompt)" required>
                                <textarea 
                                    value={editingCriterion.description || ''} 
                                    onChange={e => setEditingCriterion({...editingCriterion, description: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    rows="4"
                                    placeholder="Describe what this criterion evaluates..."
                                    required
                                />
                            </FormField>
                            
                            <FormField label="Weight" required>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0"
                                    value={editingCriterion.weight || ''} 
                                    onChange={e => setEditingCriterion({...editingCriterion, weight: parseFloat(e.target.value) || 0})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    placeholder="1.0"
                                    required
                                />
                            </FormField>
                            
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <ActionButton type="submit">
                                    {editingCriterion.id ? 'Save Changes' : 'Create Criterion'}
                                </ActionButton>
                                <ActionButton variant="secondary" type="button" onClick={() => setEditingCriterion(null)}>
                                    Cancel
                                </ActionButton>
                            </div>
                        </form>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {criteria.map(c => (
                            <Card key={c.id}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <input 
                                            type="checkbox" 
                                            checked={c.enabled} 
                                            onChange={() => handleToggle(c)} 
                                            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold text-gray-900">{c.name}</h4>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                    Weight: {c.weight}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{c.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => setEditingCriterion(c)} 
                                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Edit className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(c.id)} 
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        
                        <button 
                            onClick={() => setEditingCriterion({ name: '', description: '', weight: 1.0, enabled: true })} 
                            className="w-full flex items-center justify-center gap-3 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                        >
                            <Plus className="w-5 h-5"/>
                            Add New Criterion
                        </button>
                    </div>
                )}
            </div>
        </ModalContainer>
    );
};

// Competition Manager Component
const CompetitionManager = ({ competitions, setCompetitions, closeModal, API_BASE_URL }) => {
    const [editingCompetition, setEditingCompetition] = useState(null);
    const [error, setError] = useState(null);

    const api = {
        create: (data) => fetch(`${API_BASE_URL}/competitions/`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(data) 
        }),
        update: (id, data) => fetch(`${API_BASE_URL}/competitions/${id}`, { 
            method: 'PUT', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(data) 
        }),
        delete: (id) => fetch(`${API_BASE_URL}/competitions/${id}`, { method: 'DELETE' }),
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const competitionData = { ...editingCompetition };

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
        if (!window.confirm('Are you sure you want to delete this competition?')) return;
        
        try {
            const res = await api.delete(id);
            if (!res.ok) throw new Error("Failed to delete competition.");
            setCompetitions(competitions.filter(c => c.id !== id));
        } catch(e) {
            setError(e.message);
        }
    };

    return (
        <ModalContainer title="Manage Competitions" onClose={closeModal}>
            <div className="p-6 overflow-y-auto">
                <ErrorAlert error={error} />
                
                {editingCompetition ? (
                    <Card className="bg-blue-50 border-blue-200">
                        <form onSubmit={handleSave} className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingCompetition.id ? 'Edit Competition' : 'Add New Competition'}
                            </h3>
                            
                            <FormField label="Name" required>
                                <input 
                                    type="text" 
                                    value={editingCompetition.name || ''} 
                                    onChange={e => setEditingCompetition({...editingCompetition, name: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    placeholder="e.g., Nature photographer of the year"
                                    required
                                />
                            </FormField>
                            
                            <FormField label="Description">
                                <textarea 
                                    value={editingCompetition.description || ''} 
                                    onChange={e => setEditingCompetition({...editingCompetition, description: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    rows="3"
                                    placeholder="Brief description of the competition..."
                                />
                            </FormField>
                            
                            <FormField label="Rules (LLM Instructions)">
                                <textarea 
                                    value={editingCompetition.rules || ''} 
                                    onChange={e => setEditingCompetition({...editingCompetition, rules: e.target.value})} 
                                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    rows="6"
                                    placeholder="Enter the specific rules and instructions for the competition that will be passed to the LLM for the final evaluation..."
                                />
                            </FormField>
                            
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <ActionButton type="submit">
                                    {editingCompetition.id ? 'Save Changes' : 'Create Competition'}
                                </ActionButton>
                                <ActionButton variant="secondary" type="button" onClick={() => setEditingCompetition(null)}>
                                    Cancel
                                </ActionButton>
                            </div>
                        </form>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {competitions.map(c => (
                            <Card key={c.id}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 mb-2">{c.name}</h4>
                                        {c.description && (
                                            <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            Created: {new Date(c.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => setEditingCompetition({ ...c })} 
                                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Edit className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(c.id)} 
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        
                        <button 
                            onClick={() => setEditingCompetition({ name: '', description: '', rules: '' })} 
                            className="w-full flex items-center justify-center gap-3 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                        >
                            <Plus className="w-5 h-5"/>
                            Add New Competition
                        </button>
                    </div>
                )}
            </div>
        </ModalContainer>
    );
};

export { PromptManager, CriteriaManager, CompetitionManager };