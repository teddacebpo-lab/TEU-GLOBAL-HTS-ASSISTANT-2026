import React, { useRef, useEffect, useMemo, useState } from 'react';
import { ChatMessage, PrintData, AnalysisData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import QuickStats from './QuickStats';
import { 
    UserIcon, TeuGlobalLogo, DocumentTextIcon, DollarIcon, 
    ShieldExclamationIcon, AlertTriangleIcon, BookIcon, GavelIcon, 
    CheckCircleIcon, InfoIcon, SearchIcon, PrintIcon, CopyIcon,
    ChevronDownIcon
} from './icons/Icons';

/**
 * Custom Ship Loading Progress Bar
 */
const LoadingShip: React.FC = () => (
  <div className="w-full py-12 px-4 animate-fade-in">
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Manifesting Data...</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">In Transit</span>
      </div>
      <div className="relative h-2 bg-zinc-200/40 dark:bg-zinc-800/40 rounded-full overflow-hidden">
        {/* Dashed Line track */}
        <div className="absolute inset-0 border-b-2 border-dashed border-zinc-300/30 dark:border-zinc-700/30 opacity-30 top-[-1px]"></div>
        
        {/* The Ship */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 h-8 w-12 flex items-center justify-center animate-ship-travel">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600 dark:text-accent drop-shadow-md">
                <path d="M22 17.5L20.25 15.75L18.5 17.5V14H15V17.5L13.25 15.75L11.5 17.5V13H8V17.5L6.25 15.75L4.5 17.5V11H2V19.5C2 20.33 2.67 21 3.5 21H20.5C21.33 21 22 20.33 22 19.5V17.5Z" />
             </svg>
        </div>
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

/**
 * Structured Section Component with Collapsible Logic
 */
const StructuredSection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    color: string; 
    isCollapsible: boolean;
    children: React.ReactNode 
}> = ({ title, icon, color, isCollapsible, children }) => {
    // Start collapsed if collapsible, otherwise always open
    const [isCollapsed, setIsCollapsed] = useState(isCollapsible);

    return (
        <section className={`rounded-2xl border-2 overflow-hidden shadow-soft transition-all hover:shadow-md bg-white/40 dark:bg-dark-surface/30 backdrop-blur-md ${color}`}>
            <div 
                className={`px-6 py-4 flex items-center justify-between border-b bg-white/20 dark:bg-black/10 transition-colors ${isCollapsible ? 'cursor-pointer hover:bg-white/30 dark:hover:bg-black/20' : ''} ${color}`}
                onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/30 dark:bg-dark-surface/30 shadow-sm">{icon}</div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-light-text-primary dark:text-dark-text-primary">
                        {title}
                    </h3>
                </div>
                {isCollapsible && (
                    <ChevronDownIcon 
                        className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} 
                    />
                )}
            </div>
            
            <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[5000px] p-6 opacity-100'}`}>
                {children}
            </div>
        </section>
    );
};

const SectionRenderer: React.FC<{ content: string; expiredHtsCodes: string[] }> = ({ content, expiredHtsCodes }) => {
    const sections = useMemo(() => {
        const headerPattern = /(\*\*(?:HTS|DUTIES|ADDITIONAL TARIFF|COMPLIANCE|CLASSIFICATION RATIONALE|SUPPORTING NOTES\/RULINGS|IMPORTER PRO-TIPS|HTS PROFILE|POTENTIAL COMPLIANCE FLAGS)\*\*)/g;
        const parts = content.split(headerPattern);
        const results: { title: string; body: string }[] = [];

        if (parts.length > 0 && !parts[0].startsWith('**')) {
            const intro = parts[0].trim();
            if (intro) results.push({ title: 'AI INTELLIGENCE REPORT', body: intro });
        }

        for (let i = 1; i < parts.length; i += 2) {
            const rawTitle = parts[i].replace(/\*\*/g, '').trim();
            const body = parts[i + 1] ? parts[i + 1].trim() : "";
            results.push({ title: rawTitle, body });
        }
        return results;
    }, [content]);

    const getStyle = (title: string) => {
        const t = title.toUpperCase();
        // HTS and Duties are NEVER collapsible
        const isPermanent = t.includes('HTS') || t.includes('DUTY') || t.includes('DUTIES');
        
        if (t.includes('HTS')) return { isCollapsible: false, color: 'border-blue-500/20', icon: <SearchIcon className="w-5 h-5 text-blue-500" /> };
        if (t.includes('DUTY')) return { isCollapsible: false, color: 'border-emerald-500/20', icon: <DollarIcon className="w-5 h-5 text-emerald-500" /> };
        
        if (t.includes('TARIFF')) return { isCollapsible: true, color: 'border-red-500/20', icon: <ShieldExclamationIcon className="w-5 h-5 text-red-500" /> };
        if (t.includes('COMPLIANCE')) return { isCollapsible: true, color: 'border-orange-500/20', icon: <AlertTriangleIcon className="w-5 h-5 text-orange-500" /> };
        if (t.includes('RATIONALE')) return { isCollapsible: true, color: 'border-indigo-500/20', icon: <BookIcon className="w-5 h-5 text-indigo-500" /> };
        if (t.includes('RULING')) return { isCollapsible: true, color: 'border-zinc-500/20', icon: <GavelIcon className="w-5 h-5 text-zinc-500" /> };
        
        return { isCollapsible: !isPermanent, color: 'border-zinc-200 dark:border-zinc-700/30', icon: <InfoIcon className="w-5 h-5 text-zinc-400" /> };
    };

    if (sections.length === 0) return <MarkdownRenderer content={content} expiredHtsCodes={expiredHtsCodes} />;

    return (
        <div className="space-y-6">
            {sections.map((s, idx) => {
                const style = getStyle(s.title);
                return (
                    <StructuredSection 
                        key={idx} 
                        title={s.title} 
                        icon={style.icon} 
                        color={style.color}
                        isCollapsible={style.isCollapsible}
                    >
                        <MarkdownRenderer content={s.body} expiredHtsCodes={expiredHtsCodes} />
                    </StructuredSection>
                );
            })}
        </div>
    );
};

export const AiMessage: React.FC<{
    text: string;
    onAddExpiredHts: (code: string) => void;
    onPrintRequest: (text: string) => void;
    analysisData: AnalysisData | null;
    expiredHtsCodes: string[];
}> = ({ text, onAddExpiredHts, onPrintRequest, analysisData, expiredHtsCodes }) => {
    const [copied, setCopied] = useState(false);
    const [flagged, setFlagged] = useState(false);

    const recommendedCode = analysisData?.recommendations[0]?.htsCode;
    const isCodeExpired = recommendedCode ? expiredHtsCodes.includes(recommendedCode) : false;

    const handleCopyHts = () => {
        if (recommendedCode) {
            navigator.clipboard.writeText(recommendedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleFlagExpired = () => {
        if (recommendedCode) {
            onAddExpiredHts(recommendedCode);
            setFlagged(true);
            setTimeout(() => setFlagged(false), 3000);
        }
    };

    if (!text && !analysisData) {
        return <LoadingShip />;
    }

    return (
        <div className="space-y-8">
            {analysisData && (
                <div className="mb-8 p-6 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                        <InfoIcon className="w-4 h-4"/> 
                        Interactive Analysis Dashboard
                    </h4>
                    <QuickStats stats={analysisData.quickStats} expiredHtsCodes={expiredHtsCodes} />
                </div>
            )}

            <SectionRenderer content={text} expiredHtsCodes={expiredHtsCodes} />
            
            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-light-border dark:border-dark-border">
                <button 
                    onClick={() => onPrintRequest(text)} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900/80 dark:bg-accent/80 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
                >
                    <PrintIcon className="w-4 h-4" /> Export Compliance PDF
                </button>
                
                {recommendedCode && (
                    <button 
                        onClick={handleCopyHts}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border backdrop-blur-sm ${
                            copied 
                            ? 'bg-green-50/40 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                            : 'bg-zinc-100/40 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        {copied ? <CheckCircleIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                        {copied ? 'Copied' : `Copy Code`}
                    </button>
                )}

                {recommendedCode && !isCodeExpired && (
                    <button 
                        onClick={handleFlagExpired}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border backdrop-blur-sm ${
                            flagged 
                            ? 'bg-orange-50/40 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' 
                            : 'bg-zinc-100/40 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                        }`}
                        title="Report this HTS code as expired/invalid for 2025"
                    >
                        <ShieldExclamationIcon className="w-4 h-4" />
                        {flagged ? 'Flagged' : 'Flag as Expired'}
                    </button>
                )}

                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50/40 dark:bg-blue-900/20 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-primary-blue dark:text-accent border border-blue-100 dark:border-orange-800/30">
                    <CheckCircleIcon className="w-4 h-4" /> Validated Response
                </div>
            </div>
        </div>
    );
};

export interface ChatWindowProps {
    messages: ChatMessage[];
    onAddExpiredHts: (code: string) => void;
    setPrintData: (data: PrintData) => void;
    analysis: { messageId: string, data: AnalysisData } | null;
    expiredHtsCodes: string[];
    isLoading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onAddExpiredHts, setPrintData, analysis, expiredHtsCodes, isLoading }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(messages.length);

    useEffect(() => {
        if (messages.length > prevMessagesLength.current) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.sender === 'user') {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages.length]);

    const handlePrint = (responseText: string) => {
        const lastUser = [...messages].reverse().find(m => m.sender === 'user');
        const data = analysis?.data;
        if (!data) {
            alert("Report metadata is currently being generated. Please wait.");
            return;
        }

        setPrintData({
            query: lastUser?.text || "N/A",
            htsCode: data.recommendations[0]?.htsCode || "N/A",
            scenarioDescription: data.recommendations[0]?.scenario || "N/A",
            dutyInfo: {
                general: `${data.quickStats?.totalDuty?.toFixed(2) || '0.00'}% (Estimated Total)`,
                special: "Variable - Program Verified",
                column2: "Variable - Check Sanctions",
            },
            tariffInfo: responseText.match(/\*\*(?:ADDITIONAL TARIFFS?)\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i)?.[1].trim() || "See detailed AI breakdown.",
            complianceInfo: responseText.match(/\*\*(?:COMPLIANCE|POTENTIAL COMPLIANCE FLAGS)\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i)?.[1].trim() || "See detailed AI breakdown.",
        });

        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <div className="space-y-12 pb-10">
            {messages.map((message, index) => (
                <div key={message.id || index} className={`flex gap-6 animate-slide-up ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                        message.sender === 'user' ? 'bg-gradient-to-br from-zinc-200/60 to-zinc-300/60' : 'bg-gradient-to-br from-primary-blue/60 to-blue-400/60 dark:from-accent/60 dark:to-orange-400/60'
                    }`}>
                        {message.sender === 'user' ? <UserIcon className="w-6 h-6 text-zinc-700 dark:text-zinc-200" /> : <TeuGlobalLogo className="w-10 h-10 object-contain rounded-xl bg-white p-1" />}
                    </div>

                    <div className={`flex-1 min-w-0 max-w-4xl ${message.sender === 'user' ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-2 font-black text-[10px] uppercase tracking-[0.2em] text-light-text-secondary dark:text-dark-text-secondary">
                            {message.sender === 'user' ? 'Verified User' : 'TEU Global AI Intelligence'}
                            <div className="w-1 h-1 rounded-full bg-current opacity-30"></div>
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={`p-6 rounded-[32px] border shadow-soft backdrop-blur-md transition-all ${
                            message.sender === 'user' ? 'bg-primary-blue/45 dark:bg-accent/45 text-white border-transparent rounded-tr-none' : 'bg-white/45 dark:bg-dark-surface/45 border-light-border dark:border-dark-border rounded-tl-none'
                        }`}>
                            {message.sender === 'user' ? (
                                <p className="font-bold leading-relaxed whitespace-pre-wrap text-black dark:text-white">{message.text}</p>
                            ) : (
                                <AiMessage 
                                    text={message.text} 
                                    onAddExpiredHts={onAddExpiredHts} 
                                    onPrintRequest={handlePrint} 
                                    analysisData={analysis?.messageId === message.id ? analysis.data : null}
                                    expiredHtsCodes={expiredHtsCodes}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && messages[messages.length - 1]?.sender === 'user' && (
                <div className="animate-slide-up">
                    <LoadingShip />
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatWindow;