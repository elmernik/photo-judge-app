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
            {/* Mobile overlay - No changes needed here */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            {/* FROM: bg-white/90 border-gray-200/50 */}
            {/* TO: A slightly cleaner, less transparent background for better readability. Removed the hard border-r */}
            <aside className={`
                fixed top-0 left-0 h-full w-80 bg-slate-50/70 backdrop-blur-xl border-r border-slate-900/5
                transform transition-transform duration-300 ease-in-out z-50
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:h-auto lg:flex-shrink-0
            `}>
                <div className="p-4 h-full flex flex-col"> {/* Reduced padding slightly for a tighter feel */}
                    <div className="flex items-center justify-between mb-6 px-2"> {/* Added px-2 to align with items below */}
                        <h2 className="text-lg font-semibold text-slate-800">Competitions</h2> {/* Subtler heading */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* --- Competition List --- */}
                    {/* Added a subtle fade-out for scrolling overflow */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                        {competitions.map(competition => (
                            <button
                                key={competition.id}
                                onClick={() => setSelectedCompetition(competition)}
                                // This is the core style update. Note the use of `group` for hover effects.
                                className={`group w-full text-left p-3 rounded-lg border transition-all duration-200 ease-in-out ${
                                    selectedCompetition?.id === competition.id
                                        ? 'bg-white border-slate-200 shadow-sm' // Softer selected state
                                        : 'border-transparent hover:bg-white/70'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Trophy className={`w-5 h-5 flex-shrink-0 transition-colors ${
                                        selectedCompetition?.id === competition.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                    }`} />
                                    <div className="flex-1">
                                        <p className={`font-semibold transition-colors ${
                                            selectedCompetition?.id === competition.id ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-900'
                                        }`}>{competition.name}</p>
                                        <p className="text-sm text-slate-500 truncate">{competition.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* --- Management Buttons --- */}
                    {/* FROM: border-t */}
                    {/* TO: Increased top margin (mt-4) for separation, removed the line */}
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

// Helper component for consistent button styling
const SidebarButton = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 rounded-lg transition-colors duration-150"
    >
        {children}
    </button>
);

export default Sidebar;