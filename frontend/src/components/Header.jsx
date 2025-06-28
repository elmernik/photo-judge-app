import React from 'react';
import { Camera, Upload, History, Menu } from 'lucide-react';

const Header = ({ selectedCompetition, view, onSetView, onMenuClick }) => {
  return (
    <header className="relative z-20 bg-white/80 backdrop-blur-xl border-b">
      <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <button
                      onClick={onMenuClick}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                      <Menu className="w-6 h-6" />
                  </button>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg"><Camera className="w-8 h-8 text-white" /></div>
                  <div>
                      <h1 className="text-4xl font-bold">{selectedCompetition ? selectedCompetition.name : 'Photo Judge AI'}</h1>
                      <p className="text-gray-600 text-lg">{selectedCompetition ? selectedCompetition.description : 'Select a competition to begin'}</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <button onClick={() => onSetView('upload')} className={`px-5 py-2.5 font-semibold rounded-xl flex items-center gap-2 transition-colors ${view === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}><Upload className="w-4 h-4"/>Upload</button>
                  <button onClick={() => onSetView('history')} className={`px-5 py-2.5 font-semibold rounded-xl flex items-center gap-2 transition-colors ${view === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}><History className="w-4 h-4"/>History</button>
              </div>
          </div>
      </div>
    </header>
  );
};

export default Header;