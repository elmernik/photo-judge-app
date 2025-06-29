import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Trash2, FileImage, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultCard from './ResultCard';

// ActionButton component
const ActionButton = ({ variant = 'primary', children, className = '', ...props }) => {
    const baseClasses = 'px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3';
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white',
        secondary: 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 shadow-md',
        danger: 'bg-red-600 text-white hover:bg-red-700'
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

// A small component for section headers with the blue theme
const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
            {title}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
    </div>
);


// Animation variants for the container of the grid
const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

// Animation variants for each individual grid item
const gridItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
    },
};

const UploadView = ({ selectedCompetition, criteria, API_BASE_URL }) => {
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [judgementPerformed, setJudgementPerformed] = useState(false);

    useEffect(() => {
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
            setJudgementPerformed(true);
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
        <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
                {!judgementPerformed ? (
                    <motion.div key="uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="bg-white border border-blue-200 rounded-xl shadow-lg">
                            <div className="p-8">
                                <label className="group cursor-pointer block p-12 border-2 border-dashed border-blue-300 rounded-xl hover:bg-blue-100/50 transition-colors" onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files) }} onDragOver={(e) => e.preventDefault()}>
                                    <div className="text-center">
                                        <div className="flex justify-center items-center mb-5">
                                             <div className="p-4 bg-blue-100 rounded-full">
                                                 <Upload className="w-10 h-10 text-blue-600 transition-transform group-hover:scale-110"/>
                                             </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-blue-900">Drop photos here or click to browse</h3>
                                        <p className="text-blue-800 mt-2">
                                            For competition: <span className="font-semibold">{selectedCompetition.name}</span>
                                        </p>
                                    </div>
                                    <input type="file" onChange={(e) => handleFileChange(e.target.files)} className="hidden" multiple accept="image/*" />
                                </label>
                            </div>
                            {files.length > 0 && (
                                <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-blue-200 pt-6 mt-2">
                                    <ActionButton
                                        variant="primary"
                                        onClick={handleUpload}
                                        disabled={loading}
                                    >
                                        <Sparkles className="w-5 h-5"/>
                                        {loading ? 'Analyzing...' : `Judge ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                                    </ActionButton>
                                    <ActionButton
                                        variant="secondary"
                                        onClick={() => { setFiles([]); setPreviews([]); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Clear Selection
                                    </ActionButton>
                                </div>
                            )}
                        </div>

                        {previews.length > 0 && (
                            <div className="mt-12">
                                <SectionHeader title="Selected Photos" />
                                <motion.div
                                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
                                    variants={gridContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {previews.map((p, i) => (
                                        <motion.div key={p} variants={gridItemVariants} layout>
                                            <img
                                                src={p}
                                                alt={`Preview ${i}`}
                                                className="w-full h-48 object-cover rounded-xl shadow-md ring-1 ring-black/5"
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AnimatePresence>
                            {results.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-100 rounded-full">
                                                <CheckCircle className="w-8 h-8 text-green-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">Judgement Complete</h2>
                                                <p className="text-gray-600">Review the results for your {results.length} photo{results.length !== 1 ? 's': ''}.</p>
                                            </div>
                                        </div>
                                        <ActionButton
                                            variant="primary"
                                            onClick={handleNewJudgement}
                                        >
                                            <Upload className="w-5 h-5"/>
                                            Perform New Judgement
                                        </ActionButton>
                                    </div>
                                    <motion.div
                                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                                        variants={gridContainerVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {results.map((r) => <ResultCard key={r.id} result={r} API_BASE_URL={API_BASE_URL}/>)}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                 <div className="mt-8 bg-red-100 border border-red-300 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-700" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-red-900 mb-1">An Error Occurred</h4>
                            <div className="text-red-800">{error}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadView;