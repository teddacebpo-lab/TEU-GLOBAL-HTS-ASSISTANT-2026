import React from 'react';
import { XCircleIcon, TeuGlobalLogo, VerifiedIcon, DocumentTextIcon, ShieldExclamationIcon } from './icons/Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  watermark?: string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, watermark }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        className="bg-light-surface/60 dark:bg-dark-surface/60 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative border border-accent dark:border-dark-border overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Watermark */}
        <div className="watermark-bg" style={{ backgroundImage: `url(${watermark})` }}></div>

        <header className="bg-light-bg/30 dark:bg-dark-bg/30 backdrop-blur-md p-6 border-b border-accent dark:border-dark-border flex justify-between items-center flex-shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 p-2 bg-white/80 rounded-2xl shadow-md">
                <TeuGlobalLogo className="w-full h-full object-contain" />
            </div>

            <div>
                <h2 id="about-modal-title" className="text-2xl font-black uppercase tracking-tighter text-primary-blue dark:text-accent">AI Core Intelligence</h2>
                <p className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-widest">Protocol & Logistics Specification</p>
            </div>
          </div>
           <div className="relative group">
              <button onClick={onClose} aria-label="Close about dialog" className="text-zinc-400 hover:text-red-500 transition-all hover:scale-110">
                <XCircleIcon className="w-10 h-10"/>
              </button>
          </div>
        </header>

        <main className="p-8 overflow-y-auto flex-1 space-y-8 text-sm text-light-text-secondary dark:text-dark-text-secondary relative z-10 custom-scrollbar">
          <section className="bg-white/10 dark:bg-black/5 p-6 rounded-2xl border border-accent backdrop-blur-sm hover-themed transition-all">
            <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-light-text-primary dark:text-dark-text-primary mb-3">
              <VerifiedIcon className="w-6 h-6 text-primary-blue dark:text-accent"/>
              Mission Directives
            </h3>
            <p className="leading-relaxed font-medium">
              The <strong>TEU Global AI Assistant</strong> is an advanced neural network specialized for U.S. customs brokerage and international trade compliance. It provides real-time HTS classification processing, duty calculation modeling, and regulatory flag identification.
            </p>
            <p className="mt-3 leading-relaxed font-medium">
              By utilizing the Gemini 2.0 Flash architecture, the system performs multi-vector analysis on product data to ensure the highest possible accuracy for entry declarations.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
              <DocumentTextIcon className="w-4 h-4"/>
              Verified Data Streams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50/30 dark:bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-light-border dark:border-dark-border hover-themed transition-all">
                    <p className="font-black text-[10px] uppercase mb-1 text-accent">HTSUS 2025</p>
                    <p className="text-xs">Live USITC Harmonized Tariff Schedule API synchronization.</p>
                </div>
                <div className="p-4 bg-zinc-50/30 dark:bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-light-border dark:border-dark-border hover-themed transition-all">
                    <p className="font-black text-[10px] uppercase mb-1 text-primary-blue">CROSS-CBP</p>
                    <p className="text-xs">Direct binding ruling index search for legal classification precedents.</p>
                </div>
                <div className="p-4 bg-zinc-50/30 dark:bg-zinc-800/30 backdrop-blur-sm rounded-xl border border-light-border dark:border-dark-border hover-themed transition-all">
                    <p className="font-black text-[10px] uppercase mb-1 text-green-500">USTR/PGA</p>
                    <p className="text-xs">Trade remedy and agency compliance updates from official sources.</p>
                </div>
            </div>
          </section>

          <section className="bg-red-500/5 dark:bg-red-500/10 border-2 border-dashed border-red-500/30 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldExclamationIcon className="w-24 h-24 text-red-500"/>
            </div>
            <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-3">
              Legal Precautionary Notice
            </h3>
            <p className="font-bold text-red-800 dark:text-red-300 leading-relaxed text-xs">
                This system is a decision-support tool. It does NOT constitute legal counsel. HTS classification is a complex legal determination. The importer of record bears ultimate legal liability for accurate declaration. Consultation with a Licensed U.S. Customs Broker is mandatory for final filing.
            </p>
          </section>
        </main>
        
        <footer className="p-6 bg-light-bg/40 dark:bg-dark-bg/40 backdrop-blur-md border-t border-accent dark:border-dark-border flex-shrink-0 text-center relative z-10">
            <button 
              onClick={onClose} 
              className="px-12 py-3 bg-primary-blue/80 dark:bg-accent/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] text-white rounded-xl font-black uppercase tracking-widest text-xs btn-hover-themed transition-all"
            >
              Acknowledge & Close
            </button>
        </footer>
         {/* Powered By Footer Attribution - Fixed Bottom Right of Main Content */}
                    <div className="absolute bottom-2 right-4 z-50 text-[10px] font-black uppercase tracking-widest pointer-events-none transition-all duration-300">
                        <div className="px-3 py-1.5 rounded-lg bg-white/30 dark:bg-black/10 backdrop-blur-md border border-accent/20 text-zinc-500 dark:text-zinc-400 shadow-sm">
                            Powered By Junaid Abbasi
                        </div>
                    </div>
      </div>
    </div>
  );
};

export default AboutModal;