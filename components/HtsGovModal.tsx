import React, { useState, useEffect } from 'react';
import { 
    XCircleIcon, SearchIcon, DatabaseIcon, InfoIcon, 
    ShieldExclamationIcon, Building2Icon, ExternalLinkIcon, 
    GlobeAltIcon, SparklesIcon, ChevronDownIcon,
    VerifiedIcon, GavelIcon, ClipboardDocumentListIcon,
    TerminalIcon, CalculatorIcon, ChartBarIcon, TrendingUpIcon
} from './icons/Icons';
import usitcService, { TariffDetailsWrapper, TariffDetailsDTO } from '../services/usitcService';

interface HtsGovModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecursiveSection: React.FC<{ section: TariffDetailsDTO; depth: number }> = ({ section, depth }) => (
  <div className={`pl-${Math.min(depth * 4, 12)} border-l-2 border-primary-blue/10 dark:border-accent/10 ml-2 mt-4 py-1 group/section transition-all`}>
    <div className="flex flex-col">
      <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-accent mt-1.5 opacity-30 group-hover/section:opacity-100 transition-opacity"></div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover/section:text-primary-blue transition-colors">
            {section.value}
          </span>
      </div>
      {section.values && section.values.length > 0 && (
         <div className="flex flex-wrap gap-2 mt-3 ml-5">
            {section.values.map((v, i) => (
              <span key={i} className="px-2.5 py-1 bg-blue-50/50 dark:bg-slate-800/80 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-black rounded-lg border border-blue-100 dark:border-slate-700 shadow-sm">
                {v}
              </span>
            ))}
         </div>
      )}
    </div>
    {section.children && section.children.map((child) => (
      <RecursiveSection key={child.id || Math.random()} section={child} depth={depth + 1} />
    ))}
  </div>
);

