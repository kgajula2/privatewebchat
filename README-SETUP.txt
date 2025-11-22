P2P Encrypted Chat - Setup Instructions
=========================================

This application consists of two parts:
1. Frontend (React/Vite) - runs on port 5173
2. Signaling Server (Python/Flask) - runs on port 5000

SETUP STEPS:

1. Install Python dependencies:
   pip install -r requirements.txt

2. Start the signaling server:
   python server.py

3. In a separate terminal, start the frontend:
   npm run dev

4. For remote access (optional):
   - Install ngrok: https://ngrok.com/download
   - Run: ngrok http 5000
   - Update the signaling server URL in src/config/webrtc.ts with your ngrok URL

USAGE:

1. One user clicks "Create Session" to host
2. Share the generated session code with the other user
3. Other user enters the code and clicks "Join Session"
4. Once connected, chat messages are end-to-end encrypted
5. Click "End Chat" to terminate the session

SECURITY:

- All messages are encrypted with AES-256-GCM
- Keys are derived using ECDH (Elliptic Curve Diffie-Hellman)
- WebRTC provides transport-layer encryption (DTLS)
- No messages are stored or logged on the server
- Session codes are randomly generated UUIDs
