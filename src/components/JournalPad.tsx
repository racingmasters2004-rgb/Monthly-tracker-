import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { Check, Edit3 } from 'lucide-react';

interface JournalPadProps {
  journal: JournalEntry;
  onSaveJournal: (content: string) => void;
}

export const JournalPad: React.FC<JournalPadProps> = ({
  journal,
  onSaveJournal,
}) => {
  const [content, setContent] = useState<string>(journal.content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const isFocusedRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external content only when not focused
  useEffect(() => {
    if (!isFocusedRef.current && journal.content !== content) {
      setContent(journal.content);
    }
  }, [journal.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSaveJournal(val);
      setSaveStatus('saved');
    }, 900);
  };

  return (
    <div className="space-y-2 mb-8">
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-disp font-bold text-[17px] text-[#10202B] flex items-center gap-2">
          <span>Journal</span>
          <span className="font-mono-code text-[9.5px] uppercase tracking-wider border border-[#10202B] text-[#10202B] px-2 py-0.5 rounded-full">
            scratchpad
          </span>
        </h2>

        {/* Autosave status indicator */}
        <div className="flex items-center gap-1 font-mono-code text-[10px] text-[#2A7F73]">
          {saveStatus === 'saved' ? (
            <>
              <Check className="w-3 h-3 text-[#4C8557]" />
              <span className="text-[#4C8557] font-medium">Saved</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A017] animate-ping" />
              <span className="text-[#D9A017] font-medium">Saving...</span>
            </>
          )}
        </div>
      </div>

      <div className="relative rounded-[12px] overflow-hidden shadow-xs">
        <textarea
          value={content}
          onChange={handleChange}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            // Force save immediately on blur
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            onSaveJournal(content);
            setSaveStatus('saved');
          }}
          placeholder="Anything on your mind... thoughts, meeting notes, reflection, priorities. Automatically saved as you write."
          className="journal-pad"
        />
      </div>
    </div>
  );
};
