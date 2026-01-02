
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    DocumentTextIcon, DollarIcon, AlertTriangleIcon, 
    BookIcon, GavelIcon, CheckCircleIcon, ExternalLinkIcon,
    ShieldExclamationIcon
} from './icons/Icons';

interface Props {
  content: string;
  expiredHtsCodes: string[];
}

const MarkdownRenderer: React.FC<Props> = ({ content, expiredHtsCodes }) => {
  // Pre-process content to turn HTS codes, rulings, and section references into clickable links
  const processedContent = useMemo(() => {
    if (!content) return "";
    let processed = content;

    // 1. Enhanced HTS Code linking (format XXXX.XX.XXXX)
    const htsRegex = /\b(\d{4})\.(\d{2})\.(\d{4})\b/g;
    processed = processed.replace(htsRegex, (match) => {
      const cleanCode = match.replace(/\./g, '');
      return `[${match}](https://hts.usitc.gov/search?query=${cleanCode} "View official HTSUS entry for ${match}")`; 
    });

    // 2. Enhanced CROSS Ruling Numbers
    const rulingRegex = /\b(?:HQ?\s?\d{6}|N\d{6}|H\d{6})\b/g;
    processed = processed.replace(rulingRegex, (match) => {
      const digitsOnly = match.replace(/\D/g, "");
      return `[${match}](https://rulings.cbp.gov/search?term=${digitsOnly} "View CBP Ruling ${match}")`;
    });

    // 3. Section/Chapter/Heading Notes references
    const sectionRefRegex = /\b(Section|Chapter|Heading)\s+(\d+(?:\.\d+)?)\b/gi;
    processed = processed.replace(sectionRefRegex, (match, type, number) => {
      const searchQuery = `${type} ${number}`.replace(/\s+/g, '+');
      return `[${match}](https://hts.usitc.gov/search?query=${encodeURIComponent(searchQuery)} "View ${type} ${number} in HTSUS")`;
    });

    return processed;
  }, [content]);

  const getHeaderIcon = (text: string) => {
      if (text.includes('HTS')) return <DocumentTextIcon className="w-5 h-5 mr-2" />;
      if (text.includes('Duty') || text.includes('DUTIES')) return <DollarIcon className="w-5 h-5 mr-2" />;
      if (text.includes('Compliance') || text.includes('Alert')) return <AlertTriangleIcon className="w-5 h-5 mr-2" />;
      if (text.includes('Rationale')) return <BookIcon className="w-5 h-5 mr-2" />;
      if (text.includes('Ruling')) return <GavelIcon className="w-5 h-5 mr-2" />;
      return <CheckCircleIcon className="w-5 h-5 mr-2" />;
  };

  return (
    <div className="prose dark:prose-invert max-w-none text-base leading-relaxed text-light-text-secondary dark:text-dark-text-secondary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-black text-primary-blue dark:text-accent mb-6 tracking-tight" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mt-8 mb-4 border-b border-zinc-100 dark:border-dark-border pb-2" {...props} />,
          strong: ({node, children, ...props}) => {
             const text = String(children);
             const headers = ['HTS', 'DUTIES', 'ADDITIONAL TARIFF', 'COMPLIANCE', 'CLASSIFICATION RATIONALE', 'SUPPORTING NOTES/RULINGS', 'IMPORTER PRO-TIPS', 'HTS PROFILE', 'POTENTIAL COMPLIANCE FLAGS'];
             
             if (headers.some(h => text.includes(h))) {
                 let colorClass = "bg-zinc-100 text-black dark:bg-zinc-800 dark:text-zinc-200"; 
                 if (text.includes('HTS')) colorClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
                 if (text.includes('DUTY') || text.includes('DUTIES')) colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
                 if (text.includes('TARIFF')) colorClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
                 if (text.includes('COMPLIANCE')) colorClass = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";

                 return (
                    <div className={`flex items-center text-sm font-black mt-8 mb-4 px-4 py-3 rounded-xl border ${colorClass} shadow-soft`}>
                        {getHeaderIcon(text)}
                        <span className="uppercase tracking-widest">{children}</span>
                    </div>
                 );
             }
             return <strong className="font-bold text-light-text-primary dark:text-dark-text-primary" {...props}>{children}</strong>;
          },
          a: ({node, href, title, children, ...props}) => {
             const isHts = href?.includes('hts.usitc.gov');
             const text = String(children);
             const isExpired = isHts && expiredHtsCodes.some(code => 
                code.replace(/\./g, '') === text.replace(/\./g, '')
             );
             
             return (
                 <a href={href} target="_blank" rel="noopener noreferrer" title={isExpired ? "EXPIRED HTS CODE - INVALID FOR 2025" : (title || "View Reference")}
                    className={`inline-flex items-center gap-1 font-bold no-underline px-2 py-0.5 rounded-md transition-colors ${
                        isExpired 
                        ? 'bg-red-500/10 text-red-600 border border-red-500/50 line-through decoration-red-500/50' 
                        : isHts 
                            ? 'text-primary-blue bg-blue-50 border border-blue-200 dark:text-accent dark:bg-orange-900/20 dark:border-orange-800/50' 
                            : 'text-primary-blue dark:text-accent hover:underline'
                    }`}
                    {...props}>
                    {isExpired && <ShieldExclamationIcon className="w-3.5 h-3.5 text-red-500" />}
                    {children}
                    {!isExpired && <ExternalLinkIcon className="w-3 h-3" />}
                 </a>
             )
          },
          table: ({node, ...props}) => (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-dark-border shadow-soft my-6 bg-white dark:bg-dark-surface/30">
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-zinc-200 dark:divide-dark-border" {...props} />
               </div>
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-zinc-50 dark:bg-dark-bg/50" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-left text-[10px] font-black text-black dark:text-zinc-400 uppercase tracking-widest" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-zinc-200 dark:divide-dark-border bg-transparent" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-zinc-50/50 dark:hover:bg-dark-bg/30 transition-colors" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-light-text-secondary dark:text-dark-text-secondary leading-snug font-medium" {...props} />,
          code: ({node, className, children, ...props}) => (
             <code className="bg-zinc-100 dark:bg-dark-bg px-1.5 py-0.5 rounded font-mono text-xs text-pink-600 dark:text-pink-400 border border-zinc-200 dark:border-dark-border" {...props}>
                {children}
             </code>
          ),
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-2 mb-6" {...props} />,
          li: ({node, ...props}) => <li className="pl-1 marker:text-black dark:marker:text-zinc-600" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-blue dark:border-accent bg-blue-50/30 dark:bg-orange-900/10 pl-4 py-2 my-6 italic text-light-text-secondary dark:text-dark-text-secondary rounded-r-lg" {...props} />
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
