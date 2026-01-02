import React from 'react';
import { TeuGlobalLogo, VerifiedIcon, SunIcon, MoonIcon, DatabaseIcon, TerminalIcon, UploadIcon } from './icons/Icons';
import { Theme, User, UserUsage } from '../types';

interface HeaderProps {
    theme: Theme;
    toggleTheme: () => void;
    currentUser: User;
    onLogout: () => void;
    usage: UserUsage | null;
    limits: { text: number; image: number; };
}

const UsageBadge: React.FC<{ icon: React.ReactNode, current: number, limit: number, label: string }> = ({ icon, current, limit, label }) => {
  const isMaxed = limit !== Infinity && current >= limit;
  const displayLimit = limit === Infinity ? "∞" : limit;
  
  return (
    <div className={`flex flex-col items-center px-3 py-1 rounded-lg border ${isMaxed ? 'border-red-500 bg-red-500/10' : 'border-zinc-200/40 dark:border-dark-border/40 bg-white/30 dark:bg-dark-bg/30'} shadow-soft`}>
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
        {icon} {label}
      </div>
      <div className={`text-xs font-bold ${isMaxed ? 'text-red-500' : 'text-primary-blue dark:text-accent'}`}>
        {current} / {displayLimit}
      </div>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, currentUser, onLogout, usage, limits }) => {
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const isExpired = currentUser.subscriptionExpires && currentUser.subscriptionExpires < getTodayString();

  return (
    <header className="bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg border-b border-accent dark:border-dark-border z-10 px-4 sm:px-6 lg:px-8 border-t-4 border-accent dark:border-accent shadow-md flex-shrink-0">
      <div className="flex justify-between items-center h-20">
        {/* Left Side */}
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl leading-tight text-light-text-primary dark:text-dark-text-primary">
              <span className="font-bold text-orange-500">TRADE EXPEDITORS INC.</span>
              <span className="text-blue-500"> DBA TEU GLOBAL</span>
            </h1>
            <h2 className="text-sm text-light-text-secondary dark:text-dark-text-secondary font-medium tracking-wider">
                AI HTS Assistant
            </h2>
          </div>

          {/* Daily Usage Section in Top Bar */}
          <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-light-border dark:border-dark-border">
            <UsageBadge 
              label="Text" 
              icon={<TerminalIcon className="w-3 h-3"/>} 
              current={usage?.textQueries || 0} 
              limit={limits.text}
            />
            <UsageBadge 
              label="Image" 
              icon={<UploadIcon className="w-3 h-3"/>} 
              current={usage?.imageQueries || 0} 
              limit={limits.image}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="justify-self-end flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center space-x-4">
                 <span className="flex items-center text-xs font-medium bg-section-green-light/30 dark:bg-section-green-dark/10 text-green-500 dark:text-green-300 px-3 py-1.5 rounded-full border border-accent dark:border-green-700/50">
                    <VerifiedIcon className="w-4 h-4 mr-1.5" />
                    USTR Live
                </span>
                <span className="flex items-center text-xs font-medium bg-section-blue-light/30 dark:bg-section-blue-dark/10 text-blue-500 dark:text-blue-300 px-3 py-1.5 rounded-full border border-accent dark:border-blue-500/50">
                    <DatabaseIcon className="w-4 h-4 mr-1.5" />
                    2025 HTSUS
                </span>
            </div>
          
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="relative group h-10 w-10 flex items-center justify-center rounded-full bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md hover-themed"
            >
              <span className={`transition-transform duration-500 ease-in-out ${theme === Theme.Dark ? 'rotate-0 scale-100' : 'rotate-180 scale-100'}`}>
                {theme === Theme.Dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </span>
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white px-2 py-1 text-xs rounded-md invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 z-20">
                {`Switch to ${theme === Theme.Dark ? 'Light' : 'Dark'} Mode`}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{currentUser.email}</p>
                  <p className="text-xs font-bold text-primary-blue dark:text-accent">
                    {currentUser.subscription} Tier
                    {isExpired && <span className="ml-2 text-red-500 font-bold">(Expired)</span>}
                  </p>
              </div>
              <div className="relative group">
                <button
                    onClick={onLogout}
                    aria-label="Logout"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-light-bg/40 dark:bg-dark-bg/40 border border-accent dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-all hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                </button>
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900 text-white px-2 py-1 text-xs rounded-md invisible group-hover:visible transition-opacity opacity-0 group-hover:opacity-100 z-20">
                    Logout
                </span>
              </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;