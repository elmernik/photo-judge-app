import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UploadView from './components/UploadView';
import HistoryView from './components/HistoryView';
import { CompetitionManager, CriteriaManager, PromptManager } from './components/Modals';
import { Trophy, AlertTriangle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);

    const view = query.get('view') || 'upload';
    const competitionId = query.get('competition');

    const [isCriteriaManagerOpen, setIsCriteriaManagerOpen] = useState(false);
    const [isCompetitionManagerOpen, setIsCompetitionManagerOpen] = useState(false);
    const [isPromptsManagerOpen, setIsPromptsManagerOpen] = useState(false);

    const [criteria, setCriteria] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [error, setError] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                    const currentComp = comps.find(c => c.id === parseInt(competitionId)) || comps[0];
                    if (currentComp) {
                        setSelectedCompetition(currentComp);
                        if (!competitionId && comps.length > 0) {
                             navigate(`?view=upload&competition=${currentComp.id}`, { replace: true });
                        }
                    }
                }
            } catch (e) {
                setError("Failed to load initial application data. Please check the server connection. " + e.message);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        <div className="h-screen bg-slate-50 flex overflow-hidden">
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
                    {error && (
                        <div className="bg-red-100 border border-red-300 rounded-xl p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-red-200 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-700" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-900 mb-1">Application Error</h4>
                                    <div className="text-red-800">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {!selectedCompetition && !error ? (
                        <div className="text-center py-20 px-8 bg-white border border-gray-200 rounded-xl shadow-lg">
                             <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy className="w-10 h-10 text-blue-500"/>
                            </div>
                            <h2 className="text-2xl font-bold text-blue-900">Welcome to Photo Judge AI</h2>
                            <p className="text-blue-800 mt-2">Please select a competition from the sidebar, or create a new one to begin.</p>
                        </div>
                    ) : view === 'upload' ? (
                        <UploadView
                            selectedCompetition={selectedCompetition}
                            criteria={criteria}
                            API_BASE_URL={API_BASE_URL}
                            key={selectedCompetition?.id}
                        />
                    ) : (
                        <HistoryView
                            selectedCompetition={selectedCompetition}
                            API_BASE_URL={API_BASE_URL}
                            key={selectedCompetition?.id}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}