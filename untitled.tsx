
// untitled.tsx
// Fix: Added missing imports for React and hooks, types, icons, and components.
import React, { useRef, useEffect } from 'react';
import { PrintData } from './types';
import { UserIcon } from './components/icons/Icons';
import { ChatWindowProps, AiMessage } from './components/ResponseDisplay';

// Added expiredHtsCodes to the destructured props for ChatWindow.
const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onAddExpiredHts, setPrintData, analysis, expiredHtsCodes }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handlePrintRequest = (aiResponseText: string) => {
        const lastUserMessage = messages.slice().reverse().find(m => m.sender === 'user');
        if (!lastUserMessage) {
            alert("Cannot print: Could not find the original query.");
            return;
        }
        
        const lastAnalysisData = analysis?.data;
        if (!lastAnalysisData) {
            alert("Cannot print: No structured analysis data is available for this response.");
            return;
        }

        const data: PrintData = {
            query: lastUserMessage.text,
            htsCode: lastAnalysisData.recommendations[0]?.htsCode || 'N/A',
            scenarioDescription: lastAnalysisData.recommendations[0]?.scenario || 'N/A',
            dutyInfo: {
                // Fix: Access baseDuty directly from QuickStatsData object instead of attempting .find() on it.
                // Property 'find' does not exist on type 'QuickStatsData' because it is an object, not an array.
                general: lastAnalysisData.quickStats.baseDuty !== undefined ? `${lastAnalysisData.quickStats.baseDuty}%` : 'N/A',
                special: 'Variable (See report)',
                column2: 'Variable (See report)',
            },
            tariffInfo: aiResponseText.match(/\*\*(?:ADDITIONAL TARIFFS?)\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i)?.[1].trim() || 'Not specified.',
            complianceInfo: aiResponseText.match(/\*\*(?:COMPLIANCE|POTENTIAL COMPLIANCE FLAGS)\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i)?.[1].trim() || 'Not specified.',
        };
        setPrintData(data);
    };

    return (
        <div className="space-y-6">
            {messages.map((msg) => (
                <div key={msg.id}>
                    {msg.sender === 'user' ? (
                        <div className="flex items-start justify-end gap-4 animate-slide-up">
                            <div className="bg-primary-blue dark:bg-accent text-white p-3 rounded-lg max-w-xl shadow-md">
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center flex-shrink-0 mt-1">
                                <UserIcon className="w-5 h-5" />
                            </div>
                        </div>
                    ) : (
                       <AiMessage 
                            text={msg.text} 
                            onAddExpiredHts={onAddExpiredHts}
                            onPrintRequest={handlePrintRequest}
                            analysisData={analysis?.messageId === msg.id ? analysis.data : null}
                            // Added expiredHtsCodes to satisfy prop requirements for AiMessage component.
                            expiredHtsCodes={expiredHtsCodes}
                        />
                    )}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};
