export const SIGNALING_SERVER_URL = 'http://localhost:5000';

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

export const PEER_CONNECTION_CONFIG = {
  iceServers: ICE_SERVERS
};
