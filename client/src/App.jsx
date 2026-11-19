import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import CodeEditor from './components/CodeEditor';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ParticipantsSidebar from './components/ParticipantsSidebar';
import VideoPanel from './components/VideoPanel';
import MediaControls from './components/MediaControls';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './config/languages';
import { getRandomColor, getOrCreateUserId } from './utils/colors';
import { useWebRTC } from './hooks/useWebRTC';

export default function App() {
  // Check URL query parameters for ?room=ROOM_ID
  const [initialUrlRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  });

  const [roomId, setRoomId] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    return {
      id: getOrCreateUserId(),
      name: localStorage.getItem('codecraft_username') || `Dev-${Math.floor(100 + Math.random() * 900)}`,
      color: localStorage.getItem('codecraft_color') || getRandomColor()
    };
  });

  // Yjs instances
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [yStdin, setYStdin] = useState(null);

  // Synchronized Room State
  const [hostUserId, setHostUserId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runTriggeredBy, setRunTriggeredBy] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');

  // Sidebars visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVideoPanelOpen, setIsVideoPanelOpen] = useState(false);

  // Local user's permissions
  const isHost = Boolean(hostUserId && currentUser.id === hostUserId);
  const [guestCanEdit, setGuestCanEdit] = useState(false);
  const canEdit = isHost || guestCanEdit;

  const providerRef = useRef(null);
  const ydocRef = useRef(null);

  // WebRTC Audio/Video Hook (Audio-first: mic muted, camera off by default)
  const {
    isMuted,
    isCameraOn,
    localStream,
    remotePeers,
    permissionError,
    toggleMute,
    toggleCamera
  } = useWebRTC(roomId, currentUser, isHost);

  // Periodic health check
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (e) {
      setServerStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Connect to room with Yjs
  const handleJoinRoom = useCallback((targetRoomId, user, isCreating = false) => {
    if (!targetRoomId) return;

    // Clean up any existing connection
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    setRoomId(targetRoomId);
    setCurrentUser(user);

    // Update browser URL query param
    const newUrl = `${window.location.pathname}?room=${targetRoomId}`;
    window.history.pushState(null, '', newUrl);

    // Initialize Yjs Document & Provider
    const doc = new Y.Doc();
    ydocRef.current = doc;
    setYdoc(doc);

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000`;

    const prov = new WebsocketProvider(wsUrl, targetRoomId, doc);
    providerRef.current = prov;
    setProvider(prov);

    // Shared Types
    const sharedStdin = doc.getText('stdin');
    const roomState = doc.getMap('roomState');
    const permissionsMap = doc.getMap('permissions');

    setYStdin(sharedStdin);

    // If user clicked "Create Room", declare ownership as Host
    if (isCreating || !roomState.get('hostUserId')) {
      roomState.set('hostUserId', user.id);
      roomState.set('hostName', user.name);
      setHostUserId(user.id);
    } else {
      setHostUserId(roomState.get('hostUserId') || '');
    }

    // Set User Awareness (for cursors, presence, and role)
    prov.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color
    });

    // Compute and sync collaborator list and permissions
    const updatePresenceAndPermissions = () => {
      const currentHostId = roomState.get('hostUserId') || '';
      setHostUserId(currentHostId);

      // Check current user's edit permission
      if (user.id === currentHostId) {
        setGuestCanEdit(true);
      } else {
        const hasPermission = Boolean(permissionsMap.get(user.id));
        setGuestCanEdit(hasPermission);
      }

      // Build active collaborators list with roles and permissions
      const collabsMap = new Map();
      prov.awareness.getStates().forEach((state, clientID) => {
        if (state.user && state.user.id) {
          const uId = state.user.id;
          const uIsHost = uId === currentHostId;
          const uCanEdit = uIsHost || Boolean(permissionsMap.get(uId));

          collabsMap.set(uId, {
            id: uId,
            clientID,
            name: state.user.name,
            color: state.user.color,
            isHost: uIsHost,
            canEdit: uCanEdit,
            isLocal: uId === user.id
          });
        }
      });

      setCollaborators(Array.from(collabsMap.values()));
    };

    prov.awareness.on('change', updatePresenceAndPermissions);
    permissionsMap.observe(updatePresenceAndPermissions);
    roomState.observe(updatePresenceAndPermissions);

    // Handle room state sync (language, output, execution status)
    const handleRoomStateChange = () => {
      const langId = roomState.get('languageId');
      if (langId) {
        const found = SUPPORTED_LANGUAGES.find((l) => l.id === langId);
        if (found) setSelectedLanguage(found);
      }
      setOutput(roomState.get('output') || null);
      setIsRunning(Boolean(roomState.get('isRunning')));
      setRunTriggeredBy(roomState.get('runTriggeredBy') || '');
      const hId = roomState.get('hostUserId');
      if (hId) setHostUserId(hId);
    };

    roomState.observe(handleRoomStateChange);

    // Initialize starter content if room is new/empty
    const initRoomContent = () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const text = doc.getText('code_' + lang.id);
        if (text.length === 0) {
          text.insert(0, lang.starterCode);
        }
      });

      if (!roomState.get('languageId')) {
        roomState.set('languageId', DEFAULT_LANGUAGE.id);
      }

      if (sharedStdin.length === 0 && DEFAULT_LANGUAGE.defaultInput) {
        sharedStdin.insert(0, DEFAULT_LANGUAGE.defaultInput);
      }

      if (isCreating && !roomState.get('hostUserId')) {
        roomState.set('hostUserId', user.id);
        roomState.set('hostName', user.name);
      }

      handleRoomStateChange();
      updatePresenceAndPermissions();
    };

    if (prov.synced) {
      initRoomContent();
    } else {
      prov.once('synced', () => {
        initRoomContent();
      });
      // Fallback timer if event already fired
      setTimeout(() => {
        if (!roomState.get('languageId')) {
          initRoomContent();
        }
      }, 1200);
    }

    handleRoomStateChange();
    updatePresenceAndPermissions();
  }, []);

  // Reconnect automatically if user refreshes while already in a room
  useEffect(() => {
    if (initialUrlRoomId && !roomId) {
      const savedName = localStorage.getItem('codecraft_username');
      const savedColor = localStorage.getItem('codecraft_color') || getRandomColor();
      const savedId = getOrCreateUserId();
      if (savedName) {
        handleJoinRoom(initialUrlRoomId, { id: savedId, name: savedName, color: savedColor }, false);
      }
    }
  }, [initialUrlRoomId, roomId, handleJoinRoom]);

  // Host action: Toggle Edit Permission for a specific Guest
  const handleToggleEditPermission = (targetUserId) => {
    if (!ydoc || !isHost || targetUserId === hostUserId) return;
    const permissionsMap = ydoc.getMap('permissions');
    const current = Boolean(permissionsMap.get(targetUserId));
    permissionsMap.set(targetUserId, !current);
  };

  // Leave room and return to Landing Page
  const handleLeaveRoom = () => {
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    setRoomId('');
    setYdoc(null);
    setProvider(null);
    setYStdin(null);
    setCollaborators([]);
    setHostUserId('');
    setIsSidebarOpen(false);
    setIsVideoPanelOpen(false);
    window.history.pushState(null, '', window.location.pathname);
  };

  // Sync language change across room (Only available for users with edit access)
  const handleLanguageChange = (newLang) => {
    if (!ydoc || !canEdit) return;
    const roomState = ydoc.getMap('roomState');
    roomState.set('languageId', newLang.id);
  };

  // Active collaborative Y.Text for currently selected language
  const activeYText = ydoc ? ydoc.getText('code_' + selectedLanguage.id) : null;

  // Reset code template across room (Only available for users with edit access)
  const handleResetCode = () => {
    if (!ydoc || !activeYText || !canEdit) return;
    if (window.confirm(`Reset code template for ${selectedLanguage.name}? This will update the code for everyone in the room.`)) {
      ydoc.transact(() => {
        activeYText.delete(0, activeYText.length);
        activeYText.insert(0, selectedLanguage.starterCode);
      });
      if (yStdin && selectedLanguage.defaultInput) {
        ydoc.transact(() => {
          yStdin.delete(0, yStdin.length);
          yStdin.insert(0, selectedLanguage.defaultInput);
        });
      }
    }
  };

  // Execute Code synchronized across room (Only available for users with edit access)
  const handleRunCode = async () => {
    if (isRunning || !ydoc || !activeYText || !canEdit) return;

    const currentCode = activeYText.toString();
    const currentStdin = yStdin ? yStdin.toString() : '';

    if (!currentCode.trim()) {
      setOutput({
        success: false,
        stderr: 'Error: Cannot execute empty source code.',
        exitCode: 1
      });
      return;
    }

    const roomState = ydoc.getMap('roomState');

    // Notify room that execution has started
    roomState.set('isRunning', true);
    roomState.set('runTriggeredBy', currentUser.name);
    roomState.set('output', null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage.id,
          code: currentCode,
          stdin: currentStdin
        })
      });

      if (!response.ok) {
        let errJson = null;
        try {
          errJson = await response.json();
        } catch (e) {}

        const failResult = {
          success: false,
          error: errJson?.error || `Server responded with HTTP ${response.status}`,
          details: errJson?.details || null,
          exitCode: response.status
        };

        roomState.set('output', failResult);
        roomState.set('isRunning', false);
        roomState.set('runTriggeredBy', '');
        return;
      }

      const data = await response.json();
      roomState.set('output', data);
      roomState.set('isRunning', false);
      roomState.set('runTriggeredBy', '');
    } catch (err) {
      console.error('Execution request error:', err);
      const networkErr = {
        success: false,
        error: 'Network error: Unable to reach compiler server.',
        details: 'Please verify that the backend server is running on port 5000.',
        exitCode: 1
      };
      roomState.set('output', networkErr);
      roomState.set('isRunning', false);
      roomState.set('runTriggeredBy', '');
    }
  };

  // Clear output synchronized across room
  const handleClearOutput = () => {
    if (ydoc && canEdit) {
      const roomState = ydoc.getMap('roomState');
      roomState.set('output', null);
    } else {
      setOutput(null);
    }
  };

  // If not currently in a room, render the Landing Page
  if (!roomId) {
    return (
      <LandingPage
        onJoinRoom={handleJoinRoom}
        initialRoomId={initialUrlRoomId}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#181818] text-slate-100">
      {/* Top Navigation Bar with Room ID, Invite Link, Role & Sidebar Toggle */}
      <Navbar
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onResetCode={handleResetCode}
        onRun={handleRunCode}
        isRunning={isRunning}
        runTriggeredBy={runTriggeredBy}
        serverStatus={serverStatus}
        roomId={roomId}
        currentUser={currentUser}
        isHost={isHost}
        canEdit={canEdit}
        collaborators={collaborators}
        onLeaveRoom={handleLeaveRoom}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Collaborative Workspace with Code Editor, Input/Output, Video Panel & Participants Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Monaco Editor with RBAC readOnly control */}
          <div className="w-full md:w-[60%] h-[55%] md:h-full overflow-hidden">
            <CodeEditor
              language={selectedLanguage}
              yText={activeYText}
              provider={provider}
              onRun={handleRunCode}
              collaborators={collaborators}
              canEdit={canEdit}
            />
          </div>

          {/* Right Panel: Synchronized Input & Output */}
          <div className="w-full md:w-[40%] h-[45%] md:h-full flex flex-col overflow-hidden bg-[#181818]">
            {/* Synchronized Custom Stdin Input */}
            <div className="h-[38%] min-h-[120px] overflow-hidden">
              <InputPanel
                yStdin={yStdin}
                defaultInput={selectedLanguage.defaultInput}
                canEdit={canEdit}
              />
            </div>

            {/* Synchronized Execution Output Panel */}
            <div className="flex-1 min-h-[150px] overflow-hidden">
              <OutputPanel
                output={output}
                isRunning={isRunning}
                runTriggeredBy={runTriggeredBy}
                onClear={handleClearOutput}
              />
            </div>
          </div>
        </main>

        {/* Compact Collapsible Video & Audio Tiles Panel (Side Dock) */}
        <VideoPanel
          isOpen={isVideoPanelOpen}
          onClose={() => setIsVideoPanelOpen(false)}
          localStream={localStream}
          currentUser={currentUser}
          isHost={isHost}
          isMuted={isMuted}
          isCameraOn={isCameraOn}
          remotePeers={remotePeers}
          permissionError={permissionError}
        />

        {/* Collapsible Participants Sidebar with Host Grant/Revoke Controls */}
        <ParticipantsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          collaborators={collaborators}
          hostUserId={hostUserId}
          currentUserId={currentUser.id}
          isHost={isHost}
          onToggleEditPermission={handleToggleEditPermission}
        />
      </div>

      {/* Milestone 4: Bottom Media Control Bar (Mic, Camera, Video Dock Toggle, Leave) */}
      <MediaControls
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        isVideoPanelOpen={isVideoPanelOpen}
        onToggleVideoPanel={() => setIsVideoPanelOpen(!isVideoPanelOpen)}
        onLeaveRoom={handleLeaveRoom}
        activePeersCount={remotePeers.length}
      />
    </div>
  );
}
