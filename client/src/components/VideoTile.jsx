import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react';

export default function VideoTile({
  stream,
  name,
  color = '#38bdf8',
  isHost = false,
  isLocal = false,
  isMuted = true,
  isCameraOn = false
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream, isCameraOn]);

  // Attach remote stream to audio element (local is muted to avoid feedback)
  useEffect(() => {
    if (audioRef.current && !isLocal) {
      audioRef.current.srcObject = stream || null;
    }
  }, [stream, isLocal]);

  return (
    <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#333333] shadow-md flex items-center justify-center select-none group">
      {/* Hidden audio element for remote audio playback */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video Element when camera is ON and stream has video track */}
      {isCameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Sleek Avatar when camera is OFF */
        <div className="flex flex-col items-center justify-center p-4">
          <div
            style={{ backgroundColor: color }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg relative transition-all ${
              !isMuted ? 'ring-4 ring-emerald-500/50 scale-105' : ''
            }`}
          >
            {name?.charAt(0).toUpperCase() || 'U'}
            {isHost && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full p-1 shadow">
                <Crown size={10} className="text-white fill-current" />
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-gray-400 mt-2 truncate max-w-[120px]">
            {name}
          </span>
        </div>
      )}

      {/* Top Left: Role / Local Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
        {isHost && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/90 text-white flex items-center gap-1 shadow backdrop-blur-sm">
            <Crown size={10} className="fill-current" />
            Host
          </span>
        )}
      </div>

      {/* Bottom Bar: Name & Media Status Icons */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-xs pointer-events-none">
        {/* Name Label */}
        <span className="font-semibold text-white text-[11px] truncate max-w-[120px] drop-shadow-sm">
          {name} {isLocal && '(You)'}
        </span>

        {/* Media Status Badges */}
        <div className="flex items-center gap-1">
          {/* Mic Badge */}
          <span
            className={`p-1 rounded-md text-[10px] flex items-center justify-center shadow ${
              isMuted
                ? 'bg-rose-600/90 text-white'
                : 'bg-emerald-600/90 text-white animate-pulse'
            }`}
          >
            {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
          </span>

          {/* Camera Badge */}
          <span
            className={`p-1 rounded-md text-[10px] flex items-center justify-center shadow ${
              !isCameraOn
                ? 'bg-[#333333]/90 text-gray-300'
                : 'bg-blue-600/90 text-white'
            }`}
          >
            {!isCameraOn ? <VideoOff size={11} /> : <Video size={11} />}
          </span>
        </div>
      </div>
    </div>
  );
}
