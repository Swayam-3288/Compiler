import React, { useState, useEffect } from 'react';
import {
  Code2,
  Users,
  Sparkles,
  ArrowRight,
  PlusCircle,
  LogIn,
  Check,
  Zap,
  Globe2,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { AVATAR_COLORS, getRandomColor, generateRoomId, getOrCreateUserId } from '../utils/colors';

export default function LandingPage({ onJoinRoom, initialRoomId = '' }) {
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('codecraft_username') || `Dev-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [selectedColor, setSelectedColor] = useState(() => {
    return localStorage.getItem('codecraft_color') || getRandomColor();
  });
  const [roomIdInput, setRoomIdInput] = useState(initialRoomId);
  const [mode, setMode] = useState(initialRoomId ? 'join' : 'create');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRoomId) {
      setRoomIdInput(initialRoomId);
      setMode('join');
    }
  }, [initialRoomId]);

  const handleColorChange = (color) => {
    setSelectedColor(color);
    localStorage.setItem('codecraft_color', color);
  };

  const handleNameChange = (name) => {
    setDisplayName(name);
    localStorage.setItem('codecraft_username', name);
    if (error) setError('');
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      setError('Please enter a display name to continue.');
      return;
    }
    const userId = getOrCreateUserId();
    const newRoomId = generateRoomId();
    onJoinRoom(newRoomId, { id: userId, name: cleanName, color: selectedColor }, true);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanRoom = roomIdInput.trim();

    if (!cleanName) {
      setError('Please enter a display name to continue.');
      return;
    }
    if (!cleanRoom) {
      setError('Please enter a valid Room ID to join.');
      return;
    }
    const userId = getOrCreateUserId();
    onJoinRoom(cleanRoom, { id: userId, name: cleanName, color: selectedColor }, false);
  };

  return (
    <div className="min-h-screen w-full bg-[#121212] flex flex-col justify-between text-slate-100 select-none">
      {/* Top Header */}
      <header className="h-16 border-b border-[#2d2d2d] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/25">
            <Code2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              CodeCraft Live
            </h1>
            <p className="text-[11px] text-gray-400">Collaborative Code Compiler & RBAC Rooms</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
            <ShieldCheck size={13} />
            Milestone 3: RBAC Ready
          </span>
        </div>
      </header>

      {/* Hero & Card Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <Crown size={13} className="text-amber-400" />
            Role-Based Access Control: Host & Guest Roles
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Collaborative coding with Host permissions.
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            The room creator gets the Host role with full editing controls. Guests join in View-Only mode until granted Edit access in real time.
          </p>
        </div>

        {/* User Card & Room Tabs */}
        <div className="w-full max-w-md bg-[#1e1e1e] border border-[#333333] rounded-2xl p-6 shadow-2xl">
          {/* Display Name & Color Section */}
          <div className="mb-6 pb-6 border-b border-[#2d2d2d]">
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Your Display Name
            </label>
            <div className="flex items-center gap-3">
              {/* Avatar Preview */}
              <div
                style={{ backgroundColor: selectedColor }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
              >
                {displayName.trim().charAt(0).toUpperCase() || 'U'}
              </div>

              {/* Name Input */}
              <input
                type="text"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={24}
                placeholder="Enter your name..."
                className="flex-1 bg-[#282828] text-white text-sm px-3.5 py-2 rounded-lg border border-[#3e3e3e] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Color Palette */}
            <div className="mt-3 flex items-center gap-2 justify-between">
              <span className="text-[11px] text-gray-400">Cursor Color:</span>
              <div className="flex items-center gap-1.5">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full transition-transform flex items-center justify-center ${
                      selectedColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]' : 'hover:scale-110 opacity-80'
                    }`}
                  >
                    {selectedColor === color && <Check size={10} className="text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Room Action Tabs */}
          <div className="flex bg-[#282828] p-1 rounded-xl mb-5">
            <button
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'create'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <PlusCircle size={14} />
              Create Room (Host)
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'join'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn size={14} />
              Join Room (Guest)
            </button>
          </div>

          {/* Form Content */}
          {mode === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="p-3 bg-[#252526] rounded-xl border border-[#333333] text-xs text-gray-300 flex items-start gap-2.5">
                <Crown size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  As the <strong>Host</strong>, you will have full edit rights and can manage which guests are allowed to edit code using the Participants sidebar.
                </p>
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-medium px-1">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>Create Room as Host</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Room ID or Invite Code
                </label>
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => {
                    setRoomIdInput(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. room-a7x9p2"
                  className="w-full bg-[#282828] text-white text-sm px-3.5 py-2 rounded-lg border border-[#3e3e3e] focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>

              <div className="p-3 bg-[#252526] rounded-xl border border-[#333333] text-xs text-gray-300 flex items-start gap-2.5">
                <Zap size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <p>
                  You will join as a <strong>Guest</strong> in View-Only mode by default. The Host can grant you edit access at any time.
                </p>
              </div>

              {initialRoomId && (
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-lg">
                  <Globe2 size={14} className="shrink-0" />
                  <span>Invited to join room <strong>{initialRoomId}</strong></span>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-400 font-medium px-1">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>Enter Room as Guest</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-2xl w-full text-center">
          <div className="p-3.5 bg-[#181818] border border-[#2d2d2d] rounded-xl text-xs text-gray-400">
            <strong className="text-gray-200 block mb-1">Host Controls</strong>
            Room creator assigns and revokes Edit permissions in real time.
          </div>
          <div className="p-3.5 bg-[#181818] border border-[#2d2d2d] rounded-xl text-xs text-gray-400">
            <strong className="text-gray-200 block mb-1">View-Only Default</strong>
            Guests join locked to prevent accidental code overwrites during presentations.
          </div>
          <div className="p-3.5 bg-[#181818] border border-[#2d2d2d] rounded-xl text-xs text-gray-400">
            <strong className="text-gray-200 block mb-1">Real-Time Permission Sync</strong>
            WebSockets instantly update Monaco's readOnly state without reloading.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#222222] px-6 flex items-center justify-between text-[11px] text-gray-500">
        <span>CodeCraft Online IDE</span>
        <span>Milestone 3: Role-Based Access Control</span>
      </footer>
    </div>
  );
}
