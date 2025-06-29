import React from 'react';
import { Camera, Upload, History, Menu } from 'lucide-react';

const Header = ({ selectedCompetition, view, onSetView, onMenuClick }) => {
  return (
    <header className="relative z-20 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl shadow-lg">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedCompetition ? selectedCompetition.name : 'Photo Judge AI'}
                        </h1>
                        <p className="text-gray-600">
                            {selectedCompetition ? selectedCompetition.description : 'Select a competition to begin'}
                        </p>
                    </div>
                </div>

                {/* --- Themed View Switcher --- */}
                <div className="relative flex items-center gap-1 rounded-full bg-gray-100 p-1.5 shadow-inner">
                    {/* The "sliding pill" with our primary gradient */}
                    <div
                        className={`
                            absolute top-[0.375rem] left-[0.375rem] h-[calc(100%-0.75rem)] w-[calc(50%-0.1875rem)]
                            rounded-full bg-gradient-to-r from-blue-600 to-sky-600 shadow-md transition-transform duration-300 ease-in-out
                            ${view === 'history' ? 'translate-x-[calc(100%+0.25rem)]' : 'translate-x-0'}
                        `}
                    />
                    
                    <button
                        onClick={() => onSetView('upload')}
                        className={`relative z-10 px-4 py-1.5 font-semibold rounded-full flex items-center gap-2 transition-colors duration-300 ${
                            view === 'upload' ? 'text-white' : 'text-gray-600 hover:text-blue-700'
                        }`}
                    >
                        <Upload className="w-4 h-4"/>
                        <span>Upload</span>
                    </button>
                    
                    <button
                        onClick={() => onSetView('history')}
                        className={`relative z-10 px-4 py-1.5 font-semibold rounded-full flex items-center gap-2 transition-colors duration-300 ${
                            view === 'history' ? 'text-white' : 'text-gray-600 hover:text-blue-700'
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