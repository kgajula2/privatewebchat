export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'peer';
  timestamp: Date;
}

export interface EncryptedMessage {
  iv: number[];
  data: number[];
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface KeyExchangeMessage {
  type: 'public-key';
  publicKey: JsonWebKey;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
