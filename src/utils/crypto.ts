import { EncryptedMessage } from '../types/chat';

export class CryptoManager {
  private keyPair: CryptoKeyPair | null = null;
  private sharedKey: CryptoKey | null = null;

  async generateKeyPair(): Promise<JsonWebKey> {
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey']
    );

    const publicKey = await window.crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
    return publicKey;
  }

  async deriveSharedKey(peerPublicKey: JsonWebKey): Promise<void> {
    if (!this.keyPair) {
      throw new Error('Key pair not generated');
    }

    const importedPeerKey = await window.crypto.subtle.importKey(
      'jwk',
      peerPublicKey,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      []
    );

    this.sharedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: importedPeerKey
      },
      this.keyPair.privateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plaintext: string): Promise<EncryptedMessage> {
    if (!this.sharedKey) {
      throw new Error('Shared key not derived');
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.sharedKey,
      data
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  async decrypt(encryptedMessage: EncryptedMessage): Promise<string> {
    if (!this.sharedKey) {
      throw new Error('Shared key not derived');
    }

    const iv = new Uint8Array(encryptedMessage.iv);
    const data = new Uint8Array(encryptedMessage.data);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.sharedKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  hasSharedKey(): boolean {
    return this.sharedKey !== null;
  }

  reset(): void {
    this.keyPair = null;
    this.sharedKey = null;
  }
}
