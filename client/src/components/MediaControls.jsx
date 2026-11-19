import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Tv,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function MediaControls({
  isMuted,
  isCameraOn,
  onToggleMute,
  onToggleCamera,
  isVideoPanelOpen,
  onToggleVideoPanel,
  onLeaveRoom,
  activePeersCount = 0
}) {
  return (
    <div className="h-12 bg-[#1c1c1c] border-t border-[#333333] px-4 flex items-center justify-between z-20 select-none">
      {/* Left info pill */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#252526] border border-[#333333] text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>WebRTC Audio/Video</span>
        </span>
      </div>

      {/* Center Controls Dock */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mic Toggle Button (Mute/Unmute) */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          <span className="hidden sm:inline">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        {/* Camera Toggle Button (On/Off) */}
        <button
          onClick={onToggleCamera}
          title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            !isCameraOn
              ? 'bg-[#2a2a2a] hover:bg-[#333333] text-gray-300 border border-[#444444]'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
          }`}
        >
          {!isCameraOn ? <VideoOff size={15} /> : <Video size={15} />}
          <span className="hidden sm:inline">
            {isCameraOn ? 'Stop Video' : 'Start Video'}
          </span>
        </button>

        {/* Video Panel Toggle Button */}
        <button
          onClick={onToggleVideoPanel}
          title={isVideoPanelOpen ? 'Hide Video Tiles' : 'Show Video Tiles'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isVideoPanelOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-[#252526] hover:bg-[#2d2d2d] text-gray-300 border-[#333333]'
          }`}
        >
          <Tv size={14} className={isVideoPanelOpen ? 'text-white' : 'text-indigo-400'} />
          <span className="hidden md:inline">Video Call</span>
          {activePeersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#333333] text-gray-200">
              {activePeersCount + 1}
            </span>
          )}
          {isVideoPanelOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {/* Right: Leave Room Button */}
      <div className="flex items-center">
        <button
          onClick={onLeaveRoom}
          title="Leave Room"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/30 transition-all cursor-pointer"
        >
          <PhoneOff size={14} />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
}
