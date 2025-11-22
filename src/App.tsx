import { useState, useEffect, useRef } from 'react';
import { ConnectionSetup } from './components/ConnectionSetup';
import { ChatInterface } from './components/ChatInterface';
import { WebRTCManager } from './services/webrtc';
import { Message, ConnectionStatus } from './types/chat';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomCode, setRoomCode] = useState<string>();
  const webrtcManager = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    webrtcManager.current = new WebRTCManager();

    webrtcManager.current.onMessage((text: string) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: 'peer',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newMessage]);
    });

    webrtcManager.current.onStatusChange((status: ConnectionStatus) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    });

    return () => {
      if (webrtcManager.current) {
        webrtcManager.current.endSession();
      }
    };
  }, []);

  const handleCreateSession = async (username: string) => {
    if (!webrtcManager.current) return;

    try {
      setConnectionStatus('connecting');
      const code = await webrtcManager.current.createSession(username);
      setRoomCode(code);
    } catch (error) {
      console.error('Failed to create session:', error);
      setConnectionStatus('error');
    }
  };

  const handleJoinSession = async (code: string, username: string) => {
    if (!webrtcManager.current) return;

    try {
      setConnectionStatus('connecting');
      await webrtcManager.current.joinSession(code, username);
      setRoomCode(code);
    } catch (error) {
      console.error('Failed to join session:', error);
      setConnectionStatus('error');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!webrtcManager.current) return;

    try {
      await webrtcManager.current.sendMessage(text);

      const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: 'me',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEndSession = async () => {
    if (!webrtcManager.current) return;

    await webrtcManager.current.endSession();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setMessages([]);
    setRoomCode(undefined);
  };

  if (connectionStatus === 'disconnected') {
    return (
      <ConnectionSetup
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
        isConnecting={connectionStatus === 'connecting'}
      />
    );
  }

  return (
    <ChatInterface
      messages={messages}
      onSendMessage={handleSendMessage}
      onEndSession={handleEndSession}
      connectionStatus={connectionStatus}
      roomCode={roomCode}
    />
  );
}

export default App;
