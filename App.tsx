
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatWindow from './components/ResponseDisplay';
import { UnifiedInput } from './components/UnifiedInput';
import AdminPanel from './components/AdminPanel';
import AboutModal from './components/AboutModal';
import HtsGovModal from './components/HtsGovModal';
import Login from './components/Login';
import PrintableResult from './components/PrintableResult';
import HistoryModal from './components/HistoryModal';
import RightSidebar from './components/RightSidebar';
import { processQuery, summarizeAnalysis } from './services/geminiService';
import { saveData, loadData, loadString } from './services/dataService';
import { Theme, User, ChatMessage, AiBehavior, PrintData, ClassificationHistoryItem, SubscriptionTier, SubscriptionRequest, UserUsage, UserFeatures, AnalysisData, PasswordResetRequest } from './types';
import { 
    INITIAL_CLASSIFICATION_PROMPT as CLASSIFICATION_PROMPT, 
    INITIAL_LOOKUP_PROMPT as LOOKUP_PROMPT, 
    INITIAL_USERS, 
    INITIAL_SUBSCRIPTION_FEATURES, 
    INITIAL_SUBSCRIPTION_REQUESTS,
    EXPIRED_HTS_CODES as BASE_EXPIRED_CODES
} from './constants';

const WATERMARKS = {
    login: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80",
    classification: "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=2000&q=80",
    lookup: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=2000&q=80",
    admin: "https://images.unsplash.com/photo-1521791136064-7986c2959213?auto=format&fit=crop&w=2000&q=80",
    about: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=80"
};

