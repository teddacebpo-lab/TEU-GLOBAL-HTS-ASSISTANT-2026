
import React, { useState } from 'react';
import { QuickStatsData } from '../types';
import { PercentIcon, ShieldExclamationIcon, ScaleIcon, Building2Icon, TrendingUpIcon, XIcon, InfoIcon, HtsCodeIcon } from './icons/Icons';

interface Props {
   stats: QuickStatsData;
   expiredHtsCodes: string[];
}

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
   <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-orange-600 dark:border-blue-700 animate-in zoom-in-95 duration-300 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center p-5 border-b border-orange-600 dark:border-blue-700 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
               <InfoIcon className="w-5 h-5 mr-2 text-orange-500" /> {title}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-orange-700 transition-colors">
               <XIcon className="w-5 h-5 text-slate-500" />
            </button>
         </div>
         <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {children}
         </div>
         <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 text-center border-t border-orange-600 dark:border-blue-700">
            <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">Close Details</button>
         </div>
      </div>
   </div>
);

const QuickStats: React.FC<Props> = ({ stats, expiredHtsCodes }) => {
   const [activeModal, setActiveModal] = useState<'duty' | 'tariff' | 'pga' | 'remedy' | null>(null);

   const Card = ({
      type,
      title,
      value,
      subtext,
      icon: Icon,
      bgClass,
      textClass,
      indicatorColor
   }: any) => (
      <div
         onClick={() => setActiveModal(type)}
         className={`glass-card relative group cursor-pointer overflow-hidden p-5 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all bg-white dark:bg-slate-800 shadow-soft`}
      >
         <div className={`absolute top-0 left-0 w-1 h-full ${indicatorColor}`}></div>
         <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bgClass} opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>

         <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{title}</p>
               <div className="mt-1">{value}</div>
            </div>
            <div className={`p-3 rounded-xl ${bgClass} ${textClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
               <Icon className="w-6 h-6" />
            </div>
         </div>

         <div className="relative z-10 flex items-center pt-2 border-t border-orange-50 dark:border-blue-700/50">
            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${subtext.active ? 'animate-pulse ' + indicatorColor : 'bg-slate-300'}`}></div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-blue-400 transition-colors">{subtext.label}</p>
         </div>
      </div>
   );

   const totalDuty = stats?.totalDuty ?? 0;
   const baseDuty = stats?.baseDuty ?? 0;
   const additionalTariffs = stats?.additionalTariffs ?? [];
   const agencies = stats?.agencies ?? [];

   // Helper to check for critical remedies including IEEPA and Fentanyl
   const isTradeRemedy = (name: string, code: string) => {
       const n = name.toUpperCase();
       const c = code.replace(/\./g, '');
       return n.includes("SECTION 232") || 
              n.includes("AD/") || 
              n.includes("CVD") || 
              n.includes("FENTANYL") || 
              n.includes("IEEPA") || 
              n.includes("EXCLUSION") ||
              c.startsWith("990380") || 
              c.startsWith("990301") ||
              c.startsWith("990388");
   };

   const isExpired = (code: string) => {
       return expiredHtsCodes.some(c => c.replace(/\./g, '') === code.replace(/\./g, ''));
   };

   return (
      <>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <Card
               type="duty"
               title="Total Duty"
               value={<h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalDuty.toFixed(2)}%</h3>}
               icon={PercentIcon}
               bgClass="bg-blue-50 dark:bg-blue-900/30"
               textClass="text-blue-600 dark:text-blue-400"
               indicatorColor="bg-blue-500"
               subtext={{ label: "Detailed Breakdown", active: true }}
            />

            <Card
               type="tariff"
               title="Add. Tariffs"
               value={
                  additionalTariffs.length > 0 ?
                     <h3 className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">{additionalTariffs.length} Active</h3> :
                     <h3 className="text-3xl font-black text-slate-300 dark:text-slate-600 tracking-tight">None</h3>
               }
               icon={TrendingUpIcon}
               bgClass="bg-red-50 dark:bg-red-900/30"
               textClass="text-red-600 dark:text-red-400"
               indicatorColor="bg-red-500"
               subtext={{ label: additionalTariffs.length > 0 ? "Review Surcharges" : "No Extra Duties", active: additionalTariffs.length > 0 }}
            />

            <Card
               type="pga"
               title="PGA Status"
               value={
                  agencies.length > 0 ?
                     <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight">{agencies.length} Flags</h3> :
                     <h3 className="text-3xl font-black text-slate-300 dark:text-slate-600 tracking-tight">Clear</h3>
               }
               icon={Building2Icon}
               bgClass="bg-orange-50 dark:bg-orange-900/30"
               textClass="text-orange-600 dark:text-orange-400"
               indicatorColor="bg-orange-500"
               subtext={{ label: agencies.length > 0 ? "View Agencies" : "Standard Entry", active: agencies.length > 0 }}
            />

            <Card
               type="remedy"
               title="Sec 232/301/AD"
               value={
                  additionalTariffs.some(t => isTradeRemedy(t.name, t.code)) ?
                     <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">Active</h3> :
                     <h3 className="text-3xl font-black text-slate-300 dark:text-slate-600 tracking-tight">None</h3>
               }
               icon={ScaleIcon}
               bgClass="bg-purple-50 dark:bg-purple-900/30"
               textClass="text-purple-600 dark:text-purple-400"
               indicatorColor="bg-purple-500"
               subtext={{ label: additionalTariffs.some(t => isTradeRemedy(t.name, t.code)) ? "Review Cases" : "No Cases Found", active: additionalTariffs.some(t => isTradeRemedy(t.name, t.code)) }}
            />
         </div>

         {/* MODALS */}
         {activeModal === 'duty' && (
            <Modal title="Duty Rate Breakdown" onClose={() => setActiveModal(null)}>
               <div className="space-y-6 text-sm">
                  <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Base Component</p>
                            <h4 className="font-black text-slate-800 dark:text-white">General MFN Rate</h4>
                        </div>
                        <span className="font-mono font-black text-2xl text-slate-900 dark:text-white">{baseDuty.toFixed(2)}%</span>
                    </div>
                  </div>

                  {additionalTariffs.length > 0 && (
                     <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Accumulated Surcharges (Trade Remedies)</p>
                        <div className="space-y-3">
                           {additionalTariffs.map((t, i) => {
                              const expired = isExpired(t.code);
                              return (
                                 <div key={i} className={`group relative overflow-hidden flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all ${expired ? 'opacity-70 grayscale-[0.3]' : ''}`}>
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${expired ? 'bg-red-600' : isTradeRemedy(t.name, t.code) ? 'bg-purple-500' : 'bg-red-500'}`}></div>
                                    <div className="flex flex-col gap-1">
                                       <div className="flex items-center gap-2">
                                           <span className={`text-sm font-black ${expired ? 'text-red-700 dark:text-red-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{t.name}</span>
                                           {t.rate === 0 && !expired && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 rounded font-black uppercase tracking-tighter">Exclusion</span>}
                                           {expired && <span className="text-[9px] bg-red-600 text-white px-1.5 rounded font-black uppercase tracking-tighter">Expired</span>}
                                       </div>
                                       <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                          <HtsCodeIcon className="w-3.5 h-3.5" />
                                          <span className={`text-[10px] font-mono font-bold tracking-tighter uppercase ${expired ? 'text-red-600' : ''}`}>{t.code}</span>
                                       </div>
                                    </div>
                                    <span className={`font-mono font-black text-lg ${expired ? 'text-red-600' : isTradeRemedy(t.name, t.code) ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                                       {t.rate > 0 ? `+${t.rate.toFixed(1)}%` : '0.0%'}
                                    </span>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  <div className="pt-6 border-t-4 border-double border-slate-100 dark:border-slate-700 flex flex-col items-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Combined Entry Liability</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-6xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{totalDuty.toFixed(2)}</span>
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">%</span>
                     </div>
                  </div>
                  
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 p-4 rounded-2xl flex gap-3 items-start">
                     <ShieldExclamationIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                     <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                        Notice: Duty calculations include all triggered Section 232, 301, and IEEPA (Fentanyl) surcharges. Final verification requires official 7501 submission to CBP.
                     </p>
                  </div>
               </div>
            </Modal>
         )}

         {activeModal === 'tariff' && (
            <Modal title="Additional Surcharges Detail" onClose={() => setActiveModal(null)}>
               {additionalTariffs.length === 0 ? (
                  <div className="text-center py-12">
                     <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUpIcon className="w-8 h-8 text-green-600" />
                     </div>
                     <h4 className="font-bold text-lg text-slate-800 dark:text-white">Clean Entry</h4>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">No additional tariffs or remedies detected for this origin/commodity.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {additionalTariffs.map((t, i) => {
                        const expired = isExpired(t.code);
                        return (
                           <div key={i} className={`bg-white dark:bg-slate-900 rounded-xl p-4 border shadow-sm relative overflow-hidden ${expired ? 'border-red-600' : isTradeRemedy(t.name, t.code) ? 'border-purple-600' : 'border-orange-600'}`}>
                              <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full -mr-4 -mt-4 z-0 ${expired ? 'bg-red-50 dark:bg-red-900/20' : isTradeRemedy(t.name, t.code) ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}></div>
                              <div className="relative z-10">
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-lg leading-tight ${expired ? 'text-red-700 dark:text-red-400 line-through' : 'text-slate-800 dark:text-white'}`}>{t.name}</p>
                                            {expired && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">EXPIRED</span>}
                                        </div>
                                        <span className={`text-[10px] font-mono font-black mt-1 uppercase tracking-tighter px-1.5 py-0.5 rounded inline-block w-fit ${expired ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>HTS {t.code}</span>
                                    </div>
                                    <span className={`text-white px-3 py-1 rounded-lg text-sm font-black shadow-md ${expired ? 'bg-red-700 shadow-red-500/30' : isTradeRemedy(t.name, t.code) ? 'bg-purple-600 shadow-purple-500/30' : 'bg-red-600 shadow-red-500/30'}`}>
                                       {t.rate}%
                                    </span>
                                 </div>
                                 <p className="text-[11px] text-slate-500 dark:text-dark-text-secondary mt-3">Triggered surcharge based on current regulatory scope for origin {t.name.includes("China") ? "China" : "verified origin"}.</p>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </Modal>
         )}

         {activeModal === 'pga' && (
            <Modal title="Partner Government Agencies" onClose={() => setActiveModal(null)}>
               {agencies.length === 0 ? (
                  <div className="text-center py-12">
                     <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2Icon className="w-8 h-8 text-slate-400" />
                     </div>
                     <p className="text-slate-600 dark:text-slate-300 font-medium">No specific PGA flags detected.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-2 gap-4">
                     {agencies.map((a, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-2xl text-center hover:shadow-md transition-all">
                           <Building2Icon className="w-8 h-8 text-orange-500 mb-3" />
                           <span className="font-black text-orange-900 dark:text-orange-200">{a}</span>
                        </div>
                     ))}
                  </div>
               )}
            </Modal>
         )}

         {activeModal === 'remedy' && (
            <Modal title="Critical Trade Remedies Index" onClose={() => setActiveModal(null)}>
               {additionalTariffs.filter(t => isTradeRemedy(t.name, t.code)).length === 0 ? (
                  <div className="text-center py-12">
                     <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ScaleIcon className="w-8 h-8 text-purple-500" />
                     </div>
                     <h4 className="font-bold text-lg text-slate-800 dark:text-white">No Cases Detected</h4>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">No Section 232, 301, or IEEPA (Fentanyl) duties indicated for this scope.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {additionalTariffs.filter(t => isTradeRemedy(t.name, t.code)).map((t, i) => {
                        const expired = isExpired(t.code);
                        return (
                           <div key={i} className={`bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border group hover:shadow-lg transition-all ${expired ? 'border-red-600/50 bg-red-50 dark:bg-red-900/10' : 'border-purple-200 dark:border-purple-800'}`}>
                              <div className="flex items-center gap-3 mb-3">
                                 <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${expired ? 'bg-red-200 dark:bg-red-800' : 'bg-purple-200 dark:bg-purple-800'}`}>
                                    {expired ? <ShieldExclamationIcon className="w-5 h-5 text-red-700 dark:text-red-300" /> : <ScaleIcon className="w-5 h-5 text-purple-700 dark:text-purple-300" />}
                                 </div>
                                 <p className={`font-bold text-lg ${expired ? 'text-red-900 dark:text-red-200 line-through' : 'text-purple-900 dark:text-purple-100'}`}>{t.name}</p>
                                 {expired && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">EXPIRED</span>}
                              </div>
                              <div className={`flex justify-between items-center p-3 rounded-xl border ${expired ? 'bg-red-100/30 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white/50 dark:bg-slate-900/50 border-purple-200/50 dark:border-purple-800/50'}`}>
                                 <div className="flex items-center gap-2">
                                   <HtsCodeIcon className={`w-4 h-4 ${expired ? 'text-red-600' : 'text-purple-600'}`} />
                                   <span className={`text-xs font-mono font-black uppercase tracking-tighter ${expired ? 'text-red-700 dark:text-red-300' : 'text-purple-700 dark:text-purple-300'}`}>{t.code}</span>
                                 </div>
                                 <span className={`font-black ${expired ? 'text-red-800 dark:text-red-200' : 'text-purple-800 dark:text-purple-200'}`}>{t.rate > 0 ? `${t.rate.toFixed(1)}%` : 'Exclusion Applied'}</span>
                              </div>
                              <p className={`text-[10px] mt-3 text-center font-bold tracking-tight uppercase ${expired ? 'text-red-600' : 'text-purple-600/70 dark:text-purple-300/60'}`}>
                                 {expired ? '⚠️ CODE VOID - NOT APPLICABLE FOR CURRENT 2025 FILINGS' : t.code === '9903.01.33' ? '⚠️ Exclusion replacing 9903.01.25 via Section 232 trigger' : '⚠️ Verified Trade Remedy Subheading'}
                              </p>
                           </div>
                        );
                     })}
                  </div>
               )}
            </Modal>
         )}
      </>
   );
};

export default QuickStats;
