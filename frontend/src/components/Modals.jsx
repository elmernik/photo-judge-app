import React, { useState, useMemo } from 'react';
import { X, Edit, Trash2, Plus, CheckCircle, ToggleLeft, ToggleRight, AlertTriangle, Info, Sparkles  } from 'lucide-react';

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
    <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
                <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-indigo-900 mb-3">{title}</h4>
                <div className="space-y-3 text-indigo-800">
                    <div>
                        <p className="font-semibold text-xs text-indigo-700 uppercase tracking-wider mb-2">Required Variables</p>
                        <div className="flex flex-wrap gap-2">
                            {variables.map(v => (
                                <code key={v} className="text-xs font-mono bg-indigo-200 text-indigo-900 px-2 py-1 rounded-md shadow-sm">
                                    {v}
                                </code>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-xs text-indigo-700 uppercase tracking-wider mb-2">Required Output</p>
                        <div className="flex flex-wrap gap-2">
                            {outputFormat.map(o => (
                                <code key={o} className="text-xs font-mono bg-indigo-200 text-indigo-900 px-2 py-1 rounded-md shadow-sm">
                                    {o}
                                </code>
                            ))}
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
        <Card className={`${isEnabled ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' : 'hover:shadow-md'} transition-all duration-200`}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                    {isEnabled && (
                        <div className="flex items-center gap-3 text-green-700 mb-4">
                            <div className="p-1 bg-green-100 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold">Active Prompt</span>
                        </div>
                    )}
                    <p className="text-gray-600 mb-4 leading-relaxed">{prompt.description || "No description provided."}</p>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-inner">
                        <pre className="text-xs text-gray-700 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {prompt.template}
                        </pre>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onToggleEnabled(prompt)}
                        title={isEnabled ? "This prompt is active" : "Click to activate this prompt"}
                        className="p-3 text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl hover:bg-green-50 transition-all duration-200 group"
                        disabled={isEnabled}
                    >
                        {isEnabled ? (
                            <ToggleRight className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
                        ) : (
                            <ToggleLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                    <button 
                        onClick={() => onEdit(prompt)} 
                        className="p-3 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 group" 
                        title="Edit Prompt"
                    >
                        <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                        onClick={() => onDelete(prompt)} 
                        className="p-3 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group" 
                        title="Delete Prompt"
                    >
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
  RULES_SYNTHESIS_PROMPT: {
    title: "Rules Synthesis Prompt Requirements",
    variables: ["{competition_name}", "{aggregated_search_results}"],
    outputFormat: ["No Requirements (Natural Language)"],
  },
};

const PromptForm = ({ initialPrompt, onSave, onCancel }) => {
    const [prompt, setPrompt] = useState(
        initialPrompt || { type: 'EVALUATION_PROMPT', description: '', template: '', enabled: false }
    );
    const isEditing = !!initialPrompt;
    const currentHint = PROMPT_HINTS[prompt.type];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(prompt);
    };
    
    return (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
                    </h3>
                </div>
                
                <FormField label="Prompt Type" required>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={prompt.type.replace(/_/g, ' ')} 
                            className="w-full p-4 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed text-gray-500 shadow-sm" 
                            disabled 
                        />
                    ) : (
                        <select
                            value={prompt.type}
                            onChange={e => setPrompt({ ...prompt, type: e.target.value })}
                            className="w-full p-4 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
                        >
                            <option value="EVALUATION_PROMPT">Evaluation Prompt</option>
                            <option value="REASONING_PROMPT">Reasoning Prompt</option>
                            <option value="RULES_SYNTHESIS_PROMPT">Rules Synthesis Prompt</option>
                        </select>
                    )}
                </FormField>

                <FormField label="Description">
                    <input
                        type="text"
                        placeholder="e.g., A prompt for harsher judging criteria"
                        value={prompt.description || ''}
                        onChange={e => setPrompt({ ...prompt, description: e.target.value })}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all"
                    />
                </FormField>

                <FormField label="Template" required>
                    <textarea
                        value={prompt.template}
                        onChange={e => setPrompt({ ...prompt, template: e.target.value })}
                        className="w-full p-4 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all resize-none"
                        rows="8"
                        placeholder="Enter the prompt template here..."
                        required
                    />
                    {currentHint && (
                        <PromptHint
                            title={currentHint.title}
                            variables={currentHint.variables}
                            outputFormat={currentHint.outputFormat}
                        />
                    )}
                </FormField>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <input
                        type="checkbox"
                        id="enable_prompt"
                        checked={prompt.enabled}
                        onChange={e => setPrompt({ ...prompt, enabled: e.target.checked })}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="enable_prompt" className="text-sm text-gray-700">
                        <span className="font-semibold">Enable this prompt upon saving</span>
                        <span className="block text-xs text-gray-500 mt-1">
                            Note: This will disable any other active prompt of the same type.
                        </span>
                    </label>
                </div>

                <div className="flex gap-3 pt-6 border-t border-purple-200">
                    <ActionButton type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
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
                        <button 
                            onClick={showCreateForm}
                            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            <Plus className="w-5 h-5" />
                            <span>Add New Prompt</span>
                        </button>
                    </div>
                )}
                
                {view === 'list' ? (
                    <div className="space-y-8">
                        {Object.keys(groupedPrompts).length > 0 ? (
                            Object.entries(groupedPrompts).map(([type, promptList]) => (
                                <section key={type}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
                                            {type.replace(/_/g, ' ')}
                                        </h3>
                                        <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                                    </div>
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
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-purple-400"/>
                                </div>
                                <p className="text-lg font-medium mb-2">No prompts yet</p>
                                <p className="text-sm">Create your first prompt to get started</p>
                            </div>
                        )}
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
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingCriterion.id ? 'Edit Criterion' : 'Create New Criterion'}
                                </h3>
                            </div>
                            
                            <FormField label="Criterion Name" required>
                                <input 
                                    type="text" 
                                    value={editingCriterion.name || ''} 
                                    onChange={e => setEditingCriterion({...editingCriterion, name: e.target.value})} 
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-all" 
                                    placeholder="e.g., Creativity, Technical Skill, Composition"
                                    required
                                />
                            </FormField>
                            
                            <FormField label="Description & Judging Instructions" required>
                                <textarea 
                                    value={editingCriterion.description || ''} 
                                    onChange={e => setEditingCriterion({...editingCriterion, description: e.target.value})} 
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-all resize-none" 
                                    rows="5"
                                    placeholder="Describe what this criterion evaluates and how it should be judged..."
                                    required
                                />
                            </FormField>
                            
                            <FormField label="Weight Factor" required>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0"
                                        value={editingCriterion.weight || ''} 
                                        onChange={e => setEditingCriterion({...editingCriterion, weight: parseFloat(e.target.value) || 0})} 
                                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-all" 
                                        placeholder="1.0"
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                        <span className="text-sm text-gray-500">×</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                    Higher weights give this criterion more influence on the final score
                                </p>
                            </FormField>
                            
                            <div className="flex gap-3 pt-6 border-t border-emerald-200">
                                <ActionButton type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
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
                        {criteria.length > 0 ? (
                            criteria.map(c => (
                                <Card key={c.id} className="hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className="pt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={c.enabled} 
                                                    onChange={() => handleToggle(c)} 
                                                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shadow-sm"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                                    <h4 className="font-bold text-lg text-gray-900 truncate">{c.name}</h4>
                                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-semibold rounded-full">
                                                        Weight: {c.weight}×
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 leading-relaxed">{c.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button 
                                                onClick={() => setEditingCriterion(c)} 
                                                className="p-3 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 group"
                                                title="Edit criterion"
                                            >
                                                <Edit className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(c.id)} 
                                                className="p-3 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group"
                                                title="Delete criterion"
                                            >
                                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-emerald-400"/>
                                </div>
                                <p className="text-lg font-medium mb-2">No judging criteria yet</p>
                                <p className="text-sm">Create your first criterion to get started</p>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setEditingCriterion({ name: '', description: '', weight: 1.0, enabled: true })} 
                            className="w-full flex items-center justify-center gap-4 py-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 text-gray-600 hover:text-emerald-600 group"
                        >
                            <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                <Plus className="w-6 h-6 text-emerald-600"/>
                            </div>
                            <span className="text-lg font-semibold">Add New Criterion</span>
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
    const [isGenerating, setIsGenerating] = useState(false);

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
        generateGuidelines: (competitionName) => fetch(`${API_BASE_URL}/competitions/generate-guidelines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ competition_name: competitionName })
        }),
    };

    const handleGenerateGuidelines = async () => {
        if (!editingCompetition?.name) {
            setError("Please enter a competition name first.");
            return;
        }
        
        setError(null);
        setIsGenerating(true);

        try {
            const res = await api.generateGuidelines(editingCompetition.name);
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to generate guidelines.");
            }

            const data = await res.json();
            setEditingCompetition(prev => ({ ...prev, rules: data.guidelines }));

        } catch (e) {
            setError(e.message);
        } finally {
            setIsGenerating(false);
        }
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
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingCompetition.id ? 'Edit Competition' : 'Create New Competition'}
                                </h3>
                            </div>
                            
                            <FormField label="Competition Name" required>
                                <input 
                                    type="text" 
                                    value={editingCompetition.name || ''} 
                                    onChange={e => setEditingCompetition({...editingCompetition, name: e.target.value})} 
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all" 
                                    placeholder="e.g., Wildlife Photographer of the Year"
                                    required
                                />
                            </FormField>
                            
                            <FormField label="Description">
                                <textarea 
                                    value={editingCompetition.description || ''} 
                                    onChange={e => setEditingCompetition({...editingCompetition, description: e.target.value})} 
                                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all resize-none" 
                                    rows="3"
                                    placeholder="Brief description of the competition and its purpose..."
                                />
                            </FormField>
                            
                            <FormField>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-gray-800">Competition Rules & Guidelines</label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateGuidelines}
                                            disabled={!editingCompetition.name || isGenerating}
                                            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2.5"
                                        >
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                            {isGenerating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>Generate with AI</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="relative">
                                        <textarea 
                                            value={editingCompetition.rules || ''} 
                                            onChange={e => setEditingCompetition({...editingCompetition, rules: e.target.value})} 
                                            className="w-full p-4 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all resize-none" 
                                            rows="8"
                                            placeholder="Define the judging criteria and rules for the AI judge, or use the AI generator above to create them automatically based on your competition name."
                                        />
                                        {isGenerating && (
                                            <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-lg">
                                                    <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                                                    <span className="text-blue-700 font-medium">AI is crafting your guidelines...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </FormField>
                            
                            <div className="flex gap-3 pt-6 border-t border-blue-200">
                                <ActionButton type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
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
                        {competitions.length > 0 ? (
                            competitions.map(c => (
                                <Card key={c.id} className="hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <h4 className="font-bold text-lg text-gray-900 truncate">{c.name}</h4>
                                            </div>
                                            {c.description && (
                                                <p className="text-gray-600 mb-4 leading-relaxed">{c.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-1 rounded-full">
                                                    Created: {new Date(c.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button 
                                                onClick={() => setEditingCompetition({ ...c })} 
                                                className="p-3 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 group"
                                                title="Edit competition"
                                            >
                                                <Edit className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(c.id)} 
                                                className="p-3 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group"
                                                title="Delete competition"
                                            >
                                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-gray-400"/>
                                </div>
                                <p className="text-lg font-medium mb-2">No competitions yet</p>
                                <p className="text-sm">Create your first competition to get started</p>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setEditingCompetition({ name: '', description: '', rules: '' })} 
                            className="w-full flex items-center justify-center gap-4 py-8 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-gray-600 hover:text-blue-600 group"
                        >
                            <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                <Plus className="w-6 h-6 text-blue-600"/>
                            </div>
                            <span className="text-lg font-semibold">Add New Competition</span>
                        </button>
                    </div>
                )}
            </div>
        </ModalContainer>
    );
};

export { PromptManager, CriteriaManager, CompetitionManager };