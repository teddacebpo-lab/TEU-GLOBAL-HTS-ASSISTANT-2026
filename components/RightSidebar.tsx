import React from 'react';
import { HtsCodeIcon, CheckCircleIcon, InfoIcon, DollarIcon, ShieldExclamationIcon, ClipboardDocumentListIcon, TerminalIcon, UploadIcon, SparklesIcon, ChevronDownIcon } from './icons/Icons';
import { AnalysisData, UserUsage } from '../types';
import QuickStats from './QuickStats';

interface RightSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    analysisData: AnalysisData | null;
    onSummarize: () => Promise<void>;
    isSummarizing: boolean;
    summary: string | null;
}

const HtsRecommendation: React.FC<{ scenario: string, htsCode: string, description: string }> = ({ scenario, htsCode, description }) => (
    <div className="p-4 rounded-lg bg-light-bg/30 dark:bg-dark-bg/30 backdrop-blur-sm border border-accent dark:border-dark-border shadow-soft space-y-2 hover-themed transition-all cursor-default">
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-blue dark:text-accent">{scenario}</span>
            <span className="text-lg font-bold font-mono text-light-text-primary dark:text-dark-text-primary">{htsCode}</span>
        </div>
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
    </div>
);

const ComplianceAlert: React.FC<{ title: string; description: string; type: 'success' | 'info' | 'warning' }> = ({ title, description, type }) => {
    const config = {
        success: {
            colors: 'bg-section-green-light/20 dark:bg-dark-bg/20 border-accent dark:border-green-700/50',
            icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        },
        info: {
            colors: 'bg-section-blue-light/20 dark:bg-dark-bg/20 border-accent dark:border-blue-700/50',
            icon: <InfoIcon className="w-5 h-5 text-blue-500" />,
        },
        warning: {
            colors: 'bg-amber-100/20 dark:bg-dark-bg/20 border-accent dark:border-amber-700/50',
            icon: <ShieldExclamationIcon className="w-5 h-5 text-amber-500" />,
        },
    };
    const { colors, icon } = config[type] || config.info;

    return (
        <div className={`flex items-start p-4 rounded-lg border backdrop-blur-sm hover-themed transition-all ${colors}`}>
            <div className="flex-shrink-0 mr-3">{icon}</div>
            <div>
                <p className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary">{title}</p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
            </div>
        </div>
    );
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onToggle, analysisData, onSummarize, isSummarizing, summary }) => {
    if (!isOpen) return null;

    return (
        <aside className="w-96 flex-shrink-0 border-l border-light-border dark:border-dark-border hidden lg:block h-full overflow-y-auto p-4 space-y-6 relative bg-light-surface/55 dark:bg-dark-surface/55 backdrop-blur-md animate-in slide-in-from-right duration-300">
            <div className="bg-light-surface/50 dark:bg-dark-surface/50 backdrop-blur-md p-5 rounded-lg border border-accent dark:border-dark-border">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Analysis Details</h3>
                    <div className="flex items-center gap-2">
                         {analysisData && (
                            <button 
                                onClick={onSummarize}
                                disabled={isSummarizing}
                                className="text-xs font-bold text-primary-blue dark:text-accent hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline btn-hover-themed px-2 py-1 rounded text-white"
                            >
                                <SparklesIcon className="w-3 h-3" />
                                {isSummarizing ? '...' : 'Smart'}
                            </button>
                        )}
                        <button onClick={onToggle} className="p-1 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 rounded transition-colors" title="Close Panel">
                            <ChevronDownIcon className="w-5 h-5 text-zinc-400 rotate-90" />
                        </button>
                    </div>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">A summary of the AI's findings.</p>

                {summary && (
                    <div className="mb-6 p-4 bg-blue-50/30 dark:bg-blue-900/10 backdrop-blur-sm border border-blue-100 dark:border-blue-800 rounded-lg animate-fade-in hover-themed">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                             AI Executive Summary
                        </h4>
                        <p className="text-xs text-light-text-primary dark:text-dark-text-primary leading-relaxed italic">"{summary}"</p>
                    </div>
                )}

                {analysisData ? (
                    <div className="animate-fade-in space-y-6">
                        <div className="p-4 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                                <InfoIcon className="w-4 h-4"/> 
                                Dashboard Snapshot
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center hover-themed transition-all">
                                    <span className="text-xs font-bold text-slate-500">Total Duty</span>
                                    <span className="text-xl font-black text-blue-600">{(analysisData.quickStats?.totalDuty ?? 0).toFixed(2)}%</span>
                                </div>
                                <div className="p-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center hover-themed transition-all">
                                    <span className="text-xs font-bold text-slate-500">Addl. Surcharges</span>
                                    <span className="text-xl font-black text-red-600">{(analysisData.quickStats?.additionalTariffs?.length ?? 0)} Active</span>
                                </div>
                            </div>
                        </div>

                        {analysisData.recommendations && analysisData.recommendations.length > 0 && (
                            <div>
                                <h4 className="flex items-center gap-2 font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-2">
                                    <HtsCodeIcon className="w-5 h-5" />
                                    HTS Recommendation(s)
                                </h4>
                                <div className="space-y-3">
                                    {analysisData.recommendations.map(rec => (
                                        <HtsRecommendation key={rec.htsCode} {...rec} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-2">
                                <ShieldExclamationIcon className="w-5 h-5" />
                                Compliance Alerts
                            </h4>
                            <div className="space-y-3">
                               {analysisData.complianceAlerts.map((alert, index) => (
                                   <ComplianceAlert key={`${alert.title}-${index}`} {...alert} />
                               ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-accent dark:border-dark-border rounded-lg flex flex-col items-center justify-center hover-themed transition-all bg-white/10 dark:bg-dark-surface/10 backdrop-blur-sm">
                        <ClipboardDocumentListIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-2" />
                        <p className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">Analysis data will appear here</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">after a successful query.</p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RightSidebar;