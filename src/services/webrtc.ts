import { io, Socket } from 'socket.io-client';
import { SIGNALING_SERVER_URL, PEER_CONNECTION_CONFIG } from '../config/webrtc';
import { CryptoManager } from '../utils/crypto';
import { EncryptedMessage, KeyExchangeMessage, SignalData, ConnectionStatus } from '../types/chat';

export class WebRTCManager {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private cryptoManager: CryptoManager;
  private isInitiator: boolean = false;
  private roomCode: string = '';
  private username: string = '';
  private keyExchangeComplete: boolean = false;

  private onMessageCallback: ((message: string) => void) | null = null;
  private onStatusChangeCallback: ((status: ConnectionStatus) => void) | null = null;

  constructor() {
    this.cryptoManager = new CryptoManager();
  }

  async createSession(username: string): Promise<string> {
    this.isInitiator = true;
    this.username = username;
    this.roomCode = this.generateRoomCode();

    await this.connectToSignalingServer();
    this.socket!.emit('join', { room: this.roomCode, username });

    this.socket!.on('ready', async () => {
      await this.initiatePeerConnection();
    });

    return this.roomCode;
  }

  async joinSession(roomCode: string, username: string): Promise<void> {
    this.isInitiator = false;
    this.username = username;
    this.roomCode = roomCode;

    await this.connectToSignalingServer();
    this.socket!.emit('join', { room: this.roomCode, username });

    this.socket!.on('ready', async () => {
      await this.setupPeerConnection();
    });
  }

  private async connectToSignalingServer(): Promise<void> {
    return new Promise((resolve) => {
      this.socket = io(SIGNALING_SERVER_URL);

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        this.updateStatus('connecting');
        resolve();
      });

      this.socket.on('signal', async (data: SignalData) => {
        await this.handleSignal(data);
      });

      this.socket.on('peer_left', () => {
        console.log('Peer left the session');
        this.endSession();
      });

      this.socket.on('error', (error) => {
        console.error('Signaling error:', error);
        this.updateStatus('error');
      });
    });
  }

  private async setupPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('signal', {
          room: this.roomCode,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate.toJSON()
          }
        });
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'connected') {
        this.updateStatus('connected');
      } else if (this.peerConnection?.connectionState === 'failed' ||
                 this.peerConnection?.connectionState === 'disconnected') {
        this.updateStatus('error');
      }
    };
  }

  private async initiatePeerConnection(): Promise<void> {
    await this.setupPeerConnection();

    this.dataChannel = this.peerConnection!.createDataChannel('chat');
    this.setupDataChannel();

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    this.socket!.emit('signal', {
      room: this.roomCode,
      signal: {
        type: 'offer',
        sdp: offer
      }
    });
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = async () => {
      console.log('Data channel opened');
      await this.performKeyExchange();
    };

    this.dataChannel.onmessage = async (event) => {
      await this.handleDataChannelMessage(event.data);
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.updateStatus('disconnected');
    };
  }

  private async handleSignal(data: SignalData): Promise<void> {
    if (!this.peerConnection) {
      await this.setupPeerConnection();
    }

    if (data.type === 'offer' && data.sdp) {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.socket!.emit('signal', {
        room: this.roomCode,
        signal: {
          type: 'answer',
          sdp: answer
        }
      });
    } else if (data.type === 'answer' && data.sdp) {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'ice-candidate' && data.candidate) {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  private async performKeyExchange(): Promise<void> {
    const publicKey = await this.cryptoManager.generateKeyPair();

    const message: KeyExchangeMessage = {
      type: 'public-key',
      publicKey
    };

    this.sendRawMessage(JSON.stringify(message));
  }

  private async handleDataChannelMessage(data: string): Promise<void> {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'public-key') {
        await this.cryptoManager.deriveSharedKey(parsed.publicKey);
        this.keyExchangeComplete = true;
        console.log('Key exchange complete');
        this.updateStatus('connected');
      } else if (parsed.type === 'encrypted-message' && this.cryptoManager.hasSharedKey()) {
        const decrypted = await this.cryptoManager.decrypt(parsed.message as EncryptedMessage);

        if (decrypted === '__END_SESSION__') {
          this.endSession();
        } else if (this.onMessageCallback) {
          this.onMessageCallback(decrypted);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open');
    }

    if (!this.keyExchangeComplete || !this.cryptoManager.hasSharedKey()) {
      throw new Error('Encryption not ready');
    }

    const encrypted = await this.cryptoManager.encrypt(text);
    const message = {
      type: 'encrypted-message',
      message: encrypted
    };

    this.sendRawMessage(JSON.stringify(message));
  }

  private sendRawMessage(data: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
    }
  }

  async endSession(): Promise<void> {
    try {
      if (this.keyExchangeComplete && this.cryptoManager.hasSharedKey()) {
        const encrypted = await this.cryptoManager.encrypt('__END_SESSION__');
        const message = {
          type: 'encrypted-message',
          message: encrypted
        };
        this.sendRawMessage(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending end session message:', error);
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.cryptoManager.reset();
    this.keyExchangeComplete = false;
    this.updateStatus('disconnected');
  }

  onMessage(callback: (message: string) => void): void {
    this.onMessageCallback = callback;
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open' && this.keyExchangeComplete;
  }
}
