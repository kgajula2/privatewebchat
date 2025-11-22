import { useState } from 'react';
import { Shield } from 'lucide-react';

interface ConnectionSetupProps {
  onCreateSession: (username: string) => void;
  onJoinSession: (roomCode: string, username: string) => void;
  isConnecting: boolean;
}

export function ConnectionSetup({ onCreateSession, onJoinSession, isConnecting }: ConnectionSetupProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onCreateSession(username.trim());
    }
  };

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomCode.trim()) {
      onJoinSession(roomCode.trim().toUpperCase(), username.trim());
    }
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-100 p-4 rounded-full">
              <Shield className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Encrypted P2P Chat
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Secure, private, peer-to-peer messaging with end-to-end encryption
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-md"
            >
              Create New Session
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              Join Existing Session
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>AES-256-GCM encryption</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>ECDH key exchange</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>No message storage</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Session</h2>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isConnecting}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                disabled={isConnecting}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                disabled={isConnecting || !username.trim()}
              >
                {isConnecting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Join Session</h2>

        <form onSubmit={handleJoinSession} className="space-y-4">
          <div>
            <label htmlFor="join-username" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="join-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isConnecting}
              required
            />
          </div>

          <div>
            <label htmlFor="room-code" className="block text-sm font-medium text-gray-700 mb-2">
              Session Code
            </label>
            <input
              id="room-code"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
              maxLength={6}
              disabled={isConnecting}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
              disabled={isConnecting}
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={isConnecting || !username.trim() || !roomCode.trim()}
            >
              {isConnecting ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
