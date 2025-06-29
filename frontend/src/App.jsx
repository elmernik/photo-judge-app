import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UploadView from './components/UploadView';
import HistoryView from './components/HistoryView';
import CriteriaManager from './components/CriteriaManager';
import CompetitionManager from './components/CompetitionManager';
import PromptManager from './components/PromptManager';
import { Trophy } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  // View state is now derived from the URL
  const view = query.get('view') || 'upload';
  const competitionId = query.get('competition');

  // Modal states
  const [isCriteriaManagerOpen, setIsCriteriaManagerOpen] = useState(false);
  const [isCompetitionManagerOpen, setIsCompetitionManagerOpen] = useState(false);
  const [isPromptsManagerOpen, setIsPromptsManagerOpen] = useState(false);

  // Data states
  const [criteria, setCriteria] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [error, setError] = useState(null);

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch all initial data once
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [criteriaRes, competitionsRes, promptsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/criteria/`),
                fetch(`${API_BASE_URL}/competitions/`),
                fetch(`${API_BASE_URL}/prompts/`)
            ]);
            if (criteriaRes.ok) setCriteria(await criteriaRes.json());
            if (promptsRes.ok) setPrompts(await promptsRes.json());
            if (competitionsRes.ok) {
                const comps = await competitionsRes.json();
                setCompetitions(comps);
                // Set the selected competition based on the URL parameter
                const currentComp = comps.find(c => c.id === parseInt(competitionId)) || comps[0];
                if (currentComp) {
                    setSelectedCompetition(currentComp);
                    // If no competition was in the URL, update the URL to reflect the default
                    if (!competitionId && comps.length > 0) {
                         navigate(`?view=upload&competition=${currentComp.id}`, { replace: true });
                    }
                }
            }
        } catch (e) {
            setError("Failed to load initial application data. " + e.message);
        }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  // Update selectedCompetition when URL changes
  useEffect(() => {
    const currentComp = competitions.find(c => c.id === parseInt(competitionId));
    if (currentComp) {
        setSelectedCompetition(currentComp);
    }
  }, [competitionId, competitions]);


  const handleSetSelectedCompetition = (competition) => {
    navigate(`?view=${view}&competition=${competition.id}`);
    setSidebarOpen(false);
  };

  const handleSetView = (newView) => {
    if (selectedCompetition) {
        navigate(`?view=${newView}&competition=${selectedCompetition.id}`);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex overflow-hidden">
      <Sidebar
        competitions={competitions}
        selectedCompetition={selectedCompetition}
        setSelectedCompetition={handleSetSelectedCompetition}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        setIsCompetitionManagerOpen={setIsCompetitionManagerOpen}
        setIsPromptsManagerOpen={setIsPromptsManagerOpen}
        setIsCriteriaManagerOpen={setIsCriteriaManagerOpen}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Modals */}
        {isCriteriaManagerOpen && <CriteriaManager criteria={criteria} setCriteria={setCriteria} closeModal={() => setIsCriteriaManagerOpen(false)} API_BASE_URL={API_BASE_URL} />}
        {isCompetitionManagerOpen && <CompetitionManager competitions={competitions} setCompetitions={setCompetitions} closeModal={() => setIsCompetitionManagerOpen(false)} API_BASE_URL={API_BASE_URL} />}
        {isPromptsManagerOpen && <PromptManager prompts={prompts} setPrompts={setPrompts} closeModal={() => setIsPromptsManagerOpen(false)} API_BASE_URL={API_BASE_URL} />}

        <Header
            selectedCompetition={selectedCompetition}
            view={view}
            onSetView={handleSetView}
            onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="relative z-10 container mx-auto px-6 py-12 flex-1">
          {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}
          {!selectedCompetition && !error ? (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
              <h2 className="text-2xl font-bold text-gray-700">No Competition Selected</h2>
              <p className="text-gray-500 mt-2">Please select a competition from the sidebar, or create a new one to begin.</p>
            </div>
          ) : view === 'upload' ? (
            <UploadView
              selectedCompetition={selectedCompetition}
              criteria={criteria}
              API_BASE_URL={API_BASE_URL}
              key={selectedCompetition?.id} // Re-mount on competition change to reset state
            />
          ) : ( // view === 'history'
            <HistoryView
              selectedCompetition={selectedCompetition}
              API_BASE_URL={API_BASE_URL}
              key={selectedCompetition?.id} // FIX: Re-mounts component on competition change, triggering a new fetch
            />
          )}
        </main>
      </div>
    </div>
  );
}