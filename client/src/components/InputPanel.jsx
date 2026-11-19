import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, ArrowDownToLine, Lock } from 'lucide-react';

export default function InputPanel({
  yStdin,
  defaultInput,
  canEdit = true
}) {
  const [stdin, setStdin] = useState(() => (yStdin ? yStdin.toString() : ''));
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!yStdin) return;

    const initialVal = yStdin.toString();
    setStdin(initialVal);

    const observer = () => {
      const currentVal = yStdin.toString();
      if (textareaRef.current && textareaRef.current.value !== currentVal) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        setStdin(currentVal);
        // Preserve user's cursor position during remote edits
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start;
            textareaRef.current.selectionEnd = end;
          }
        });
      }
    };

    yStdin.observe(observer);
    return () => {
      yStdin.unobserve(observer);
    };
  }, [yStdin]);

  const handleChange = (newVal) => {
    if (!canEdit) return;
    setStdin(newVal);
    if (yStdin && yStdin.doc) {
      yStdin.doc.transact(() => {
        const oldVal = yStdin.toString();
        if (oldVal !== newVal) {
          yStdin.delete(0, oldVal.length);
          yStdin.insert(0, newVal);
        }
      });
    }
  };

  const handleClear = () => {
    if (!canEdit) return;
    handleChange('');
  };

  const handleLoadDefault = () => {
    if (!canEdit) return;
    if (defaultInput) {
      handleChange(defaultInput);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] border-b border-[#333333]">
      {/* Panel Header */}
      <div className="h-9 bg-[#252526] border-b border-[#333333] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-gray-200">
            Custom Input (stdin)
          </span>
          {!canEdit ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Lock size={9} /> View Only
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Synced
            </span>
          )}
          {stdin.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#333333] text-gray-400">
              {stdin.length} chars
            </span>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {defaultInput && (
              <button
                onClick={handleLoadDefault}
                title="Fill with sample test input for everyone in room"
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-400 px-2 py-0.5 rounded hover:bg-[#2d2d2d] transition-colors cursor-pointer"
              >
                <ArrowDownToLine size={12} />
                <span>Sample Input</span>
              </button>
            )}

            {stdin.length > 0 && (
              <button
                onClick={handleClear}
                title="Clear input for everyone in room"
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-[#2d2d2d] transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input Textarea */}
      <div className="flex-1 p-2 bg-[#181818] relative">
        <textarea
          ref={textareaRef}
          value={stdin}
          readOnly={!canEdit}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={
            canEdit
              ? "Enter standard input (stdin) here. Live synced with everyone in the room..."
              : "Standard input is in View-Only mode. Ask Host for edit access."
          }
          className={`w-full h-full bg-[#1e1e1e] text-gray-100 font-mono text-xs p-3 rounded border border-[#333333] focus:outline-none resize-none transition-colors placeholder:text-gray-500 ${
            !canEdit ? 'opacity-70 cursor-not-allowed border-amber-900/30' : 'focus:border-blue-500/70'
          }`}
          spellCheck="false"
        />
      </div>
    </div>
  );
}
