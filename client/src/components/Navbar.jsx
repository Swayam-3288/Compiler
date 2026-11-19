import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Code2,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Share2,
  Users,
  LogOut,
  Crown,
  Shield,
  Lock
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../config/languages';
import { copyToClipboard } from '../utils/clipboard';

export default function Navbar({
  selectedLanguage,
  onLanguageChange,
  onResetCode,
  onRun,
  isRunning,
  runTriggeredBy,
  serverStatus,
  roomId,
  currentUser,
  isHost,
  canEdit = true,
  collaborators = [],
  onLeaveRoom,
  isSidebarOpen,
  onToggleSidebar
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyId = async () => {
    const ok = await copyToClipboard(roomId);
    if (ok) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <header className="h-14 bg-[#1e1e1e] border-b border-[#333333] px-3 md:px-4 flex items-center justify-between select-none">
      {/* Left Section: Branding, Room ID, Invite Link & Language Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Branding */}
        <div className="flex items-center gap-2 font-semibold text-white tracking-wide">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm shadow-blue-500/20">
            <Code2 size={18} />
          </div>
          <span className="hidden sm:inline-block text-sm md:text-base font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            CodeCraft
          </span>
        </div>

        {/* Vertical divider */}
        <div className="h-5 w-[1px] bg-[#333333] hidden sm:block" />

        {/* Room Info Badge & Invite Link Button */}
        {roomId && (
          <div className="flex items-center gap-1.5">
            {/* Room ID pill with copy */}
            <div
              onClick={handleCopyId}
              title="Click to copy Room ID"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#282828] hover:bg-[#333333] border border-[#3e3e3e] rounded-md text-xs font-mono text-gray-200 cursor-pointer transition-colors"
            >
              <span className="text-gray-400 text-[11px] hidden md:inline">Room:</span>
              <span className="font-semibold text-blue-400">{roomId}</span>
              {copiedId ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={11} className="text-gray-400" />
              )}
            </div>

            {/* Copy Invite Link Button */}
            <button
              onClick={handleCopyLink}
              title="Copy shareable invite link"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={12} />
                  <span className="hidden md:inline">Invite</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Vertical divider */}
        <div className="h-5 w-[1px] bg-[#333333]" />

        {/* Language selector dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              id="language-select"
              value={selectedLanguage.id}
              disabled={!canEdit}
              onChange={(e) => {
                const lang = SUPPORTED_LANGUAGES.find((l) => l.id === e.target.value);
                if (lang) onLanguageChange(lang);
              }}
              title={!canEdit ? 'Only editors can switch language' : 'Select language'}
              className={`bg-[#2d2d2d] text-white text-xs md:text-sm font-medium rounded-md px-3 py-1.5 pr-8 border border-[#444444] focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none ${
                !canEdit ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#383838]'
              }`}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.badge})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Reset Code Template Button (Only for users with edit access) */}
          {canEdit && (
            <button
              onClick={onResetCode}
              title="Reset code template (syncs across room)"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-[#2d2d2d] transition-colors"
            >
              <RotateCcw size={13} />
              <span className="hidden lg:inline">Reset Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Section: Role Badge, Participants Sidebar Toggle, Run Button & Leave */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* User Role Badge */}
        <div
          title={isHost ? 'You are the Host (Full permissions)' : canEdit ? 'You are a Guest with Edit permissions' : 'You are a Guest in View-Only mode'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
            isHost
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : canEdit
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-700/30 text-gray-300 border-[#444444]'
          }`}
        >
          {isHost ? (
            <>
              <Crown size={12} className="text-amber-400" />
              <span>Host</span>
            </>
          ) : (
            <>
              <Shield size={12} className={canEdit ? 'text-emerald-400' : 'text-gray-400'} />
              <span>Guest</span>
              <span className="text-[10px] font-normal text-gray-400 hidden lg:inline">
                ({canEdit ? 'Can Edit' : 'View Only'})
              </span>
            </>
          )}
        </div>

        {/* Collapsible Participants Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          title="Toggle Participants Sidebar"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            isSidebarOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-[#252526] hover:bg-[#2d2d2d] text-gray-300 border-[#333333]'
          }`}
        >
          <Users size={13} className={isSidebarOpen ? 'text-white' : 'text-blue-400'} />
          <span className="hidden sm:inline">Participants</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            isSidebarOpen ? 'bg-blue-700 text-white' : 'bg-[#333333] text-gray-300'
          }`}>
            {collaborators.length}
          </span>
        </button>

        {/* Run Code Button */}
        <button
          onClick={onRun}
          disabled={isRunning || !canEdit}
          title={
            !canEdit
              ? 'View-Only mode: Only users with Edit permission can run code'
              : 'Run Code for everyone in the room (Ctrl + Enter)'
          }
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold text-xs md:text-sm text-white shadow-md transition-all ${
            isRunning
              ? 'bg-blue-600/70 cursor-not-allowed'
              : !canEdit
              ? 'bg-[#333333] text-gray-400 border border-[#444444] cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-emerald-900/30 cursor-pointer'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 size={15} className="animate-spin text-white" />
              <span>
                {runTriggeredBy ? `Running (${runTriggeredBy})...` : 'Running...'}
              </span>
            </>
          ) : !canEdit ? (
            <>
              <Lock size={13} className="text-gray-400" />
              <span>Locked</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-current text-white" />
              <span>Run Code</span>
              <kbd className="hidden xl:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-700/60 rounded text-emerald-200">
                Ctrl+Enter
              </kbd>
            </>
          )}
        </button>

        {/* Leave Room Button */}
        {onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            title="Leave current room and return to landing page"
            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-[#2d2d2d] rounded-md transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
