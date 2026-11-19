import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { FileCode, Sparkles, Lock, Pencil, Eye } from 'lucide-react';

export default function CodeEditor({
  language,
  yText,
  provider,
  onRun,
  fontSize = 14,
  collaborators = [],
  canEdit = true
}) {
  const [editorInstance, setEditorInstance] = useState(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);

  // Set up Monaco when mounted
  const handleEditorDidMount = (editor, monaco) => {
    monacoRef.current = monaco;
    setEditorInstance(editor);

    // Apply read-only mode if guest is View-Only
    editor.updateOptions({
      readOnly: !canEdit,
      domReadOnly: !canEdit
    });

    // Add Ctrl+Enter / Cmd+Enter keybinding to trigger run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun && canEdit) {
        onRun();
      }
    });

    editor.focus();
  };

  // Dynamically update Monaco's readOnly mode when permissions change in real time
  useEffect(() => {
    if (editorInstance) {
      editorInstance.updateOptions({
        readOnly: !canEdit,
        domReadOnly: !canEdit
      });
    }
  }, [editorInstance, canEdit]);

  // Bind Yjs Text & Awareness to Monaco Model whenever editor, yText, or provider becomes available
  useEffect(() => {
    if (!editorInstance || !yText || !provider) return;

    const model = editorInstance.getModel();
    if (!model) return;

    // Clean up any existing binding before creating a new one
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    try {
      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editorInstance]),
        provider.awareness
      );
    } catch (err) {
      console.error('MonacoBinding creation error:', err);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editorInstance, yText, provider]);

  // Update Monaco language mode whenever language changes
  useEffect(() => {
    if (editorInstance && monacoRef.current && language?.monacoLang) {
      const model = editorInstance.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language.monacoLang);
      }
    }
  }, [editorInstance, language]);

  // Dynamic remote cursor & selection styling based on collaborator colors and names
  useEffect(() => {
    if (!provider?.awareness) return;

    const updateCursorStyles = () => {
      let styleEl = document.getElementById('yjs-cursor-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'yjs-cursor-styles';
        document.head.appendChild(styleEl);
      }

      let css = '';
      provider.awareness.getStates().forEach((state, clientID) => {
        if (state.user) {
          const { name, color } = state.user;
          const safeColor = color || '#38bdf8';
          const safeName = (name || 'Collaborator').replace(/"/g, '\\"');
          css += `
            .yRemoteSelection-${clientID} {
              background-color: ${safeColor}33 !important;
            }
            .yRemoteSelectionHead-${clientID} {
              border-color: ${safeColor} !important;
            }
            .yRemoteSelectionHead-${clientID}::after {
              border-color: ${safeColor} !important;
            }
            .yRemoteSelectionHead-${clientID}::before {
              content: "${safeName}";
              background-color: ${safeColor} !important;
            }
          `;
        }
      });
      styleEl.innerHTML = css;
    };

    updateCursorStyles();
    provider.awareness.on('change', updateCursorStyles);

    return () => {
      provider.awareness.off('change', updateCursorStyles);
    };
  }, [provider]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#333333] relative">
      {/* Editor Header Tab */}
      <div className="h-9 bg-[#252526] border-b border-[#333333] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1e1e1e] border-t-2 border-blue-500 text-xs font-medium text-white rounded-t">
            <FileCode size={13} className="text-blue-400" />
            <span>main{language.fileExt}</span>
          </div>

          {/* Permission Status Badge */}
          {canEdit ? (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <Pencil size={11} />
              <span>Can Edit</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium animate-pulse">
              <Lock size={11} />
              <span>View Only</span>
            </span>
          )}

          {collaborators.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 bg-[#333333] px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{collaborators.length} Peers</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-gray-500">
            <Sparkles size={11} className="text-amber-400" />
            Live Yjs Monaco
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#2d2d2d] text-gray-300 font-mono">
            {language.name}
          </span>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 w-full overflow-hidden relative">
        <Editor
          height="100%"
          language={language.monacoLang}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full text-xs text-gray-400">
              Loading Monaco Editor...
            </div>
          }
          options={{
            fontSize,
            fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            formatOnPaste: false,
            formatOnType: false,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            readOnly: !canEdit,
            domReadOnly: !canEdit
          }}
        />

        {/* View-Only Overlay Floating Banner for Guests */}
        {!canEdit && (
          <div className="absolute bottom-3 right-3 bg-amber-950/90 border border-amber-600/50 text-amber-200 text-xs px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-2 pointer-events-none z-10">
            <Lock size={13} className="text-amber-400" />
            <span>You are in <strong>View-Only</strong> mode. Ask the Host to grant you edit access.</span>
          </div>
        )}
      </div>
    </div>
  );
}
