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
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200
                transform transition-transform duration-300 ease-in-out z-50
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:h-auto lg:flex-shrink-0
            `}>
                <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h2 className="text-lg font-bold text-gray-800">Competitions</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* --- Competition List --- */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 -mr-1">
                        {competitions.map(competition => {
                            const isSelected = selectedCompetition?.id === competition.id;
                            return (
                                <button
                                    key={competition.id}
                                    onClick={() => setSelectedCompetition(competition)}
                                    className={`group w-full text-left p-3 rounded-xl border transition-all duration-200 ease-in-out ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-blue-100 to-sky-100 border-blue-200 shadow-md'
                                            : 'border-transparent hover:bg-blue-50/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-200/70' : 'bg-gray-100 group-hover:bg-white'}`}>
                                            <Trophy className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                                isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-600'
                                            }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold transition-colors truncate ${
                                                isSelected ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'
                                            }`}>{competition.name}</p>
                                            <p className={`text-sm transition-colors truncate ${
                                                isSelected ? 'text-blue-800/80' : 'text-gray-500'
                                            }`}>{competition.description}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* --- Management Buttons --- */}
                    <div className="space-y-1 pt-4 mt-4">
                        <SidebarButton onClick={() => setIsCompetitionManagerOpen(true)}>
                            <Plus className="w-4 h-4" />
                            <span>Manage Competitions</span>
                        </SidebarButton>

                        <SidebarButton onClick={() => setIsCriteriaManagerOpen(true)}>
                            <Settings className="w-4 h-4" />
                            <span>Manage Criteria</span>
                        </SidebarButton>

                        <SidebarButton onClick={() => setIsPromptsManagerOpen(true)}>
                            <FileText className="w-4 h-4" />
                            <span>Manage Prompts</span>
                        </SidebarButton>
                    </div>
                </div>
            </aside>
        </>
    );
};

const SidebarButton = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 text-left text-sm font-medium text-gray-600 hover:bg-blue-100 hover:text-blue-800 rounded-xl transition-colors duration-150 group"
    >
        {children}
    </button>
);

export default Sidebar;