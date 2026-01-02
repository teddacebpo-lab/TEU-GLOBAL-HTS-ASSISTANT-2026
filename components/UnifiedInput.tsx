// Web Speech API type definitions for TypeScript
interface SpeechRecognitionResult {
  [index: number]: { transcript: string };
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  length: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COUNTRIES, FLEXIBLE_HTS_CODE_REGEX, ACTIVE_HTS_CODES } from '../constants';
import { UploadIcon, XCircleIcon, MicIcon, SearchIcon, StopCircleIcon, HtsCodeIcon, CheckCircleIcon, ShieldExclamationIcon } from './icons/Icons';
import { User, UserUsage } from '../types';

type View = 'classification' | 'lookup';

interface UnifiedInputProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onClassificationSubmit: (description: string, country: string, image: File | null) => void;
  onLookupSubmit: (htsCode: string) => void;
  isLoading: boolean;
  error: string | null;
  description: string;
  onDescriptionChange: React.Dispatch<React.SetStateAction<string>>;
  htsCode: string;
  onHtsCodeChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  onCancel: () => void;
  expiredHtsCodes: string[];
  currentUser: User;
  usage: UserUsage | null;
  limits: { text: number; image: number; };
}

/**
 * Component to highlight matching text segments
 */
const HighlightMatch: React.FC<{ text: string; match: string }> = ({ text, match }) => {
    if (!match.trim()) return <>{text}</>;
    
    const escapedMatch = match.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedMatch})`, 'gi'));

    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === match.toLowerCase() ? (
                    <mark key={i} className="bg-orange-200 dark:bg-blue-500/40 text-orange-900 dark:text-blue-100 rounded-sm font-bold">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const UnifiedInput: React.FC<UnifiedInputProps> = (props) => {
  const {
    currentView, setCurrentView, onClassificationSubmit, onLookupSubmit, isLoading, error,
    description, onDescriptionChange, htsCode, onHtsCodeChange, country, onCountryChange,
    onCancel, expiredHtsCodes, currentUser, usage, limits
  } = props;
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ code: string; description: string }[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      onDescriptionChange(prev => (prev ? prev.trim() + ' ' : '') + transcript.trim());
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
  }, [onDescriptionChange]);

  const handleVoiceInput = () => {
    if (!currentUser.features.canUseVoice) return;
    if (isRecording) {
      recognitionRef.current?.stop();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch(e) {
        setIsRecording(false);
      }
    }
  };

  const handleImageChange = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (currentView === 'classification') {
        if (description.trim() || image) {
            onClassificationSubmit(description, country, image);
            setImage(null);
            setImagePreview(null);
        }
    } else if (currentView === 'lookup') {
        if (htsCode.trim() && !validationError) {
            onLookupSubmit(htsCode);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (currentView === 'lookup' && isSuggestionsVisible && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsSuggestionsVisible(false);
            setActiveSuggestionIndex(-1);
        } else if (e.key === 'Enter') {
            if (activeSuggestionIndex > -1 && suggestions[activeSuggestionIndex]) {
                e.preventDefault();
                const suggestion = suggestions[activeSuggestionIndex];
                if (!expiredHtsCodes.includes(suggestion.code)) {
                    handleSuggestionClick(suggestion);
                }
            } else if (!isLoading && !validationError) {
                formRef.current?.requestSubmit();
            }
        }
    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading) formRef.current?.requestSubmit();
    }
  };

  const validateCode = useCallback((code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setValidationError(null);
      return;
    }
    
    if (expiredHtsCodes.includes(trimmedCode)) {
      setValidationError('This HTS code is marked as expired.');
      return;
    }

    if (/[^0-9.]/.test(trimmedCode)) {
      setValidationError('HTS code can only contain numbers and dots.');
      return;
    }

    const digits = trimmedCode.replace(/\./g, '');
    if (![4, 6, 8, 10].includes(digits.length)) {
      setValidationError(`HTS codes must have 4, 6, 8, or 10 digits.`);
      return;
    }

    if (!FLEXIBLE_HTS_CODE_REGEX.test(trimmedCode)) {
        setValidationError('Invalid HTS code format.');
        return;
    }
        
    setValidationError(null);
  }, [expiredHtsCodes]);
  
  useEffect(() => {
    if (currentView === 'lookup') {
      validateCode(htsCode);
      const term = htsCode.trim().toLowerCase();
      const termNoDots = term.replace(/\./g, '');

      if (term.length >= 2) {
          const filtered = ACTIVE_HTS_CODES.filter(c => {
            const codeNoDots = c.code.replace(/\./g, '');
            return (
                c.code.toLowerCase().includes(term) || 
                codeNoDots.includes(termNoDots) || 
                c.description.toLowerCase().includes(term)
            );
          });
          setSuggestions(filtered.slice(0, 6));
          setIsSuggestionsVisible(filtered.length > 0);
          setActiveSuggestionIndex(-1);
      } else {
          setSuggestions([]);
          setIsSuggestionsVisible(false);
      }
    } else {
        setValidationError(null);
        setSuggestions([]);
        setIsSuggestionsVisible(false);
    }
  }, [htsCode, currentView, validateCode]);

  const handleSuggestionClick = (suggestion: { code: string; description: string }) => {
    if (expiredHtsCodes.includes(suggestion.code)) return;
    onHtsCodeChange(suggestion.code);
    setIsSuggestionsVisible(false);
    setActiveSuggestionIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  
  const renderClassificationInput = () => (
    <div className="relative">
      <textarea
        id="description"
        rows={1}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full py-4 px-5 pr-12 bg-light-bg/40 dark:bg-dark-surface/40 backdrop-blur-md border border-accent dark:border-dark-border rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none text-sm shadow-soft hover-themed"
        placeholder="Describe product for neural classification (e.g. 'cotton t-shirt')..."
        maxLength={2000}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <button 
            type="button" 
            onClick={handleVoiceInput} 
            className={`p-2.5 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-400 hover:text-accent'} disabled:opacity-30`}
            disabled={!currentUser.features.canUseVoice}
            title={isRecording ? 'Stop Recording' : 'Voice Input'}
        >
            {isRecording ? <StopCircleIcon className="w-5 h-5"/> : <MicIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
  
  const renderLookupInput = () => {
    const isValid = htsCode.trim() && !validationError;
    const borderClass = validationError ? 'border-red-500 ring-red-500' : isValid ? 'border-green-500 ring-green-500' : 'border-accent dark:border-dark-border focus:ring-accent';

    return (
        <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <HtsCodeIcon className="h-5 w-5 text-zinc-400" />
            </div>
            <input
                ref={inputRef}
                type="text"
                id="hts-code"
                value={htsCode}
                onChange={(e) => onHtsCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsSuggestionsVisible(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200) }
                className={`w-full p-4 pl-12 pr-12 bg-light-bg/40 dark:bg-dark-surface/40 backdrop-blur-md border rounded-2xl transition-all shadow-soft focus:ring-2 focus:border-transparent hover-themed ${borderClass}`}
                placeholder="Enter 10-digit HTS Code..."
                autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {isValid && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                {validationError && <XCircleIcon className="h-5 w-5 text-red-500" />}
            </div>
            
            {isSuggestionsVisible && (
                <ul className="absolute z-[100] bottom-full mb-3 w-full bg-white/70 dark:bg-dark-surface/70 border-2 border-accent rounded-2xl shadow-2xl overflow-hidden animate-slide-up backdrop-blur-lg">
                    <li className="px-4 py-2.5 bg-zinc-50/40 dark:bg-dark-bg/40 border-b border-accent text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Intelligence Index
                    </li>
                    {suggestions.map((s, index) => {
                        const isExpired = expiredHtsCodes.includes(s.code);
                        const isSelected = index === activeSuggestionIndex;
                        return (
                            <li 
                                key={s.code} 
                                onMouseDown={(e) => { e.preventDefault(); if(!isExpired) handleSuggestionClick(s); }}
                                className={`px-4 py-4 flex flex-col gap-1 border-b border-zinc-100/30 dark:border-zinc-800/30 last:border-0 transition-colors cursor-pointer ${isExpired ? 'opacity-50 grayscale' : ''} ${isSelected ? 'bg-accent/10 dark:bg-blue-500/10' : 'hover:bg-zinc-50/20 dark:hover:bg-zinc-800/20'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono font-black text-sm text-primary-blue dark:text-accent">
                                        <HighlightMatch text={s.code} match={htsCode.trim()} />
                                    </span>
                                    {isExpired && <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Expired</span>}
                                </div>
                                <span className="text-[10px] font-bold text-light-text-secondary dark:text-dark-text-secondary truncate">
                                    <HighlightMatch text={s.description} match={htsCode.trim()} />
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    );
  };
  
  const isTextLimitReached = limits.text !== Infinity && usage && usage.textQueries >= limits.text;
  const isImageLimitReached = limits.image !== Infinity && usage && usage.imageQueries >= limits.image;

  let isSubmitDisabled = isLoading || !!validationError;

  if (currentView === 'classification') {
    if (image && isImageLimitReached) {
        isSubmitDisabled = true;
    } else if (!image && isTextLimitReached) {
        isSubmitDisabled = true;
    } else if (!image && !description.trim()) {
        isSubmitDisabled = true;
    }
  } else {
      if (isTextLimitReached) {
          isSubmitDisabled = true;
      } else if (!htsCode.trim()) {
          isSubmitDisabled = true;
      }
  }

  return (
    <div className="bg-white/45 dark:bg-dark-surface/45 backdrop-blur-lg p-5 rounded-[2rem] border border-accent dark:border-dark-border shadow-xl relative z-10 hover-themed transition-all">
        <div className="flex gap-2 mb-5 bg-zinc-100/20 dark:bg-dark-bg/20 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-accent/20" role="tablist">
            <button 
                onClick={() => setCurrentView('classification')} 
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentView === 'classification' ? 'bg-primary-blue/70 dark:bg-accent/70 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
                Classification
            </button>
            <button 
                onClick={() => setCurrentView('lookup')} 
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentView === 'lookup' ? 'bg-primary-blue/70 dark:bg-accent/70 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
                HTS Lookup
            </button>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
             {currentView === 'classification' ? renderClassificationInput() : renderLookupInput()}
             
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    {currentView === 'classification' && (
                        <select
                            value={country}
                            onChange={(e) => onCountryChange(e.target.value)}
                            className="bg-zinc-100/40 dark:bg-dark-bg/40 backdrop-blur-sm border border-accent/20 p-2.5 rounded-xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-accent transition-all hover-themed"
                        >
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                    
                    {currentView === 'classification' && (
                        <div className="flex items-center gap-2">
                             <label 
                                htmlFor="file-upload"
                                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] p-2.5 rounded-xl border-2 border-dashed ${image ? 'bg-green-50/30 dark:bg-green-900/10 border-green-500 text-green-600' : 'bg-zinc-100/30 dark:bg-dark-bg/30 border-accent/20 text-zinc-500 hover:border-accent hover:text-accent cursor-pointer'} ${!currentUser.features.canUploadImage && 'opacity-50 cursor-not-allowed'} transition-all backdrop-blur-sm`}
                             >
                                <UploadIcon className="w-4 h-4"/>
                                <span>{image ? "ATTACHED" : "UPLOAD IMAGE"}</span>
                                <input id="file-upload" ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleImageChange(e.target.files)} accept="image/*" disabled={!currentUser.features.canUploadImage}/>
                             </label>
                            {imagePreview && (
                                <div className="relative group">
                                    <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded-xl object-cover border border-accent shadow-md"/>
                                    <button type="button" onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircleIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                 <div className="flex items-center gap-2">
                    {isLoading ? (
                        <button type="button" onClick={onCancel} className="flex items-center justify-center h-12 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-white bg-red-600/80 backdrop-blur-sm rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all active:scale-95">
                            Abort
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={isSubmitDisabled} 
                            className="flex items-center justify-center h-12 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-white bg-primary-blue/80 dark:bg-accent/80 backdrop-blur-sm rounded-xl shadow-xl transition-all btn-hover-themed active:scale-95 disabled:opacity-30 disabled:grayscale disabled:shadow-none"
                        >
                            <SearchIcon className="w-4 h-4 mr-3" />
                            {currentView === 'classification' ? 'Classify' : 'Lookup'}
                        </button>
                    )}
                </div>
            </div>
        </form>
    </div>
  );
};