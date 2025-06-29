import React, { useState, useMemo } from 'react';
import { X, Edit, Trash2, Plus, CheckCircle, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

// A single prompt card component for cleaner code
const PromptCard = ({ prompt, onEdit, onDelete, onToggleEnabled }) => {
    const isEnabled = prompt.enabled;

    return (
        <div className={`flex flex-col md:flex-row items-start justify-between p-4 rounded-xl border ${isEnabled ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
            <div className="flex-1">
                {isEnabled && (
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold text-sm">Active Prompt</span>
                    </div>
                )}
                <p className="text-sm text-gray-600 mb-2">{prompt.description || "No description provided."}</p>
                <pre className="text-xs text-gray-700 mt-2 font-mono bg-white p-3 rounded-lg border max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {prompt.template}
                </pre>
            </div>
            <div className="flex items-center gap-2 ml-0 md:ml-4 mt-4 md:mt-0 flex-shrink-0">
                <button
                    onClick={() => onToggleEnabled(prompt)}
                    title={isEnabled ? "This prompt is active" : "Click to activate this prompt"}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isEnabled}
                >
                    {isEnabled ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => onEdit(prompt)} className="p-2 text-gray-600 hover:text-blue-600" title="Edit Prompt">
                    <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(prompt)} className="p-2 text-gray-600 hover:text-red-600" title="Delete Prompt">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// A reusable form for creating and editing prompts
const PromptForm = ({ initialPrompt, onSave, onCancel }) => {
    const [prompt, setPrompt] = useState(
        initialPrompt || { type: 'EVALUATION_PROMPT', description: '', template: '', enabled: false }
    );
    const isEditing = !!initialPrompt;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(prompt);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-blue-50/50 rounded-2xl">
            <h3 className="text-xl font-semibold">{isEditing ? 'Edit Prompt' : 'Create New Prompt'}</h3>
            
            <div>
                <label className="font-medium text-gray-700">Prompt Type</label>
                {isEditing ? (
                     <input type="text" value={prompt.type} className="mt-1 w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed" disabled />
                ) : (
                    <select
                        value={prompt.type}
                        onChange={e => setPrompt({ ...prompt, type: e.target.value })}
                        className="mt-1 w-full p-2 border rounded-lg bg-white"
                    >
                        <option value="EVALUATION_PROMPT">Evaluation Prompt</option>
                        <option value="REASONING_PROMPT">Reasoning Prompt</option>
                    </select>
                )}
            </div>

            <div>
                <label className="font-medium text-gray-700">Description</label>
                <input
                    type="text"
                    placeholder="e.g., A prompt for creative analysis"
                    value={prompt.description || ''}
                    onChange={e => setPrompt({ ...prompt, description: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg"
                />
            </div>

            <div>
                <label className="font-medium text-gray-700">Template</label>
                <textarea
                    value={prompt.template}
                    onChange={e => setPrompt({ ...prompt, template: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg font-mono text-sm"
                    rows="10"
                    placeholder="Enter the prompt template here..."
                    required
                />
            </div>

            <div className="flex items-center gap-3">
                 <input
                    type="checkbox"
                    id="enable_prompt"
                    checked={prompt.enabled}
                    onChange={e => setPrompt({ ...prompt, enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enable_prompt" className="text-gray-700">
                    Enable this prompt upon saving?
                    <span className="block text-xs text-gray-500">Note: This will disable any other active prompt of the same type.</span>
                </label>
            </div>

            <div className="flex gap-4 pt-2">
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                    {isEditing ? 'Save Changes' : 'Create Prompt'}
                </button>
                <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
            </div>
        </form>
    );
};


// Main Component
const PromptManager = ({ prompts, setPrompts, closeModal, API_BASE_URL }) => {
    const [view, setView] = useState('list'); // 'list', 'edit', 'create'
    const [currentPrompt, setCurrentPrompt] = useState(null);
    const [error, setError] = useState(null);

    // Group prompts by their type using useMemo for performance
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
            // The backend disables other prompts, so we need to reflect that in the state
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-6 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">Prompt Library</h2>
                    <button onClick={closeModal} className="text-gray-500 hover:text-gray-800"><X /></button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-800 border border-red-200 rounded-lg mb-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {view === 'list' && (
                        <div className="flex justify-end mb-4">
                            <button onClick={showCreateForm} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                                <Plus className="w-5 h-5" />
                                Add New Prompt
                            </button>
                        </div>
                    )}
                    
                    {view === 'list' ? (
                        <div className="space-y-8">
                            {Object.entries(groupedPrompts).map(([type, promptList]) => (
                                <section key={type}>
                                    <h3 className="text-lg font-semibold text-gray-500 mb-3 border-b pb-2 uppercase tracking-wider">{type.replace(/_/g, ' ')}</h3>
                                    <div className="space-y-3">
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
            </div>
        </div>
    );
};

export default PromptManager;