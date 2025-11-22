import { useState, useEffect, useRef } from 'react';
import { Send, Copy, Check, LogOut, Lock } from 'lucide-react';
import { Message, ConnectionStatus } from '../types/chat';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onEndSession: () => void;
  connectionStatus: ConnectionStatus;
  roomCode?: string;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onEndSession,
  connectionStatus,
  roomCode
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && connectionStatus === 'connected') {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const copyRoomCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected & Encrypted';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Encrypted Chat</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm text-gray-600">{getStatusText()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {roomCode && (
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 font-mono">{roomCode}</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onEndSession}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">End Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                <Lock className="w-12 h-12 text-white/70 mx-auto mb-4" />
                <p className="text-white/70 text-lg">
                  {connectionStatus === 'connected'
                    ? 'Secure connection established. Start chatting!'
                    : 'Waiting for secure connection...'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl shadow-md ${
                    message.sender === 'me'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                connectionStatus === 'connected'
                  ? 'Type your message...'
                  : 'Waiting for connection...'
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={connectionStatus !== 'connected'}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || connectionStatus !== 'connected'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
