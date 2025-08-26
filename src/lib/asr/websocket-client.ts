import { writable, derived, get } from 'svelte/store';
import type {
  ASRClientState,
  ASRClientOptions,
  ASRResult,
  ConfigMessage,
  EndMessage,
  ConnectionEvent,
  RecordingEvent,
  TranscriptionEvent,
  ASREvent
} from './types';

export class EnhancedASRClient {
  private ws: WebSocket | null = null;
  private options: Required<ASRClientOptions>;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: AudioWorkletNode | null = null;
  
  // Connection management
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private connectionTimer: number | null = null;
  private reconnectCount = 0;
  private lastPongTime = 0;
  private connectionStartTime = 0;
  
  // Audio queue management
  private audioQueue: ArrayBuffer[] = [];
  private sending = false;
  private isDestroyed = false;
  
  // Event handling
  private eventListeners: Map<string, Set<(event: ASREvent) => void>> = new Map();
  
  // Svelte stores
  private _state = writable<ASRClientState>({
    isConnected: false,
    isRecording: false,
    isPaused: false,
    connectionQuality: "disconnected",
    partialText: '',
    error: null,
    wsUrl: ''
  });
  
  public readonly state = { subscribe: this._state.subscribe };
  
  // Derived stores for convenience
  public readonly isConnected = derived(this._state, ($state) => $state.isConnected);
  public readonly isRecording = derived(this._state, ($state) => $state.isRecording);
  public readonly isPaused = derived(this._state, ($state) => $state.isPaused);
  public readonly partialText = derived(this._state, ($state) => $state.partialText);
  public readonly connectionQuality = derived(this._state, ($state) => $state.connectionQuality);
  
  constructor(options: ASRClientOptions = {}) {
    // Set default options
    this.options = {
      wsUrl: options.wsUrl || 'wss://tekstiks.ee/asr/ws/asr',
      sampleRate: options.sampleRate || 16000,
      bufferSize: options.bufferSize || 1024,
      maxQueueSize: options.maxQueueSize || 20,
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      connectionTimeout: options.connectionTimeout || 10000
    };
    
    this._state.update(state => ({ ...state, wsUrl: this.options.wsUrl }));
  }
  
  // ============================================
  // Public API Methods
  // ============================================
  
