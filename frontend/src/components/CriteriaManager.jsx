import React, { useState } from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';

const CriteriaManager = ({ criteria, setCriteria, closeModal, API_BASE_URL }) => {
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
                <header className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Manage Judging Criteria</h2>
                    <button onClick={closeModal}><X/></button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}
                    {editingCriterion ? (
                         <form onSubmit={handleSave} className="space-y-4 p-4 bg-blue-50 rounded-2xl">
                            <h3 className="text-lg font-semibold">{editingCriterion.id ? 'Edit' : 'Add'} Criterion</h3>
                            <div><label className="font-medium text-gray-700">Name</label><input type="text" value={editingCriterion.name} onChange={e => setEditingCriterion({...editingCriterion, name: e.target.value})} className="mt-1 w-full p-2 border rounded-lg" required/></div>
                            <div><label className="font-medium text-gray-700">Description (Prompt)</label><textarea value={editingCriterion.description} onChange={e => setEditingCriterion({...editingCriterion, description: e.target.value})} className="mt-1 w-full p-2 border rounded-lg" rows="3" required/></div>
                            <div><label className="font-medium text-gray-700">Weight</label><input type="number" step="0.1" value={editingCriterion.weight} onChange={e => setEditingCriterion({...editingCriterion, weight: parseFloat(e.target.value) || 0})} className="mt-1 w-full p-2 border rounded-lg" required/></div>
                            <div className="flex gap-4 pt-2"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setEditingCriterion(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button></div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            {criteria.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div className="flex items-center gap-4">
                                        <input type="checkbox" checked={c.enabled} onChange={() => handleToggle(c)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"/>
                                        <div><p className="font-semibold">{c.name}</p><p className="text-sm text-gray-500">{c.description}</p></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingCriterion(c)} className="p-2 text-gray-600 hover:text-blue-600"><Edit className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-600 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setEditingCriterion({ name: '', description: '', weight: 1.0, enabled: true })} className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-lg hover:bg-gray-100 transition-colors"><Plus/>Add New Criterion</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CriteriaManager;