const HtsGovModal: React.FC<HtsGovModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'lookup' | 'trade'>('lookup');
  const [year, setYear] = useState('2025');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<TariffDetailsWrapper | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [tradeResults, setTradeResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
        setLookupResult(null);
        setSearchResults([]);
        setTradeResults([]);
        setError(null);
        setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
        if (activeTab === 'search') {
            const res = await usitcService.searchHtsCodes(query);
            setSearchResults(res.data || []);
        } else if (activeTab === 'lookup') {
            const res = await usitcService.fetchCurrentTariffDetails(year, query);
            setLookupResult(res);
        } else if (activeTab === 'trade') {
            const res = await usitcService.queryTradeStats(query);
            setTradeResults(res.data || []);
        }
    } catch (err: any) {
        setError(err.message || 'USITC Handshake Protocol Failed.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleTabChange = (tab: 'search' | 'lookup' | 'trade') => {
      setActiveTab(tab);
      setError(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center flex-shrink-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-primary-blue dark:bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <DatabaseIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">USITC Intelligence Portal</h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-200 dark:border-blue-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    Official Secure Terminal
                  </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 opacity-70">Direct Dataweb v2.0 & HTS v1.0 Link</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-all hover:scale-110 p-2">
            <XCircleIcon className="w-10 h-10" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="bg-slate-50 dark:bg-slate-950 px-10 pt-4 flex gap-4 border-b border-slate-100 dark:border-slate-800">
            {[
                { id: 'search', label: 'HTS Search', icon: <SearchIcon className="w-4 h-4"/> },
                { id: 'lookup', label: 'Tariff Lookup', icon: <DatabaseIcon className="w-4 h-4"/> },
                { id: 'trade', label: 'Trade Analytics', icon: <ChartBarIcon className="w-4 h-4"/> }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`flex items-center gap-2 px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id ? 'border-primary-blue text-primary-blue bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
          <div className="p-10 pb-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-soft">
                <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-6">
                  <div className="flex-1 min-w-[320px]">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em] pl-1">
                        {activeTab === 'search' ? 'Keyword or Partial Code' : activeTab === 'trade' ? 'Analytics Target (HTS)' : 'Subheading / Heading (HTS8)'}
                    </label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={activeTab === 'search' ? "Ex: 'Electric vehicles' or '8517'" : "Ex: 8517.12.00"}
                        className="w-full p-5 pl-14 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary-blue outline-none transition-all text-base font-mono font-bold shadow-inner"
                      />
                      <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary-blue" />
                    </div>
                  </div>
                  {activeTab === 'lookup' && (
                    <div className="w-44">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em] pl-1">Data Year</label>
                        <select 
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-black shadow-inner outline-none"
                        >
                            <option value="2025">2025 Current</option>
                            <option value="2024">2024 Archive</option>
                        </select>
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-[64px] px-12 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Negotiating...</span>
                        </>
                    ) : (
                        <>
                            <GlobeAltIcon className="w-4 h-4" />
                            <span>Run Verification</span>
                        </>
                    )}
                  </button>
                </form>
              </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col px-10 pb-10">
            {isLoading && (
               <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
                  <LoadingShip />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Pinging USITC Gateways...</p>
               </div>
            )}

            {!isLoading && !lookupResult && searchResults.length === 0 && tradeResults.length === 0 && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in opacity-50">
                 <div className="p-10 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-white dark:border-slate-800">
                    <TerminalIcon className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                 </div>
                 <div className="max-w-md">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Awaiting Authorized Query</h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Verified connectivity to Dataweb established. Please provide a target classification or keyword.</p>
                 </div>
              </div>
            )}

            {error && (
              <div className="flex-1 flex items-center justify-center animate-fade-in">
                <div className="max-w-xl w-full p-10 bg-red-50 dark:bg-red-900/10 border-2 border-dashed border-red-500/50 rounded-[3rem] flex flex-col items-center text-center gap-6">
                    <ShieldExclamationIcon className="w-14 h-14 text-red-500" />
                    <div>
                       <h4 className="text-lg font-black text-red-600 uppercase tracking-[0.1em]">Gateway Exception</h4>
                       <p className="text-sm text-red-700 dark:text-red-400 font-bold mt-2">{error}</p>
                       <button onClick={handleSearch} className="mt-8 px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Retry Connection</button>
                    </div>
                </div>
              </div>
            )}

            {/* View: Search Results */}
            {activeTab === 'search' && searchResults.length > 0 && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4 animate-slide-up">
                    <div className="flex justify-between items-center px-4 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Found: {searchResults.length} Match(es)</span>
                    </div>
                    {searchResults.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary-blue transition-all group cursor-pointer" onClick={() => { setQuery(item.htsno); setActiveTab('lookup'); handleSearch(new Event('submit') as any); }}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xl font-mono font-black text-primary-blue group-hover:scale-105 transition-transform">{item.htsno}</span>
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-black uppercase rounded-full">Classification Match</span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* View: Lookup Results */}
            {activeTab === 'lookup' && lookupResult && (
              <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
                <div className="flex flex-wrap justify-between items-start gap-6 mb-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 py-4 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl px-4">
                   <div className="flex-1 min-w-[440px]">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">HTS {query.replace(/\D/g, '')}</span>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-2 ${lookupResult.sourceMode.includes('Official') ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                            {lookupResult.sourceMode.includes('Official') ? <VerifiedIcon className="w-4 h-4"/> : <SparklesIcon className="w-4 h-4" />}
                            {lookupResult.sourceMode} Verified
                        </div>
                      </div>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-4 border-primary-blue pl-8 py-2 bg-white/40 dark:bg-slate-800/40 rounded-r-2xl">{lookupResult.desc}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 pb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                                <DatabaseIcon className="w-4 h-4"/> Hierarchical Taxonomy
                            </h4>
                            {lookupResult.sections?.map((s) => (
                                <div key={s.id || Math.random()} className="bg-white dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft mb-4">
                                    <RecursiveSection section={s} depth={0} />
                                </div>
                            ))}
                        </div>
                        <div>
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                                <GavelIcon className="w-4 h-4"/> Legal Trade Remedies
                            </h4>
                            {lookupResult.investigations && lookupResult.investigations.length > 0 ? (
                                lookupResult.investigations.map((inv) => (
                                    <div key={inv.investigationId || Math.random()} className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 mb-4 shadow-soft">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase text-blue-600">Inv #{inv.investigationNumber}</span>
                                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{inv.phase}</span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white leading-snug">{inv.investigationTitle}</h4>
                                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between text-[10px] font-mono text-slate-400">
                                            <span>CASE_ID: {inv.caseId}</span>
                                            <span>HTS10: {inv.hts10}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                    <VerifiedIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Active Investigations</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* View: Trade Analytics */}
            {activeTab === 'trade' && tradeResults.length > 0 && (
                <div className="flex-1 flex flex-col overflow-hidden animate-slide-up">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 px-4 flex items-center gap-3">
                        <TrendingUpIcon className="w-8 h-8 text-primary-blue" />
                        HTS Trade Momentum Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-4">
                        {tradeResults.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-md flex flex-col relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Fiscal Year {item.year}</span>
                                <h4 className="text-4xl font-black text-primary-blue tracking-tighter mb-4">${(item.value / 1000000).toFixed(1)}M</h4>
                                <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800">
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                        <GlobeAltIcon className="w-4 h-4" />
                                        Primary Partner: <span className="text-slate-800 dark:text-slate-200">{item.partner || 'Global Pool'}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800/50">
                        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed italic">
                            System Insight: Historical volume trends derived from neural synthesis of Dataweb transaction indices.
                        </p>
                    </div>
                </div>
            )}
          </div>
        </main>

        <footer className="px-10 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center flex-shrink-0 relative z-20">
            <div className="flex gap-8">
               <a href={`https://hts.usitc.gov/?query=${query.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-blue hover:underline">
                 <ExternalLinkIcon className="w-4 h-4" /> USITC Repository
               </a>
               <a href="https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=HTS" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-blue hover:underline">
                 <GlobeAltIcon className="w-4 h-4" /> Federal Feed
               </a>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Gateway Protocol v2.85</p>
                {lookupResult && <p className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase">Synchronized: {new Date(lookupResult.timestamp).toLocaleTimeString()}</p>}
            </div>
        </footer>
      </div>
    </div>
  );
};

const LoadingShip: React.FC = () => (
    <div className="w-full max-w-sm">
      <div className="relative h-2 bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 h-8 w-12 flex items-center justify-center animate-ship-travel">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600 dark:text-accent">
                <path d="M22 17.5L20.25 15.75L18.5 17.5V14H15V17.5L13.25 15.75L11.5 17.5V13H8V17.5L6.25 15.75L4.5 17.5V11H2V19.5C2 20.33 2.67 21 3.5 21H20.5C21.33 21 22 20.33 22 19.5V17.5Z" />
             </svg>
        </div>
      </div>
      <style>{`
        @keyframes ship-travel {
            0% { transform: translate(-100%, -50%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translate(500%, -50%); opacity: 0; }
        }
        .animate-ship-travel {
            animation: ship-travel 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
    `}</style>
    </div>
);

export default HtsGovModal;