const App: React.FC = () => {
    // Authentication State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);

    // UI State
    const [theme, setTheme] = useState<Theme>(Theme.Dark);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isHtsGovModalOpen, setIsHtsGovModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'classification' | 'lookup'>('classification');

    // Chat & Query State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Form State
    const [description, setDescription] = useState('');
    const [htsCode, setHtsCode] = useState('');
    const [country, setCountry] = useState('China');
    const [imageFile, setImageFile] = useState<File | null>(null);

    // AI Configuration State
    const [classificationPrompt, setClassificationPrompt] = useState(CLASSIFICATION_PROMPT);
    const [lookupPrompt, setLookupPrompt] = useState(LOOKUP_PROMPT);
    const [expiredHtsCodes, setExpiredHtsCodes] = useState<string[]>([]);
    const [aiBehavior, setAiBehavior] = useState<AiBehavior>('default');
    const [temperature, setTemperature] = useState(0.3);
    const [subscriptionFeatures, setSubscriptionFeatures] = useState(INITIAL_SUBSCRIPTION_FEATURES);

    // Data State
    const [analysis, setAnalysis] = useState<{ messageId: string, data: AnalysisData } | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [printData, setPrintData] = useState<PrintData | null>(null);
    const [activityHistory, setActivityHistory] = useState<ClassificationHistoryItem[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [userUsage, setUserUsage] = useState<Record<string, UserUsage>>({});

    const addLog = useCallback((message: string) => {
        setLogs(prev => [...prev.slice(-100), `${new Date().toISOString()}: ${message}`]);
    }, []);
    
    // Load initial data on mount
    useEffect(() => {
        const loadInitialData = async () => {
            addLog("Initializing TEU Global AI Intelligence Cluster...");
            const savedTheme = await loadData('theme', Theme.Dark);
            setTheme(savedTheme);

            const savedMessages = await loadData<ChatMessage[]>('chatHistory', []);
            if (savedMessages.length > 0) setMessages(savedMessages);
            
            const savedClassificationPrompt = await loadString('classificationPrompt', CLASSIFICATION_PROMPT);
            setClassificationPrompt(savedClassificationPrompt);
            const savedLookupPrompt = await loadString('lookupPrompt', LOOKUP_PROMPT);
            setLookupPrompt(savedLookupPrompt);
            const savedTemperature = await loadData<number>('temperature', 0.3);
            setTemperature(savedTemperature);

            const userAddedExpiredCodes = await loadData<string[]>('expiredHtsCodes', []);
            setExpiredHtsCodes([...new Set([...BASE_EXPIRED_CODES, ...userAddedExpiredCodes])]);
            
            const savedFeatures = await loadData('subscriptionFeatures', INITIAL_SUBSCRIPTION_FEATURES);
            setSubscriptionFeatures(savedFeatures);

            const savedUsers = await loadData<any[]>('allUsers', INITIAL_USERS);
            setAllUsers(savedUsers.map(u => ({ 
                ...u, 
                features: savedFeatures[u.subscription as SubscriptionTier] || INITIAL_SUBSCRIPTION_FEATURES.Free 
            })));

            const savedRequests = await loadData<SubscriptionRequest[]>('subscriptionRequests', INITIAL_SUBSCRIPTION_REQUESTS);
            setSubscriptionRequests(savedRequests);

            const savedActivityHistory = await loadData<ClassificationHistoryItem[]>('activityHistory', []);
            setActivityHistory(savedActivityHistory);

            const savedUsage = await loadData<Record<string, UserUsage>>('userUsage', {});
            setUserUsage(savedUsage);
        };
        loadInitialData();
    }, [addLog]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === Theme.Dark);
        saveData('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        if(messages.length > 1) saveData('chatHistory', messages);
    }, [messages]);
    
    // Auto-sync users features when subscription tiers change
    useEffect(() => {
        setAllUsers(prev => prev.map(u => ({
            ...u,
            features: subscriptionFeatures[u.subscription as SubscriptionTier] || INITIAL_SUBSCRIPTION_FEATURES.Free
        })));
        if (currentUser) {
            setCurrentUser(prev => prev ? ({
                ...prev,
                features: subscriptionFeatures[prev.subscription] || INITIAL_SUBSCRIPTION_FEATURES.Free
            }) : null);
        }
    }, [subscriptionFeatures]);

    useEffect(() => {
        saveData('expiredHtsCodes', expiredHtsCodes.filter(c => !BASE_EXPIRED_CODES.includes(c)));
        if (allUsers.length > 0) saveData('allUsers', allUsers);
        saveData('subscriptionRequests', subscriptionRequests);
        saveData('activityHistory', activityHistory);
        saveData('userUsage', userUsage);
        saveData('subscriptionFeatures', subscriptionFeatures);
    }, [expiredHtsCodes, allUsers, subscriptionRequests, activityHistory, userUsage, subscriptionFeatures]);

    const toggleTheme = () => setTheme(prev => prev === Theme.Dark ? Theme.Light : Theme.Dark);

    const handleNewSession = () => {
        setMessages([{ id: 'init', text: "Systems online. TEU Global AI Assistant ready. Provide product details or an HTS code.", sender: 'ai' }]);
        setAnalysis(null); 
        setSummary(null); 
        setError(null);
        setIsRightSidebarOpen(false);
    };

    const handlePurgeMemory = useCallback(() => {
        if (window.confirm('CRITICAL: Purge all session data and clear memory cache? This action is irreversible.')) {
            setMessages([{ id: 'init', text: "Memory purged. Neural buffers cleared. Awaiting new input.", sender: 'ai' }]);
            setAnalysis(null);
            setSummary(null);
            setError(null);
            setIsRightSidebarOpen(false);
            
            // Clear persistent data
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('activityHistory');
            setActivityHistory([]);
            
            addLog("System memory purge completed by user.");
        }
    }, [addLog]);
    
    const handleLogout = () => {
        addLog(`User ${currentUser?.email} disconnected.`);
        setCurrentUser(null);
    };

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        addLog(`User ${user.email} authenticated.`);
    };

    const handleSubscriptionRequest = (email: string, password: string, requestedTier: SubscriptionTier) => {
        const newRequest: SubscriptionRequest = {
            id: Date.now().toString(),
            email,
            password,
            requestedTier,
            status: 'pending'
        };
        setSubscriptionRequests(prev => [...prev, newRequest]);
        addLog(`New subscription request from ${email} for ${requestedTier} tier.`);
    };

    const handleApproveRequest = (requestId: string) => {
        const req = subscriptionRequests.find(r => r.id === requestId);
        if (!req) return;

        const newUser = {
            id: Date.now().toString(),
            email: req.email,
            password: req.password,
            role: 'user',
            subscription: req.requestedTier,
            features: subscriptionFeatures[req.requestedTier]
        };

        setAllUsers(prev => [...prev, newUser]);
        setSubscriptionRequests(prev => prev.filter(r => r.id !== requestId));
        addLog(`Approved request for ${req.email}. New user created.`);
    };

    const handleDenyRequest = (requestId: string) => {
        setSubscriptionRequests(prev => prev.filter(r => r.id !== requestId));
        addLog(`Denied subscription request ${requestId}.`);
    };

    const handleAddUser = (userData: any, password: string) => {
        const newUser = {
            ...userData,
            id: Date.now().toString(),
            password,
            features: subscriptionFeatures[userData.subscription as SubscriptionTier]
        };
        setAllUsers(prev => [...prev, newUser]);
        addLog(`Admin added new user: ${userData.email}`);
    };

    const handleUpdateUser = (userData: any, password?: string) => {
        setAllUsers(prev => prev.map(u => {
            if (u.id === userData.id) {
                const updated = { ...u, ...userData };
                if (password) updated.password = password;
                updated.features = subscriptionFeatures[userData.subscription as SubscriptionTier];
                return updated;
            }
            return u;
        }));
        addLog(`Admin updated user: ${userData.email}`);
    };

    const handleDeleteUser = (userId: string) => {
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        addLog(`Admin deleted user ID: ${userId}`);
    };

    const addExpiredHtsCode = useCallback((code: string) => {
        const cleanCode = code.trim();
        if (cleanCode && !expiredHtsCodes.includes(cleanCode)) {
            setExpiredHtsCodes(prev => [...prev, cleanCode]);
            addLog(`HTS Flagged as Expired: ${cleanCode}`);
            return true;
        }
        return false;
    }, [expiredHtsCodes, addLog]);

    const getTodaysUserUsage = useCallback(() => {
        if (!currentUser) return null;
        const today = new Date().toISOString().split('T')[0];
        const usage = userUsage[currentUser.id];
        if (usage && usage.date === today) return usage;
        return { date: today, textQueries: 0, imageQueries: 0 };
    }, [currentUser, userUsage]);

    const performQuery = useCallback(async (
        query: string,
        ctry: string,
        img: File | null,
        viewType: 'classification' | 'lookup'
    ) => {
        setIsLoading(true); 
        setError(null); 
        setAnalysis(null); 
        setSummary(null);
        setIsRightSidebarOpen(true); // Automatically show right sidebar on query start

        abortControllerRef.current = new AbortController();
        const aiMessageId = Date.now().toString();
        setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);
        
        let imageData: { mimeType: string; data: string } | null = null;
        if (img) {
            imageData = {
                mimeType: img.type,
                data: await new Promise(r => {
                    const fr = new FileReader();
                    fr.onload = () => r((fr.result as string).split(',')[1]);
                    fr.readAsDataURL(img);
                })
            };
        }

        try {
            const finalResponse = await processQuery(
                query, ctry, imageData, viewType,
                classificationPrompt, lookupPrompt, expiredHtsCodes,
                aiBehavior, temperature,
                (chunk) => {
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: m.text + chunk } : m));
                },
                addLog,
                abortControllerRef.current.signal
            );
            
            const startTag = '##ANALYSIS_DATA##';
            const endTag = '##/ANALYSIS_DATA##';
            const startIndex = finalResponse.indexOf(startTag);
            const endIndex = finalResponse.indexOf(endTag);

            if (startIndex !== -1 && endIndex !== -1) {
                const json = finalResponse.substring(startIndex + startTag.length, endIndex).trim();
                const visibleText = finalResponse.substring(0, startIndex).trim();
                try {
                    const parsed = JSON.parse(json);
                    setAnalysis({ messageId: aiMessageId, data: parsed });
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: visibleText } : m));
                    
                    const historyItem: ClassificationHistoryItem = {
                        id: Date.now().toString(),
                        query, timestamp: new Date().toISOString(),
                        userId: currentUser?.id || 'unknown', 
                        userEmail: currentUser?.email || 'unknown', 
                        viewType
                    };
                    setActivityHistory(prev => [historyItem, ...prev]);
                } catch (e) { addLog("JSON parse failed."); }
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message);
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: `Error: ${e.message}` } : m));
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, aiBehavior, temperature, classificationPrompt, lookupPrompt, expiredHtsCodes, addLog]);

    const handleSmartSummary = async () => {
        if (!analysis || isSummarizing) return;
        setIsSummarizing(true);
        try {
            const sum = await summarizeAnalysis(analysis.data);
            setSummary(sum);
        } catch (e) { addLog("Summary failed."); }
        finally { setIsSummarizing(false); }
    };

    const handleClassificationSubmit = (desc: string, ctry: string, img: File | null) => {
        if (!currentUser) return;
        const usage = getTodaysUserUsage()!;
        const limits = currentUser.features.queryLimits;
        if (img ? usage.imageQueries >= limits.image : usage.textQueries >= limits.text) {
            setError("Quota exceeded."); return;
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), text: img ? `[Image Analysis] ${desc}` : desc, sender: 'user' }]);
        const newUsage = { ...usage };
        img ? newUsage.imageQueries++ : newUsage.textQueries++;
        setUserUsage(prev => ({ ...prev, [currentUser.id]: newUsage }));
        performQuery(desc, ctry, img, 'classification');
    };

    const handleLookupSubmit = (code: string) => {
        if (!currentUser) return;
        const usage = getTodaysUserUsage()!;
        if (usage.textQueries >= currentUser.features.queryLimits.text) {
            setError("Quota exceeded."); return;
        }
        setMessages(prev => [...prev, { id: Date.now().toString(), text: `HTS Lookup: ${code}`, sender: 'user' }]);
        setUserUsage(prev => ({ ...prev, [currentUser.id]: { ...usage, textQueries: usage.textQueries + 1 } }));
        performQuery(code, country, null, 'lookup');
    };

    if (!currentUser) {
        return <Login 
            onLogin={handleLogin} 
            allUsers={allUsers} 
            onSubscriptionRequest={handleSubscriptionRequest} 
            onInitiatePasswordReset={async () => null} 
            onFinalizePasswordReset={() => false} 
            watermark={WATERMARKS.login}
            theme={theme}
            toggleTheme={toggleTheme}
        />;
    }

    const todaysUsage = getTodaysUserUsage();
    const currentLimits = currentUser?.features?.queryLimits || INITIAL_SUBSCRIPTION_FEATURES.Free.queryLimits;

    return (
        <div className={`flex h-screen font-sans bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary ${theme}`}>
            <Sidebar
                isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
                openAdminPanel={() => setIsAdminPanelOpen(true)}
                openAboutModal={() => setIsAboutModalOpen(true)}
                openHistoryModal={() => setIsHistoryModalOpen(true)}
                openHtsGovModal={() => setIsHtsGovModalOpen(true)}
                onNewSession={handleNewSession}
                currentView={currentView} setCurrentView={setCurrentView}
                clearAllHistory={handlePurgeMemory}
                activityHistory={activityHistory}
                currentUser={currentUser} />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Dynamic Watermark for Main Area */}
                <div 
                    className="watermark-bg" 
                    style={{ backgroundImage: `url(${currentView === 'classification' ? WATERMARKS.classification : WATERMARKS.lookup})` }}
                />

                <Header 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    currentUser={currentUser} 
                    onLogout={handleLogout} 
                    usage={todaysUsage}
                    limits={currentLimits}
                />
                
                <div className="flex-1 flex overflow-hidden z-10 relative">
                    <main className="flex-1 flex flex-col p-6 overflow-hidden bg-zinc-50/30 dark:bg-[#0B1120]/30 relative">
                        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                            <ChatWindow
                                messages={messages}
                                onAddExpiredHts={addExpiredHtsCode}
                                setPrintData={setPrintData}
                                analysis={analysis}
                                expiredHtsCodes={expiredHtsCodes}
                                isLoading={isLoading}
                            />
                        </div>
                        <div className="mt-6 flex-shrink-0">
                            <UnifiedInput
                                currentView={currentView} setCurrentView={setCurrentView}
                                onClassificationSubmit={handleClassificationSubmit}
                                onLookupSubmit={handleLookupSubmit}
                                isLoading={isLoading} error={error}
                                description={description} onDescriptionChange={setDescription}
                                htsCode={htsCode} onHtsCodeChange={setHtsCode}
                                country={country} onCountryChange={setCountry}
                                onCancel={() => abortControllerRef.current?.abort()}
                                expiredHtsCodes={expiredHtsCodes}
                                currentUser={currentUser} usage={todaysUsage}
                                limits={currentLimits}
                            />
                        </div>
                    </main>
                    
                    <RightSidebar 
                        isOpen={isRightSidebarOpen}
                        onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                        analysisData={analysis?.data??null} 
                        onSummarize={handleSmartSummary}
                        isSummarizing={isSummarizing}
                        summary={summary}
                    />

                    {/* Powered By Footer Attribution - Fixed Bottom Right of Main Content */}
                    <div className="absolute bottom-2 right-4 z-50 text-[10px] font-black uppercase tracking-widest pointer-events-none transition-all duration-300">
                        <div className="px-3 py-1.5 rounded-lg bg-white/40 dark:bg-black/20 backdrop-blur-md border border-accent/20 text-zinc-500 dark:text-zinc-400 shadow-sm">
                            Powered By Junaid Abbasi
                        </div>
                    </div>
                </div>
            </div>

            <AdminPanel
                isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)}
                classificationPrompt={classificationPrompt} setClassificationPrompt={setClassificationPrompt}
                lookupPrompt={lookupPrompt} setLookupPrompt={setLookupPrompt}
                expiredHtsCodes={expiredHtsCodes} setExpiredHtsCodes={setExpiredHtsCodes}
                aiBehavior={aiBehavior} setAiBehavior={setAiBehavior}
                temperature={temperature} setTemperature={setTemperature}
                logs={logs} clearLogs={() => setLogs([])}
                allUsers={allUsers.map(({password, ...u}) => u)} 
                onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser}
                subscriptionRequests={subscriptionRequests} onApproveRequest={handleApproveRequest} onDenyRequest={handleDenyRequest}
                activityHistory={activityHistory} addLog={addLog}
                subscriptionFeatures={subscriptionFeatures} onUpdateSubscriptionFeatures={setSubscriptionFeatures}
                watermark={WATERMARKS.admin}
            />
            {printData && <PrintableResult data={printData} />}
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} watermark={WATERMARKS.about} />
            <HtsGovModal isOpen={isHtsGovModalOpen} onClose={() => setIsHtsGovModalOpen(false)} />
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={activityHistory.filter(h => h.userId === currentUser.id)} onClearHistory={() => {}} onRerunQuery={(q, t) => {
                if (t === 'classification') handleClassificationSubmit(q, country, null);
                else handleLookupSubmit(q);
            }} />
        </div>
    );
};

export default App;
