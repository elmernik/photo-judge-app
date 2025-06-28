import React from 'react';
import { X, Trophy, Plus, Settings, FileText } from 'lucide-react';

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
            <aside className={`
                fixed top-0 left-0 h-full w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200/50
                transform transition-transform duration-300 ease-in-out z-50
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:h-auto lg:flex-shrink-0
            `}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold">Competitions</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2 mb-6 flex-1 overflow-y-auto">
                        {competitions.map(competition => (
                            <button
                                key={competition.id}
                                onClick={() => setSelectedCompetition(competition)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    selectedCompetition?.id === competition.id
                                        ? 'bg-blue-100 border-blue-200 text-blue-800 shadow-sm'
                                        : 'hover:bg-gray-50 border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Trophy className="w-5 h-5 flex-shrink-0" />
                                    <div className="flex-1">
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
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-100 rounded-xl"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Manage Competitions</span>
                        </button>

                        <button
                            onClick={() => setIsCriteriaManagerOpen(true)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-100 rounded-xl"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Manage Criteria</span>
                        </button>

                        <button
                            onClick={() => setIsPromptsManagerOpen(true)}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-100 rounded-xl"
                        >
                            <FileText className="w-5 h-5" />
                            <span>Manage Prompts</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;