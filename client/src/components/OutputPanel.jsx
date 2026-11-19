import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Clock,
  Info,
  TerminalSquare
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export default function OutputPanel({
  output,
  isRunning,
  runTriggeredBy,
  onClear
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;
    const textToCopy = [
      output.stdout ? `=== STDOUT ===\n${output.stdout}` : '',
      output.stderr ? `=== STDERR ===\n${output.stderr}` : ''
    ]
      .filter(Boolean)
      .join('\n\n');

    if (textToCopy) {
      const ok = await copyToClipboard(textToCopy);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const hasOutput = output && (output.stdout || output.stderr || output.upstreamNotice || output.error);

  return (
    <div className="flex flex-col h-full bg-[#181818]">
      {/* Panel Header */}
      <div className="h-9 bg-[#252526] border-b border-[#333333] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <TerminalSquare size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-gray-200">
            Output Console
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Room Synced
          </span>

          {/* Status Badge */}
          {isRunning ? (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium animate-pulse">
              <Activity size={11} className="animate-spin" />
              <span>{runTriggeredBy ? `Running (${runTriggeredBy})...` : 'Executing...'}</span>
            </span>
          ) : output ? (
            output.success ? (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <CheckCircle2 size={11} />
                Success (Code {output.exitCode ?? 0})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                <AlertCircle size={11} />
                Failed (Code {output.exitCode ?? 1})
              </span>
            )
          ) : (
            <span className="text-[11px] text-gray-500 font-normal">
              Idle
            </span>
          )}

          {/* Execution Time */}
          {output && output.durationMs !== undefined && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={11} />
              {output.durationMs}ms
            </span>
          )}
        </div>

        {/* Right action buttons: Copy & Clear */}
        <div className="flex items-center gap-2">
          {output?.source && (
            <span
              title={
                output.source === 'piston'
                  ? 'Executed remotely via Piston API'
                  : 'Executed safely via Local Fallback Sandbox'
              }
              className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                output.source === 'piston'
                  ? 'bg-blue-900/30 text-blue-400 border-blue-700/50'
                  : 'bg-amber-900/30 text-amber-300 border-amber-700/50'
              }`}
            >
              {output.source === 'piston' ? 'Piston API' : 'Local Fallback'}
            </span>
          )}

          {hasOutput && (
            <>
              <button
                onClick={handleCopy}
                title="Copy entire console output"
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#2d2d2d] transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={onClear}
                title="Clear console output for everyone in room"
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-[#2d2d2d] transition-colors"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Output Console Content Area */}
      <div className="flex-1 p-3 bg-[#121212] font-mono text-xs overflow-y-auto space-y-3">
        {/* Notice from upstream API if present */}
        {output?.upstreamNotice && (
          <div className="flex items-start gap-2 p-2.5 bg-amber-950/40 border border-amber-800/40 rounded text-amber-300 text-[11px]">
            <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold">Notice regarding Public Piston API:</p>
              <p className="text-amber-300/80 mt-0.5">{output.upstreamNotice}</p>
              <p className="text-amber-400/90 mt-1">
                Your code was successfully executed by the server's local sandbox runner.
              </p>
            </div>
          </div>
        )}

        {/* Global Error */}
        {output?.error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded text-rose-300">
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              <AlertCircle size={13} className="text-rose-400" />
              <span>Execution Error</span>
            </div>
            <pre className="whitespace-pre-wrap">{output.error}</pre>
            {output.details && (
              <pre className="text-gray-400 mt-1 whitespace-pre-wrap text-[11px]">
                {output.details}
              </pre>
            )}
          </div>
        )}

        {/* Standard Error (stderr) */}
        {output?.stderr && (
          <div className="p-3 bg-red-950/20 border border-red-800/30 rounded text-rose-300">
            <div className="flex items-center gap-1.5 font-semibold text-rose-400 mb-1">
              <AlertCircle size={13} />
              <span>Standard Error (stderr):</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed">
              {output.stderr}
            </pre>
          </div>
        )}

        {/* Standard Output (stdout) */}
        {output?.stdout ? (
          <div>
            {output.stderr && (
              <div className="text-[11px] font-semibold text-gray-400 mb-1">
                Standard Output (stdout):
              </div>
            )}
            <pre className="text-emerald-300 whitespace-pre-wrap font-mono text-[12px] leading-relaxed select-text">
              {output.stdout}
            </pre>
          </div>
        ) : output && !output.stderr && !output.error ? (
          <div className="text-gray-500 italic py-4 text-center">
            Program completed with no standard output.
          </div>
        ) : null}

        {/* Empty state when no output yet */}
        {!output && !isRunning && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-12 select-none">
            <TerminalSquare size={36} className="text-[#333333]" />
            <p className="text-xs">Click <strong className="text-gray-400">Run Code</strong> (or press Ctrl+Enter) to execute your program.</p>
            <p className="text-[11px] text-gray-600">Results will be displayed live to all collaborators in this room.</p>
          </div>
        )}

        {/* Loading placeholder when running */}
        {isRunning && (
          <div className="h-full flex flex-col items-center justify-center text-blue-400 gap-3 py-12">
            <Activity size={32} className="animate-spin text-blue-500" />
            <p className="text-xs font-medium">
              {runTriggeredBy
                ? `${runTriggeredBy} is running the code... Waiting for results...`
                : 'Forwarding code & waiting for execution output...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