  async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Client has been destroyed');
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    await this.establishConnection();
  }
  
  async startRecording(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    if (get(this._state).isRecording) {
      console.log('Already recording');
      return;
    }
    
    try {
      await this.initializeAudio();
      this._state.update(state => ({ ...state, isRecording: true, isPaused: false, error: null }));
      this.emitEvent('recording', { status: 'started', duration: 0 });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recording';
      this._state.update(state => ({ ...state, error: errorMsg }));
      throw error;
    }
  }
  
  pauseRecording(): void {
    if (!get(this._state).isRecording || get(this._state).isPaused) {
      return;
    }
    
    this._state.update(state => ({ ...state, isPaused: true }));
    this.emitEvent('recording', { status: 'paused', duration: this.getRecordingDuration() });
  }
  
  resumeRecording(): void {
    if (!get(this._state).isRecording || !get(this._state).isPaused) {
      return;
    }
    
    this._state.update(state => ({ ...state, isPaused: false }));
    this.emitEvent('recording', { status: 'started', duration: this.getRecordingDuration() });
  }
  
  async stopRecording(): Promise<void> {
    const state = get(this._state);
    if (!state.isRecording) {
      return;
    }
    
    this._state.update(s => ({ ...s, isRecording: false, isPaused: false }));
    
    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Disconnect audio processing
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    // Flush remaining audio and send end signal
    await this.flushAudioQueue();
    this.sendEndSignal();
    
    this.emitEvent('recording', { status: 'stopped', duration: this.getRecordingDuration() });
  }
  
  disconnect(): void {
    this.cleanupConnection();
    this._state.update(state => ({
      ...state,
      isConnected: false,
      isRecording: false,
      isPaused: false,
      connectionQuality: "disconnected"
    }));
  }
  
  destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    if (get(this._state).isRecording) {
      this.stopRecording();
    }
    this.eventListeners.clear();
  }
  
  // ============================================
  // Event Management
  // ============================================
  
  addEventListener(type: string, listener: (event: ASREvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }
  
  removeEventListener(type: string, listener: (event: ASREvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  
  private emitEvent(type: string, data: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: ASREvent = {
        type: type as any,
        timestamp: new Date(),
        data
      };
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
  
  // ============================================
  // Connection Management
  // ============================================
  
  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to:', this.options.wsUrl);
        this.connectionStartTime = Date.now();
        
        // Set connection timeout
        this.connectionTimer = window.setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.options.connectionTimeout);
        
        this.ws = new WebSocket(this.options.wsUrl);
        this.ws.binaryType = 'arraybuffer';
        
        this.ws.onopen = () => {
          console.log('WebSocket connected successfully');
          
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }
          
          this.reconnectCount = 0;
          this._state.update(state => ({
            ...state,
            isConnected: true,
            connectionQuality: "excellent",
            error: null
          }));
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Send configuration
          this.sendConfig();
          
          this.emitEvent('connection', {
            status: 'connected',
            quality: 'excellent',
            latency: Date.now() - this.connectionStartTime
          });
          
          resolve();
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason, {
            wasClean: event.wasClean,
            timestamp: new Date().toISOString()
          });
          
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }
          
          this.stopHeartbeat();
          this._state.update(state => ({
            ...state,
            isConnected: false,
            connectionQuality: "disconnected"
          }));
          
          this.emitEvent('connection', { status: 'disconnected' });
          
          // Attempt reconnection if not intentionally closed
          if (!this.isDestroyed && event.code !== 1000) {
            this.scheduleReconnect();
          }
        };
        
        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          const errorMsg = 'WebSocket connection error';
          this._state.update(state => ({
            ...state,
            error: errorMsg,
            connectionQuality: "disconnected"
          }));
          
          this.emitEvent('connection', { status: 'error' });
          
          if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
          }
          
          reject(new Error(errorMsg));
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.options.reconnectAttempts) {
      const errorMsg = `Failed to reconnect after ${this.options.reconnectAttempts} attempts`;
      this._state.update(state => ({ ...state, error: errorMsg }));
      return;
    }
    
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectCount),
      30000 // Max 30 seconds
    );
    
    console.log(`Scheduling reconnect attempt ${this.reconnectCount + 1} in ${delay}ms`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectCount++;
      this.establishConnection().catch(error => {
        console.error('Reconnect failed:', error);
        this.scheduleReconnect();
      });
    }, delay);
  }
  
  private cleanupConnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.reconnectCount = 0;
  }
  
  // ============================================
  // Heartbeat Management
  // ============================================
  
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongTime = Date.now();
    
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping
        this.ws.send(JSON.stringify({ event: 'ping', timestamp: Date.now() }));
        
        // Check if we received a pong recently
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > this.options.heartbeatInterval * 2) {
          console.warn('Heartbeat timeout, connection may be dead');
          this._state.update(state => ({ ...state, connectionQuality: "poor" }));
        }
      }
    }, this.options.heartbeatInterval);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  // ============================================
  // Message Handling
  // ============================================
  
  private handleMessage(event: MessageEvent): void {
    try {
      const result: ASRResult = JSON.parse(event.data);
      
      // Handle pong response
      if ('event' in result && result.event === 'pong') {
        this.lastPongTime = Date.now();
        this.updateConnectionQuality();
        return;
      }
      
      // Handle error
      if (result.error) {
        console.error('Server error:', result.error);
        this._state.update(state => ({ ...state, error: result.error! }));
        this.emitEvent('error', { message: result.error });
        return;
      }
      
      // Handle transcription results
      if (result.is_final) {
        // Final result
        const text = result.alternatives && result.alternatives.length > 0
          ? result.alternatives[0].text
          : '';
        
        this._state.update(state => ({ ...state, partialText: '' }));
        
        this.emitEvent('transcription', {
          segmentId: this.generateSegmentId(),
          text,
          isFinal: true,
          confidence: result.alternatives?.[0]?.confidence,
          alternatives: result.alternatives
        });
      } else {
        // Partial result
        this._state.update(state => ({
          ...state,
          partialText: result.text || ''
        }));
        
        this.emitEvent('transcription', {
          segmentId: this.generateSegmentId(),
          text: result.text || '',
          isFinal: false
        });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
  
  private updateConnectionQuality(): void {
    // Simple quality assessment based on response time
    const now = Date.now();
    const latency = now - this.lastPongTime;
    
    let quality: "excellent" | "good" | "poor" = "excellent";
    if (latency > 1000) quality = "poor";
    else if (latency > 500) quality = "good";
    
    this._state.update(state => ({ ...state, connectionQuality: quality }));
  }
  
  // ============================================
  // Audio Processing
  // ============================================
  
  private async initializeAudio(): Promise<void> {
    // Get user media
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: this.options.sampleRate,
        echoCancellation: true,
        noiseSuppression: true
      }
    });
    
    // Create audio context
    this.audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
    
    // Load audio processor
    await this.loadAudioProcessor();
    
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.processor = new AudioWorkletNode(this.audioContext, 'audio-processor');
    
    // Handle audio data
    this.processor.port.onmessage = (event: MessageEvent) => {
      if (get(this._state).isPaused) return;
      
      const { type, data } = event.data;
      if (type === 'audiodata') {
        const pcmData = this.float32ToPCM16(data as Float32Array);
        this.queueAudio(pcmData);
      }
    };
    
    // Connect audio nodes
    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }
  
  private async loadAudioProcessor(): Promise<void> {
    const processorCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.bufferSize = ${this.options.bufferSize};
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }
        
        process(inputs) {
          const input = inputs[0];
          if (!input || input.length === 0) return true;
          
          const inputChannel = input[0];
          for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.bufferIndex] = inputChannel[i];
            this.bufferIndex++;
            
            if (this.bufferIndex >= this.bufferSize) {
              this.port.postMessage({
                type: 'audiodata',
                data: new Float32Array(this.buffer)
              });
              this.bufferIndex = 0;
            }
          }
          
          return true;
        }
      }
      
      registerProcessor('audio-processor', AudioProcessor);
    `;
    
    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const processorUrl = URL.createObjectURL(blob);
    await this.audioContext!.audioWorklet.addModule(processorUrl);
    URL.revokeObjectURL(processorUrl);
  }
  
  private float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, sample, true); // little-endian
    }
    
    return buffer;
  }
  
  private queueAudio(audioData: ArrayBuffer): void {
    if (this.audioQueue.length < this.options.maxQueueSize) {
      this.audioQueue.push(audioData);
      this.processSendQueue();
    } else {
      console.warn('Audio queue full, dropping chunk');
    }
  }
  
  private async processSendQueue(): Promise<void> {
    if (this.sending || this.audioQueue.length === 0 || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.sending = true;
    
    try {
      while (this.audioQueue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
        const audioData = this.audioQueue.shift()!;
        this.ws.send(audioData);
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      this._state.update(state => ({ ...state, error: 'Failed to send audio data' }));
    } finally {
      this.sending = false;
    }
  }
  
  private async flushAudioQueue(): Promise<void> {
    while (this.audioQueue.length > 0) {
      await this.processSendQueue();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  // ============================================
  // WebSocket Communication
  // ============================================
  
  private sendConfig(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const config: ConfigMessage = {
        event: 'config',
        n_best: 1
      };
      this.ws.send(JSON.stringify(config));
    }
  }
  
  private sendEndSignal(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const endMsg: EndMessage = { event: 'end' };
      this.ws.send(JSON.stringify(endMsg));
    }
  }
  
  // ============================================
  // Utility Methods
  // ============================================
  
  private generateSegmentId(): string {
    return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getRecordingDuration(): number {
    // This would need to be tracked properly in a real implementation
    return 0;
  }
}

// Singleton instance for convenience
let defaultClient: EnhancedASRClient | null = null;

export function getASRClient(options?: ASRClientOptions): EnhancedASRClient {
  if (!defaultClient) {
    defaultClient = new EnhancedASRClient(options);
  }
  return defaultClient;
}