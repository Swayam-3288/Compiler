import React from 'react';
import {
  Users,
  X,
  Crown,
  Shield,
  Eye,
  Pencil,
  Check,
  AlertCircle
} from 'lucide-react';

export default function ParticipantsSidebar({
  isOpen,
  onClose,
  collaborators = [],
  hostUserId,
  currentUserId,
  isHost,
  onToggleEditPermission
}) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 h-full bg-[#1e1e1e] border-l border-[#333333] flex flex-col z-20 shadow-2xl transition-all select-none">
      {/* Sidebar Header */}
      <div className="h-14 bg-[#252526] border-b border-[#333333] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Participants</h3>
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#333333] text-gray-300 rounded-full">
            {collaborators.length}
          </span>
        </div>

        <button
          onClick={onClose}
          title="Close sidebar"
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333333] rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Role explanation banner */}
      <div className="p-3 bg-[#181818] border-b border-[#2d2d2d] text-xs">
        {isHost ? (
          <div className="flex items-start gap-2 text-amber-300/90">
            <Crown size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>You are the Host.</strong> Use the toggles below to grant or revoke real-time Edit access for guests.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-gray-400">
            <Eye size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              You are a <strong>Guest</strong>. The Host controls edit permissions for all guests in this room.
            </p>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {collaborators.map((user) => {
          const userIsHost = user.id === hostUserId;
          const userIsSelf = user.id === currentUserId;
          const canEdit = user.canEdit;

          return (
            <div
              key={user.id || user.clientID}
              className={`p-3 rounded-xl border transition-all ${
                userIsSelf
                  ? 'bg-[#252526] border-blue-500/40 shadow-sm'
                  : 'bg-[#222222] border-[#333333] hover:border-[#444444]'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* User Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    style={{ backgroundColor: user.color || '#38bdf8' }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow shrink-0 relative"
                  >
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                    {userIsHost && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 shadow">
                        <Crown size={9} className="text-white fill-current" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                        {user.name}
                      </span>
                      {userIsSelf && (
                        <span className="text-[10px] text-blue-400 font-medium">
                          (You)
                        </span>
                      )}
                    </div>

                    {/* Role Badge */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {userIsHost ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Crown size={10} />
                          Host
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#2d2d2d] text-gray-300">
                          <Shield size={10} className="text-gray-400" />
                          Guest
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Permission Status & Toggle Control */}
                <div className="flex items-center gap-2 shrink-0">
                  {userIsHost ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Pencil size={10} />
                      Can Edit
                    </span>
                  ) : isHost ? (
                    // Host sees toggle switch for guests
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-medium ${canEdit ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {canEdit ? 'Can Edit' : 'View Only'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleEditPermission(user.id)}
                        title={canEdit ? 'Revoke edit access' : 'Grant edit access'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          canEdit ? 'bg-emerald-600' : 'bg-[#444444]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            canEdit ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ) : (
                    // Non-host guests just see status badge
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        canEdit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {canEdit ? (
                        <>
                          <Pencil size={10} />
                          Can Edit
                        </>
                      ) : (
                        <>
                          <Eye size={10} />
                          View Only
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#181818] border-t border-[#333333] text-[11px] text-gray-500 text-center">
        Permissions sync in real time over WebSockets
      </div>
    </aside>
  );
}
