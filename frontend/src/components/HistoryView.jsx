import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultCard from './ResultCard';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const gridItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

// A styled container for loading and empty states
const InfoCard = ({ children }) => (
    <div className="text-center py-20 px-8 bg-white border border-blue-200 rounded-xl shadow-lg">
        {children}
    </div>
);

const HistoryView = ({ selectedCompetition, API_BASE_URL }) => {
    const [judgements, setJudgements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!selectedCompetition) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/competitions/${selectedCompetition.id}/judgements`);
                if (!res.ok) throw new Error('Failed to fetch history for this competition.');
                const data = await res.json();
                setJudgements(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [selectedCompetition, API_BASE_URL]);

    const handleDeletion = (deletedId) => {
        setJudgements(currentJudgements =>
            currentJudgements.filter(judgement => judgement.id !== deletedId)
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <InfoCard>
                    <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-6"/>
                    <h2 className="text-2xl font-bold text-blue-900">Loading History</h2>
                    <p className="text-blue-800 mt-2">Please wait while we fetch the records.</p>
                </InfoCard>
            );
        }

        if (error) {
            return (
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
            );
        }

        if (judgements.length === 0) {
            return (
                <InfoCard>
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HistoryIcon className="w-10 h-10 text-blue-500"/>
                    </div>
                    <h2 className="text-2xl font-bold text-blue-900">No History Found</h2>
                    <p className="text-blue-800 mt-2">There are no past judgements for this competition yet.</p>
                </InfoCard>
            );
        }

        return (
            <motion.div
                className="grid md:grid-cols-2 xl:grid-cols-3 gap-8"
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {judgements.map((j) => (
                        <ResultCard
                            key={j.id}
                            result={j}
                            API_BASE_URL={API_BASE_URL}
                            onDelete={handleDeletion}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                        <HistoryIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Competition History</h2>
                        <p className="text-gray-600">Review past judgements for <span className="font-medium">{selectedCompetition.name}</span>.</p>
                    </div>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default HistoryView;