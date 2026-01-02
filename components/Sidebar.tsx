
import React, { useState, useEffect } from 'react';
import { 
    CogIcon,
    VerifiedIcon,
    TrashIcon,
    TeuGlobalLogo,
    QuestionIcon,
    MemoryChipIcon,
    DollarIcon,
    InfoIcon,
    ExternalLinkIcon,
    SearchIcon,
    MenuIcon,
    ShieldExclamationIcon,
    DatabaseIcon,
    HistoryIcon,
    XIcon,
    HtsCodeIcon,
    RestartIcon,
    GlobeAltIcon
} from './icons/Icons';
import { ClassificationHistoryItem, User } from '../types';

type View = 'classification' | 'lookup';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  openAdminPanel: () => void;
  openAboutModal: () => void;
  openHistoryModal: () => void;
  openHtsGovModal: () => void; // New prop
  onNewSession: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  clearAllHistory: () => void;
  activityHistory: ClassificationHistoryItem[];
  currentUser: User;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; tooltip: string; active?: boolean; onClick: () => void; }> = ({ icon, label, tooltip, active, onClick }) => (
    <div className="relative group w-full">
        <button 
            onClick={onClick} 
            className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 w-full text-left border-2 ${
                active 
                ? 'bg-primary-blue/70 dark:bg-accent/70 text-white shadow-lg border-accent' 
                : 'text-light-text-secondary dark:text-dark-text-secondary bg-transparent border-transparent hover-themed'
            }`}
        >
            <div className={`${active ? 'text-white' : 'text-zinc-400 group-hover:text-inherit'}`}>{icon}</div>
            <span>{label}</span>
        </button>
        <span className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-neutral-900 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 z-20 shadow-xl">
            {tooltip}
        </span>
    </div>
);

const DutyRatesPanel: React.FC = () => (
    <div className="bg-light-bg/30 dark:bg-dark-bg/30 backdrop-blur-sm p-4 rounded-xl border border-accent dark:border-dark-border text-[10px] shadow-soft hover-themed transition-all group">
        <div className="flex items-start gap-2 mb-3">
            <div className="p-1.5 bg-green-500/10 rounded-lg"><DollarIcon className="w-5 h-5 text-green-500" /></div>
            <div>
                <h3 className="font-black text-xs uppercase tracking-widest text-light-text-primary dark:text-dark-text-primary">Tariff Matrix</h3>
                <p className="text-zinc-400 font-bold">Protocol Guide</p>
            </div>
        </div>
        <ul className="space-y-3 pl-1 font-bold">
            <li className="flex items-start gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1 flex-shrink-0"></div>
                <span><strong>General Rate:</strong> Standard MFN tariff for non-treaty nations.</span>
            </li>
            <li className="flex items-start gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-blue dark:bg-accent mt-1 flex-shrink-0"></div>
                <span><strong>Special Rate:</strong> USMCA/FTA preferential programs.</span>
            </li>
            <li className="flex items-start gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                <span><strong>Column 2 Rate:</strong> Maximum punitive duties (Sanctions).</span>
            </li>
        </ul>
        <a href="https://www.cbp.gov" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 mt-4 py-2 px-3 rounded-lg bg-zinc-100/30 dark:bg-dark-surface/30 border border-light-border dark:border-dark-border transition-all hover-themed font-black uppercase tracking-widest text-[9px]">
            <ExternalLinkIcon className="w-3 h-3" />
            CBP.GOV Terminal
        </a>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, setIsOpen, openAdminPanel, openAboutModal, openHistoryModal, openHtsGovModal, onNewSession, currentView, setCurrentView, clearAllHistory,
    activityHistory, currentUser
}) => {
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  useEffect(() => {
    const syncTimer = setInterval(() => setLastSyncTime(new Date()), 60000);
    return () => clearInterval(syncTimer);
  }, []);

  const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return 'ONLINE';
    return `${minutes}M AGO`;
  };

  return (
    <>
    <button 
        onClick={() => setIsOpen(!isOpen)} 
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="sidebar-nav"
        className="relative group lg:hidden fixed top-5 left-4 z-40 p-2 rounded-md bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-md hover-themed"
    >
        <MenuIcon className="w-6 h-6" />
    </button>
    <aside 
      id="sidebar-nav"
      role="dialog"
      aria-modal="true"
      aria-label="Main Navigation"
      className={`w-72 bg-light-surface/65 dark:bg-dark-surface/65 backdrop-blur-lg flex flex-col flex-shrink-0 h-full p-6 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto lg:[role:initial] lg:[aria-modal:initial] overflow-y-auto border-r border-accent dark:border-dark-border ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
      
      <div className="flex-shrink-0 mb-8">
        <div className="flex items-center justify-between mb-8">
              <div className="p-2 bg-white/70 rounded-xl shadow-soft">
                  <TeuGlobalLogo className="h-10 w-auto object-contain" />
              </div>
             <button onClick={() => setIsOpen(false)} aria-label="Close menu" className="lg:hidden text-zinc-400 hover:text-red-500 transition-all">
                <XIcon className="w-6 h-6"/>
             </button>
        </div>
        
        <button 
            onClick={() => { onNewSession(); setCurrentView('classification'); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-primary-blue/80 dark:bg-accent/80 backdrop-blur-sm transition-all btn-hover-themed"
        >
            <RestartIcon className="w-4 h-4" />
            New Session
        </button>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto -mr-2 pr-2 custom-scrollbar">
        <nav className="space-y-2">
            <h3 className="px-3 mb-3 text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Tools</h3>
            <NavItem 
                icon={<HtsCodeIcon className="w-5 h-5" />} 
                label="Classification" 
                active={currentView === 'classification'}
                onClick={() => setCurrentView('classification')}
                tooltip="Neural Classification Engine"
            />
            <NavItem 
                icon={<SearchIcon className="w-5 h-5" />} 
                label="HTS Lookup"
                active={currentView === 'lookup'}
                onClick={() => setCurrentView('lookup')}
                tooltip="Direct Tariff Lookup"
            />
            <NavItem 
                icon={<GlobeAltIcon className="w-5 h-5" />} 
                label="HTS.GOV"
                onClick={openHtsGovModal}
                tooltip="Official USITC Dataweb Access"
            />
             <NavItem 
                icon={<HistoryIcon className="w-5 h-5" />} 
                label="Session Logs"
                onClick={openHistoryModal}
                tooltip="Audit History"
            />
        </nav>
        
        <div className="mt-10">
            <h3 className="px-3 mb-3 text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">System</h3>
            <div className="space-y-2">
                {currentUser.role === 'admin' &&
                  <NavItem icon={<CogIcon className="w-5 h-5" />} label="Control Panel" onClick={openAdminPanel} tooltip="Security Overrides"/>
                }
                <NavItem 
                    icon={<TrashIcon className="w-5 h-5" />} 
                    label="Purge Memory" 
                    onClick={() => {
                        if (window.confirm('Delete all system history?')) {
                            clearAllHistory();
                        }
                    }}
                    tooltip="Full Data Erase"
                />
                 <NavItem icon={<QuestionIcon className="w-5 h-5" />} label="Core Info" onClick={openAboutModal} tooltip="About this Intelligence"/>
            </div>
        </div>

        <div className="mt-auto space-y-4 pt-8">
             <DutyRatesPanel />
             <div className="bg-zinc-100/30 dark:bg-dark-bg/30 backdrop-blur-sm border border-accent dark:border-dark-border rounded-xl p-4 text-[10px] shadow-inner font-black uppercase tracking-widest hover-themed transition-all">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400">Sync Status</span>
                    <span className="flex items-center text-green-500">
                        <VerifiedIcon className="w-3.5 h-3.5 mr-1.5"/>
                        {timeSince(lastSyncTime)}
                    </span>
                </div>
                <p className="text-light-text-primary dark:text-dark-text-primary">HTSUS 2025 v1.0</p>
            </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
