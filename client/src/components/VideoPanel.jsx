import React from 'react';
import { Video, ChevronRight, Users, X, AlertCircle } from 'lucide-react';
import VideoTile from './VideoTile';

export default function VideoPanel({
  isOpen,
  onClose,
  localStream,
  currentUser,
  isHost,
  isMuted,
  isCameraOn,
  remotePeers = [],
  permissionError
}) {
  if (!isOpen) return null;

  const totalParticipants = 1 + remotePeers.length;

  return (
    <div className="w-72 md:w-80 h-full bg-[#1e1e1e] border-l border-[#333333] flex flex-col z-10 shadow-2xl transition-all select-none">
      {/* Panel Header */}
      <div className="h-12 bg-[#252526] border-b border-[#333333] px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video size={16} className="text-emerald-400" />
          <h3 className="text-xs md:text-sm font-semibold text-white">
            Audio & Video Call
          </h3>
          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#333333] text-gray-300">
            {totalParticipants}
          </span>
        </div>

        <button
          onClick={onClose}
          title="Minimize video dock"
          className="p-1 text-gray-400 hover:text-white hover:bg-[#333333] rounded transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Permission Warning Banner if mic/camera access failed */}
      {permissionError && (
        <div className="p-2.5 bg-rose-950/60 border-b border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[11px]">Media Device Notice</p>
            <p className="text-[10px] text-rose-300/80">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Video Tiles Grid / Stack */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Local User Tile */}
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 flex items-center justify-between">
            <span>You</span>
            <span className="text-[10px] font-normal text-emerald-400">
              {!isMuted ? 'Speaking' : 'Muted'}
            </span>
          </div>
          <VideoTile
            stream={localStream}
            name={currentUser.name}
            color={currentUser.color}
            isHost={isHost}
            isLocal={true}
            isMuted={isMuted}
            isCameraOn={isCameraOn}
          />
        </div>

        {/* Remote Peers Tiles */}
        {remotePeers.length > 0 && (
          <div className="pt-2 border-t border-[#2d2d2d] space-y-3">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center justify-between">
              <span>Peers in Call</span>
              <span className="text-[10px] font-normal text-gray-400">
                {remotePeers.length} online
              </span>
            </div>

            {remotePeers.map((peer) => (
              <VideoTile
                key={peer.userId}
                stream={peer.stream}
                name={peer.name}
                color={peer.color}
                isHost={peer.isHost}
                isLocal={false}
                isMuted={peer.isMuted}
                isCameraOn={peer.isCameraOn}
              />
            ))}
          </div>
        )}

        {remotePeers.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-xs">
            <Users size={28} className="mx-auto mb-2 text-[#444444]" />
            <p>No other peers in call yet.</p>
            <p className="text-[11px] text-gray-600 mt-1">Share the invite link to chat with friends!</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#181818] border-t border-[#333333] text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>WebRTC P2P Mesh Connected</span>
      </div>
    </div>
  );
}
