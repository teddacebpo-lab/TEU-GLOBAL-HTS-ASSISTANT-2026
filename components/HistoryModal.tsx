import React, { useState } from 'react';
import { ClassificationHistoryItem } from '../types';
import { XCircleIcon, HistoryIcon, TrashIcon, SearchIcon, RestartIcon } from './icons/Icons';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ClassificationHistoryItem[];
  onClearHistory: () => void;
  onRerunQuery: (query: string, viewType: 'classification' | 'lookup') => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClearHistory, onRerunQuery }) => {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item =>
    item.query.toLowerCase().includes(filter.toLowerCase())
  );

  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete your personal activity history? This cannot be undone.')) {
      onClearHistory();
      onClose();
    }
  };
  
  const handleRerun = (item: ClassificationHistoryItem) => {
    onRerunQuery(item.query, item.viewType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative border border-accent dark:border-dark-border"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-accent dark:border-dark-border flex justify-between items-center flex-shrink-0">
            <h2 id="history-modal-title" className="flex items-center gap-2 text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                <HistoryIcon className="w-6 h-6" />
                My Activity History
            </h2>
            <button onClick={onClose} aria-label="Close history modal" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"><XCircleIcon className="w-8 h-8"/></button>
        </header>

        <main className="p-6 flex-1 flex flex-col overflow-hidden">
            <div className="relative mb-4 flex-shrink-0">
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
                <input 
                    type="search"
                    placeholder="Filter by query content..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full p-2 pl-10 bg-light-bg dark:bg-dark-bg border border-accent dark:border-dark-border rounded-md"
                />
            </div>
            <div className="overflow-auto flex-1 border border-accent dark:border-dark-border rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-light-bg dark:bg-dark-bg sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold">Timestamp</th>
                            <th className="p-3 font-semibold">Type</th>
                            <th className="p-3 font-semibold">Query</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-accent dark:divide-dark-border">
                        {filteredHistory.length > 0 ? filteredHistory.map(item => (
                            <tr key={item.id}>
                                <td className="p-3 whitespace-nowrap">{new Date(item.timestamp).toLocaleString()}</td>
                                <td className="p-3 capitalize">{item.viewType}</td>
                                <td className="p-3 truncate max-w-md">{item.query}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleRerun(item)} className="text-primary-blue dark:text-accent hover:underline text-xs font-semibold flex items-center gap-1 ml-auto">
                                        <RestartIcon className="w-4 h-4" />
                                        Rerun
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">No activity found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
        
        <footer className="p-4 bg-light-bg dark:bg-dark-bg/50 border-t border-accent dark:border-dark-border flex-shrink-0 flex justify-between items-center">
             <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Showing {filteredHistory.length} of {history.length} items.
            </p>
            <div className="flex items-center gap-4">
                 <button 
                    onClick={handleClear} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold text-sm"
                >
                    <TrashIcon className="w-4 h-4"/>
                    Clear My History
                </button>
                <button 
                  onClick={onClose} 
                  className="px-6 py-2 bg-primary-blue dark:bg-accent hover:bg-accent-hover dark:hover:bg-primary-blue-hover text-white rounded-md font-bold text-sm"
                >
                  Close
                </button>
            </div>
        </footer>
         {/* Powered By Footer Attribution - Fixed Bottom Right of Main Content */}
                    <div className="flex items-center z-50 text-[10px] font-black uppercase tracking-widest pointer-events-none transition-all duration-300">
                        <div className="px-3 py-1.5 rounded-lg bg-white/40 dark:bg-black/20 backdrop-blur-md border border-accent/20 text-zinc-500 dark:text-zinc-400 shadow-sm">
                            Powered By Junaid Abbasi
                        </div>
                    </div>
      </div>
    </div>
  );
};

export default HistoryModal;
