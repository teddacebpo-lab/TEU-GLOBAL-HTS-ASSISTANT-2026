
import React from 'react';
import { PrintData } from '../types';

interface PrintableResultProps {
  data: PrintData;
}

const PrintableResult: React.FC<PrintableResultProps> = ({ data }) => {
  const stats = data.quickStats;

  return (
    <div id="print-container" className="p-12 font-sans text-gray-900 bg-white hidden print:block overflow-visible min-h-screen">
      {/* 1. TOP MAIN HEADING: AI BOT NAME */}
      <header className="flex flex-col items-center justify-center pb-10 border-b-4 border-blue-600 mb-10 text-center">
          <h1 className="text-4xl font-black tracking-[0.2em] text-gray-900 uppercase">
            TEU-GLOBAL-AI-ASSISTANT
          </h1>
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mt-2">
            OFFICIAL COMPLIANCE & TARIFF AUDIT REPORT
          </h2>
          <div className="flex justify-between w-full mt-8 px-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
             <span>Date: {new Date().toLocaleDateString()}</span>
             <span>Report ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
      </header>

      <main className="space-y-12">
        {/* 2. QUICK STATS SECTION */}
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-100 pb-2">I. Operational Quick Stats</h3>
          <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">HTS Code</p>
                  <p className="text-xl font-black text-blue-700 font-mono tracking-tight">{data.htsCode}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-blue-600 uppercase mb-2">Total Duty</p>
                  <p className="text-2xl font-black text-blue-800 tracking-tighter">{stats?.totalDuty.toFixed(2)}%</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">Base Duty</p>
                  <p className="text-xl font-black text-gray-800 tracking-tighter">{stats?.baseDuty.toFixed(2)}%</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">PGA Agencies</p>
                  <p className="text-xl font-black text-orange-600 tracking-tighter">{stats?.agencies.length || 0} Flags</p>
              </div>
          </div>
        </section>

        {/* 3. HTS SECTION */}
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-100 pb-2">II. HTS Classification Details</h3>
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
             <div className="grid grid-cols-1 gap-6">
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Target Scenario</p>
                    <p className="text-lg font-black text-gray-900 leading-tight">{data.scenarioDescription}</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Reference Analysis Context</p>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{data.query}"</p>
                </div>
             </div>
          </div>
        </section>

        {/* 4. DUTIES SECTION */}
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-100 pb-2">III. Detailed Duty Matrix</h3>
          <div className="overflow-hidden rounded-[2rem] border-2 border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-blue-600">
                      <th className="p-5 font-black uppercase tracking-widest text-[10px] text-white">General (MFN) Rate</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[10px] text-white border-l border-blue-500">Special (FTA/Preferential)</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[10px] text-white border-l border-blue-500">Column 2 (Embargo)</th>
                   </tr>
                </thead>
                <tbody className="bg-white">
                   <tr>
                      <td className="p-6 font-black text-lg text-gray-900 align-top">{data.dutyInfo.general}</td>
                      <td className="p-6 text-sm font-bold text-blue-600 border-l border-gray-100 align-top">{data.dutyInfo.special}</td>
                      <td className="p-6 text-sm font-bold text-red-600 border-l border-gray-100 align-top">{data.dutyInfo.column2}</td>
                   </tr>
                </tbody>
              </table>
          </div>
        </section>

        {/* 5. ADDITIONAL TARIFF SECTION */}
        <section className="break-inside-avoid">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 mb-4 border-b border-red-100 pb-2">IV. Additional Trade Remedies & Tariffs</h3>
          <div className="bg-red-50 p-8 rounded-3xl border-2 border-red-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <svg className="w-32 h-32 text-red-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
             </div>
             <p className="text-sm text-red-900 leading-relaxed font-bold whitespace-pre-wrap relative z-10">
                {data.tariffInfo}
             </p>
             <div className="mt-6 pt-6 border-t border-red-200 flex items-center gap-4">
                 <div className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest">Active Flags: {stats?.additionalCount || 0}</div>
                 <p className="text-[10px] font-bold text-red-700 uppercase">Includes Section 232, 301, and IEEPA AD/CVD Surcharges.</p>
             </div>
          </div>
        </section>

        {/* Footer Disclaimer */}
        <section className="mt-auto pt-10 border-t-2 border-gray-100 break-inside-avoid">
            <p className="text-[9px] text-gray-400 leading-relaxed font-medium italic">
              LEGAL NOTICE: This automated audit is generated by the TEU-GLOBAL-AI-ASSISTANT. While based on real-time USITC/CBP data feeds, it is for decision-support only. Final legal liability for classification rests with the Importer of Record (IOR). Consultation with a licensed Customs Broker is required for final declaration.
            </p>
        </section>
      </main>

      <footer className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
        <span>© {new Date().getFullYear()} TEU GLOBAL - AI INTELLIGENCE UNIT</span>
        <span>AUDIT SECURE / PAGE 1 OF 1</span>
      </footer>
    </div>
  );
};

export default PrintableResult;
