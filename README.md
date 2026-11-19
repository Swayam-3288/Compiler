# Full-Stack Collaborative Online Code Compiler with WebRTC Video & Audio Chat

A clean, modern online code compiler with Monaco Editor, multi-language execution, real-time CRDT collaboration, role-based access control, and built-in WebRTC audio & video chat.

## Milestone Features

### Milestone 1: Online Code Compiler
- **Monaco Editor**: Syntax highlighting for C++, Python, JavaScript, and Java.
- **Custom Input (`stdin`)**: Clean stdin box for user arguments.
- **Execution Output**: Structured `stdout` and `stderr` console, exit codes, and execution durations.
- **API Endpoint**: `POST /api/execute` forwards code to public Piston API with an automated local sandbox execution fallback.

### Milestone 2: Real-Time Collaborative Rooms
- **Landing Page**: Set display name, select custom avatar/cursor color, create or join rooms.
- **Invite & Collaboration Controls**: One-click Room ID copy, full invite link generation, and real-time active user presence.
- **Live Monaco CRDT Sync**: Real-time collaborative editing powered by Yjs (`y-websocket` & `y-monaco`) with dynamic colored collaborator cursors and name badges.
- **Synchronized State**: Language selection, custom standard input (`stdin`), and output execution consoles sync live across all peers.

### Milestone 3: Role-Based Access Control (RBAC)
- **Host & Guest Roles**: Room creator is assigned the `Host` role; others join as `Guest`.
- **View-Only by Default**: Guests join locked with Monaco Editor set to `readOnly: true`.
- **Participants Sidebar**: Collapsible drawer showing all users in the room, their roles, and edit permissions.
- **Real-Time Edit Access Toggle**: Host can grant or revoke edit permissions dynamically in real time over WebSockets.

### Milestone 4: Built-in Audio and Video Chat
- **WebRTC Peer-to-Peer Mesh**: Full audio and video communication using our existing Node.js WebSocket server (`ws://localhost:5000/signal`) for signaling.
- **Audio-First Default**: Users join with microphone muted and camera turned off by default for privacy and instant room entry without sudden device prompts.
- **Bottom Media Control Dock**: Clean bottom control toolbar featuring:
  - **Mute / Unmute Microphone** with clear status indicators.
  - **Start / Stop Camera** with active video indicators.
  - **Video Call Panel Toggle** showing active participants count.
  - **Leave Room** button.
- **Compact Collapsible Video Panel**:
  - Docked on the side so it never blocks the Monaco code editor.
  - Each tile displays live video (with local video mirroring) or a sleek avatar with a speaking pulse ring when unmuted.
  - Displays participant name, Host badge, and live mic/camera status icons.

---

## Running Locally

### Backend Server (`/server`)
```bash
cd server
npm install
npm start
```
Runs on `http://localhost:5000` (Express HTTP + Yjs WebSocketServer + WebRTC Signaling).

### Frontend Client (`/client`)
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`.
