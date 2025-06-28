import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';

const PromptManager = ({ prompts, setPrompts, closeModal, API_BASE_URL }) => {
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
                            <h3 className="text-lg font-semibold">Edit: {editingPrompt.name}</h3>
                            <div><label className="font-medium text-gray-700">Name</label><input type="text" value={editingPrompt.name} className="mt-1 w-full p-2 border rounded-lg bg-gray-100" disabled/></div>
                            <div><label className="font-medium text-gray-700">Description</label><input type="text" value={editingPrompt.description || ''} onChange={e => setEditingPrompt({...editingPrompt, description: e.target.value})} className="mt-1 w-full p-2 border rounded-lg"/></div>
                            <div><label className="font-medium text-gray-700">Template</label><textarea value={editingPrompt.template} onChange={e => setEditingPrompt({...editingPrompt, template: e.target.value})} className="mt-1 w-full p-2 border rounded-lg font-mono text-sm" rows="12" required/></div>
                            <div className="flex gap-4 pt-2"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setEditingPrompt(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {prompts.map(p => (
                                <div key={p.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div className="flex-1">
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-sm text-gray-500 mb-2">{p.description}</p>
                                        <pre className="text-xs text-gray-600 mt-2 font-mono bg-white p-3 rounded border max-h-40 overflow-y-auto whitespace-pre-wrap">{p.template}</pre>
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

export default PromptManager;