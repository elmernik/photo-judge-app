import React, { useState } from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';

const CompetitionManager = ({ competitions, setCompetitions, closeModal, API_BASE_URL }) => {
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
                            <div><label className="font-medium text-gray-700">Name</label><input type="text" value={editingCompetition.name} onChange={e => setEditingCompetition({...editingCompetition, name: e.target.value})} className="mt-1 w-full p-2 border rounded-lg" required/></div>
                            <div><label className="font-medium text-gray-700">Description</label><textarea value={editingCompetition.description || ''} onChange={e => setEditingCompetition({...editingCompetition, description: e.target.value})} className="mt-1 w-full p-2 border rounded-lg" rows="3"/></div>
                            <div><label className="font-medium text-gray-700">Rules (Only these are passed to the LLM)</label><textarea value={editingCompetition.rules || ''} onChange={e => setEditingCompetition({...editingCompetition, rules: e.target.value})} className="mt-1 w-full p-2 border rounded-lg font-mono text-sm" rows="4"/></div>
                            <div className="flex gap-4 pt-2"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setEditingCompetition(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {competitions.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div>
                                        <p className="font-semibold">{c.name}</p>
                                        <p className="text-sm text-gray-500">{c.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingCompetition({ ...c })} className="p-2 text-gray-600 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-600 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setEditingCompetition({ name: '', description: '', rules: '' })} className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg hover:bg-gray-100 transition-colors"><Plus/>Add New Competition</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompetitionManager;