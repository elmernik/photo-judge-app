import React from 'react';
import { Camera, Upload, History, Menu } from 'lucide-react';

const Header = ({ selectedCompetition, view, onSetView, onMenuClick }) => {
  return (
    // FROM: bg-white/80 border-b
    // TO: Using the same background as the sidebar for consistency, and a more subtle border.
    <header className="relative z-20 bg-slate-50/70 backdrop-blur-xl border-b border-slate-900/5">
        <div className="container mx-auto px-6 py-4"> {/* Reduced vertical padding */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    {/* Let's make the icon a little smaller and sleeker */}
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-md">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        {/* FROM: text-4xl font-bold */}
                        {/* TO: Reduced size for a cleaner look */}
                        <h1 className="text-2xl font-bold text-slate-800">
                            {selectedCompetition ? selectedCompetition.name : 'Photo Judge AI'}
                        </h1>
                        <p className="text-slate-500">
                            {selectedCompetition ? selectedCompetition.description : 'Select a competition to begin'}
                        </p>
                    </div>
                </div>

                {/* --- Modern View Switcher --- */}
                <div className="relative flex items-center gap-2 rounded-full bg-slate-200/70 p-1.5">
                    {/* The "sliding pill" that indicates the active view */}
                    <div className={`
                        absolute top-1.5 left-1.5 h-[calc(100%-0.75rem)] w-[calc(50%-0.375rem)]
                        rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out
                        ${view === 'history' ? 'translate-x-[calc(100%-0.125rem)]' : 'translate-x-0'}
                    `}/>
                    
                    <button
                        onClick={() => onSetView('upload')}
                        // Use z-10 to ensure text is above the sliding pill
                        className={`relative z-10 px-4 py-1.5 font-semibold rounded-full flex items-center gap-2 transition-colors duration-300 ${
                            view === 'upload' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Upload className="w-4 h-4"/>
                        <span>Upload</span>
                    </button>
                    
                    <button
                        onClick={() => onSetView('history')}
                        className={`relative z-10 px-4 py-1.5 font-semibold rounded-full flex items-center gap-2 transition-colors duration-300 ${
                            view === 'history' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <History className="w-4 h-4"/>
                        <span>History</span>
                    </button>
                </div>
            </div>
        </div>
    </header>
  );
};

export default Header;