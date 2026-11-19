import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTC(roomId, currentUser, isHost) {
  // Audio-first default: Mic muted, Camera off
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const [permissionError, setPermissionError] = useState(null);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // Map<userId, RTCPeerConnection>
  const localStreamRef = useRef(null);
  const isMutedRef = useRef(true);
  const isCameraOnRef = useRef(false);

  // Keep refs in sync for event callbacks
  isMutedRef.current = isMuted;
  isCameraOnRef.current = isCameraOn;

  // Broadcast media states (mic/camera) to all peers in room
  const broadcastMediaState = useCallback((muted, cameraOn) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'media-state',
        isMuted: muted,
        isCameraOn: cameraOn
      }));
    }
  }, []);

  // Helper to attach local media tracks to an existing RTCPeerConnection
  const attachTracksToPC = useCallback((pc, stream) => {
    if (!pc || !stream) return;
    const senders = pc.getSenders();
    stream.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track && s.track.kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track);
      } else {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((remoteUserId, remoteName, remoteColor, remoteIsHost) => {
    if (peerConnectionsRef.current.has(remoteUserId)) {
      return peerConnectionsRef.current.get(remoteUserId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteUserId, pc);

    // If we already have a local stream, attach it
    if (localStreamRef.current) {
      attachTracksToPC(pc, localStreamRef.current);
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'signal',
          targetUserId: remoteUserId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        }));
      }
    };

    // Remote track handler (receives remote audio/video)
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemotePeers((prev) => {
        const existingIdx = prev.findIndex((p) => p.userId === remoteUserId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            stream: remoteStream
          };
          return updated;
        }
        return [
          ...prev,
          {
            userId: remoteUserId,
            name: remoteName,
            color: remoteColor,
            isHost: remoteIsHost,
            stream: remoteStream,
            isMuted: true,
            isCameraOn: false
          }
        ];
      });
    };

    return pc;
  }, [attachTracksToPC]);

  // Connect to WebRTC Signaling Server on mount
  useEffect(() => {
    if (!roomId || !currentUser?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const signalUrl = `${protocol}//${host}:5000/signal`;

    const socket = new WebSocket(signalUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      // Announce presence in this room
      socket.send(JSON.stringify({
        type: 'join',
        roomId,
        userId: currentUser.id,
        name: currentUser.name,
        color: currentUser.color,
        isHost
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          // Received list of peers already in the room
          case 'room-users': {
            const peers = data.users || [];
            peers.forEach(async (peer) => {
              const pc = createPeerConnection(peer.userId, peer.name, peer.color, peer.isHost);
              
              // Add to remotePeers state
              setRemotePeers((prev) => {
                if (prev.some((p) => p.userId === peer.userId)) return prev;
                return [
                  ...prev,
                  {
                    userId: peer.userId,
                    name: peer.name,
                    color: peer.color,
                    isHost: peer.isHost,
                    isMuted: peer.isMuted,
                    isCameraOn: peer.isCameraOn,
                    stream: null
                  }
                ];
              });

              // Create and send SDP Offer to existing peer
              try {
                // Ensure offer receives both audio and video
                pc.addTransceiver('audio', { direction: 'sendrecv' });
                pc.addTransceiver('video', { direction: 'sendrecv' });
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.send(JSON.stringify({
                  type: 'signal',
                  targetUserId: peer.userId,
                  signal: {
                    type: 'offer',
                    sdp: pc.localDescription
                  }
                }));
              } catch (err) {
                console.error('Error creating offer:', err);
              }
            });
            break;
          }

          // A new peer joined the room
          case 'user-joined': {
            const { userId, name, color, isHost: pIsHost, isMuted: pMuted, isCameraOn: pCam } = data;
            createPeerConnection(userId, name, color, pIsHost);

            setRemotePeers((prev) => {
              if (prev.some((p) => p.userId === userId)) return prev;
              return [
                ...prev,
                {
                  userId,
                  name,
                  color,
                  isHost: pIsHost,
                  isMuted: pMuted,
                  isCameraOn: pCam,
                  stream: null
                }
              ];
            });
            break;
          }

          // Received SDP Offer/Answer or ICE Candidate
          case 'signal': {
            const { senderUserId, signal } = data;
            const pc = peerConnectionsRef.current.get(senderUserId);
            if (!pc) return;

            if (signal.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              socket.send(JSON.stringify({
                type: 'signal',
                targetUserId: senderUserId,
                signal: {
                  type: 'answer',
                  sdp: pc.localDescription
                }
              }));
            } else if (signal.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'ice-candidate') {
              if (signal.candidate) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (e) {
                  console.error('Error adding received ICE candidate:', e);
                }
              }
            }
            break;
          }

          // Remote peer updated mic or camera state
          case 'user-media-state': {
            const { userId, isMuted: pMuted, isCameraOn: pCam } = data;
            setRemotePeers((prev) =>
              prev.map((p) =>
                p.userId === userId
                  ? { ...p, isMuted: pMuted, isCameraOn: pCam }
                  : p
              )
            );
            break;
          }

          // A peer left the room
          case 'user-left': {
            const { userId } = data;
            const pc = peerConnectionsRef.current.get(userId);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(userId);
            }
            setRemotePeers((prev) => prev.filter((p) => p.userId !== userId));
            break;
          }
        }
      } catch (err) {
        console.error('Signaling message handling error:', err);
      }
    };

    return () => {
      // Clean up signaling socket & peer connections on unmount/leave
      socket.close();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [roomId, currentUser?.id, currentUser?.name, currentUser?.color, isHost, createPeerConnection]);

  // Request or get user media tracks
  const getOrCreateStream = useCallback(async (needVideo = false) => {
    try {
      if (localStreamRef.current) {
        const hasAudio = localStreamRef.current.getAudioTracks().length > 0;
        const hasVideo = localStreamRef.current.getVideoTracks().length > 0;

        if (needVideo && !hasVideo) {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(videoTrack);
          // Attach to all peer connections
          peerConnectionsRef.current.forEach((pc) => {
            pc.addTrack(videoTrack, localStreamRef.current);
          });
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }
        return localStreamRef.current;
      }

      // Request media stream (audio always, video if requested)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: needVideo
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Disable audio track initially if muted
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !isMutedRef.current;
      });

      // Disable video track initially if camera is off
      stream.getVideoTracks().forEach((t) => {
        t.enabled = isCameraOnRef.current;
      });

      // Attach new stream tracks to all active peer connections
      peerConnectionsRef.current.forEach((pc) => {
        attachTracksToPC(pc, stream);
      });

      setPermissionError(null);
      return stream;
    } catch (err) {
      console.warn('getUserMedia permission error:', err);
      setPermissionError(err.message || 'Microphone/Camera permission denied');
      return null;
    }
  }, [attachTracksToPC]);

  // Toggle Microphone Mute / Unmute
  const toggleMute = useCallback(async () => {
    const nextMuted = !isMuted;

    if (!localStreamRef.current) {
      const stream = await getOrCreateStream(false);
      if (stream) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !nextMuted;
        });
        setIsMuted(nextMuted);
        broadcastMediaState(nextMuted, isCameraOnRef.current);
      }
      return;
    }

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
    broadcastMediaState(nextMuted, isCameraOnRef.current);
  }, [isMuted, getOrCreateStream, broadcastMediaState]);

  // Toggle Camera On / Off
  const toggleCamera = useCallback(async () => {
    const nextCameraOn = !isCameraOn;

    if (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0) {
      if (nextCameraOn) {
        const stream = await getOrCreateStream(true);
        if (stream) {
          stream.getVideoTracks().forEach((t) => {
            t.enabled = true;
          });
          setIsCameraOn(true);
          broadcastMediaState(isMutedRef.current, true);
        }
      }
      return;
    }

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = nextCameraOn;
    });

    setIsCameraOn(nextCameraOn);
    broadcastMediaState(isMutedRef.current, nextCameraOn);
  }, [isCameraOn, getOrCreateStream, broadcastMediaState]);

  return {
    isMuted,
    isCameraOn,
    localStream,
    remotePeers,
    permissionError,
    toggleMute,
    toggleCamera
  };
}
