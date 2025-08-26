import type { AudioConfig, AudioMetrics } from './types';

// ============================================
// Audio Processing Utilities
// ============================================

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;
  
  private config: AudioConfig = {
    sampleRate: 16000,
    channelCount: 1,
    bufferSize: 1024,
    echoCancellation: true,
    noiseSuppression: true
  };
  
  private isProcessing = false;
  private metricsCallback: ((metrics: AudioMetrics) => void) | null = null;
  private dataCallback: ((data: Float32Array) => void) | null = null;
  
  constructor(config?: Partial<AudioConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }
  
  // ============================================
  // Public Methods
  // ============================================
  
  async initialize(): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Audio processor already initialized');
    }
    
    try {
      // Get user media with specified constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channelCount,
          sampleRate: this.config.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          // Additional constraints for better audio quality
          autoGainControl: true
        }
      });
      
      // Create audio context with desired sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });
      
      // Create analyser for audio metrics
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create source from media stream
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Load and create audio worklet processor
      await this.loadAudioWorklet();
      
      // Create processor node
      this.processor = new AudioWorkletNode(this.audioContext, 'enhanced-audio-processor', {
        processorOptions: {
          bufferSize: this.config.bufferSize
        }
      });
      
      // Set up processor message handling
      this.processor.port.onmessage = (event: MessageEvent) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'audiodata':
            if (this.dataCallback) {
              this.dataCallback(data as Float32Array);
            }
            break;
          case 'metrics':
            if (this.metricsCallback) {
              this.metricsCallback(data as AudioMetrics);
            }
            break;
          case 'error':
            console.error('Audio processor error:', data);
            break;
        }
      };
      
      // Connect audio graph
      this.source.connect(this.analyser);
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isProcessing = true;
      
      console.log('Audio processor initialized:', {
        sampleRate: this.audioContext.sampleRate,
        bufferSize: this.config.bufferSize,
        channelCount: this.config.channelCount
      });
      
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      await this.cleanup();
      throw error;
    }
  }
  
  async start(): Promise<void> {
    if (!this.audioContext || !this.processor) {
      throw new Error('Audio processor not initialized');
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    // Send start message to processor
    this.processor.port.postMessage({ type: 'start' });
    
    // Start metrics collection if callback is set
    if (this.metricsCallback) {
      this.startMetricsCollection();
    }
  }
  
  stop(): void {
    if (this.processor) {
      this.processor.port.postMessage({ type: 'stop' });
    }
    
    this.stopMetricsCollection();
  }
  
  async cleanup(): Promise<void> {
    this.stop();
    
    // Stop all tracks in the media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, track.label);
      });
      this.mediaStream = null;
    }
    
    // Disconnect audio nodes
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isProcessing = false;
    console.log('Audio processor cleanup completed');
  }
  
  // ============================================
  // Callback Registration
  // ============================================
  
  onAudioData(callback: (data: Float32Array) => void): void {
    this.dataCallback = callback;
  }
  
  onMetrics(callback: (metrics: AudioMetrics) => void): void {
    this.metricsCallback = callback;
  }
  
  // ============================================
  // Audio Analysis
  // ============================================
  
  getCurrentMetrics(): AudioMetrics | null {
    if (!this.analyser) {
      return null;
    }
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);
    
    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(timeDataArray);
    
    // Calculate RMS level
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < timeDataArray.length; i++) {
      const sample = (timeDataArray[i] - 128) / 128;
      sum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    
    const rms = Math.sqrt(sum / timeDataArray.length);
    const level = Math.min(rms * 3, 1); // Amplify for better visualization
    
    // Detect clipping
    const isClipping = peak > 0.95;
    
    // Assess signal quality based on frequency distribution
    let highFreqEnergy = 0;
    let totalEnergy = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const energy = dataArray[i] / 255;
      totalEnergy += energy;
      if (i > dataArray.length * 0.7) { // High frequency bins
        highFreqEnergy += energy;
      }
    }
    
    const highFreqRatio = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
    
    let signalQuality: "excellent" | "good" | "fair" | "poor" = "excellent";
    if (level < 0.01) signalQuality = "poor";
    else if (level < 0.05) signalQuality = "fair";
    else if (level < 0.15) signalQuality = "good";
    
    // Adjust quality based on frequency content
    if (highFreqRatio < 0.1) {
      signalQuality = signalQuality === "excellent" ? "good" : 
                     signalQuality === "good" ? "fair" : "poor";
    }
    
    return {
      level,
      peakLevel: peak,
      isClipping,
      signalQuality
    };
  }
  
  // ============================================
  // Private Methods
  // ============================================
  
  private async loadAudioWorklet(): Promise<void> {
    const workletCode = `
      class EnhancedAudioProcessor extends AudioWorkletProcessor {
        constructor(options) {
          super();
          
          this.bufferSize = options.processorOptions?.bufferSize || 1024;
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
          this.isProcessing = false;
          
          // Metrics tracking
          this.metricsCounter = 0;
          this.lastMetricsTime = currentTime;
          
          console.log('Enhanced audio processor initialized with buffer size:', this.bufferSize);
          
          this.port.onmessage = (event) => {
            const { type } = event.data;
            
            switch (type) {
              case 'start':
                this.isProcessing = true;
                console.log('Audio processing started');
                break;
              case 'stop':
                this.isProcessing = false;
                console.log('Audio processing stopped');
                break;
            }
          };
        }
        
        process(inputs, outputs, parameters) {
          if (!this.isProcessing) {
            return true;
          }
          
          const input = inputs[0];
          if (!input || input.length === 0) {
            return true;
          }
          
          const inputChannel = input[0];
          
          // Process audio samples
          for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.bufferIndex] = inputChannel[i];
            this.bufferIndex++;
            
            if (this.bufferIndex >= this.bufferSize) {
              // Send audio data
              const audioData = new Float32Array(this.buffer);
              this.port.postMessage({
                type: 'audiodata',
                data: audioData
              });
              
              // Calculate and send metrics periodically
              this.metricsCounter++;
              if (this.metricsCounter % 10 === 0) { // Every 10 buffers
                this.sendMetrics(audioData);
              }
              
              this.bufferIndex = 0;
            }
          }
          
          return true;
        }
        
        sendMetrics(audioData) {
          try {
            // Calculate RMS
            let sum = 0;
            let peak = 0;
            for (let i = 0; i < audioData.length; i++) {
              const sample = audioData[i];
              sum += sample * sample;
              peak = Math.max(peak, Math.abs(sample));
            }
            
            const rms = Math.sqrt(sum / audioData.length);
            const level = Math.min(rms * 3, 1);
            const isClipping = peak > 0.95;
            
            // Simple signal quality assessment
            let signalQuality = "excellent";
            if (level < 0.01) signalQuality = "poor";
            else if (level < 0.05) signalQuality = "fair";
            else if (level < 0.15) signalQuality = "good";
            
            this.port.postMessage({
              type: 'metrics',
              data: {
                level,
                peakLevel: peak,
                isClipping,
                signalQuality
              }
            });
          } catch (error) {
            this.port.postMessage({
              type: 'error',
              data: 'Failed to calculate metrics: ' + error.message
            });
          }
        }
      }
      
      registerProcessor('enhanced-audio-processor', EnhancedAudioProcessor);
    `;
    
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    
    try {
      await this.audioContext!.audioWorklet.addModule(workletUrl);
      console.log('Audio worklet loaded successfully');
    } finally {
      URL.revokeObjectURL(workletUrl);
    }
  }
  
  private metricsInterval: number | null = null;
  
  private startMetricsCollection(): void {
    this.stopMetricsCollection();
    
    this.metricsInterval = window.setInterval(() => {
      const metrics = this.getCurrentMetrics();
      if (metrics && this.metricsCallback) {
        this.metricsCallback(metrics);
      }
    }, 100); // Update metrics 10 times per second
  }
  
  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// ============================================
// Audio Format Conversion Utilities
// ============================================

export class AudioConverter {
  /**
   * Convert Float32Array to 16-bit PCM (little-endian)
   */
  static float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp and convert to 16-bit
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, sample, true); // little-endian
    }
    
    return buffer;
  }
  
  /**
   * Convert 16-bit PCM to Float32Array
   */
  static pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
    const view = new DataView(buffer);
    const float32Array = new Float32Array(buffer.byteLength / 2);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = view.getInt16(i * 2, true); // little-endian
      float32Array[i] = sample < 0 ? sample / 0x8000 : sample / 0x7FFF;
    }
    
    return float32Array;
  }
  
  /**
   * Resample audio data (simple linear interpolation)
   */
  static resample(
    inputData: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number
  ): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputData;
    }
    
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const sourceIndexFloor = Math.floor(sourceIndex);
      const sourceIndexCeil = Math.min(Math.ceil(sourceIndex), inputData.length - 1);
      const fraction = sourceIndex - sourceIndexFloor;
      
      // Linear interpolation
      outputData[i] = inputData[sourceIndexFloor] * (1 - fraction) + 
                     inputData[sourceIndexCeil] * fraction;
    }
    
    return outputData;
  }
  
  /**
   * Apply basic audio normalization
   */
  static normalize(audioData: Float32Array, targetLevel: number = 0.8): Float32Array {
    // Find peak level
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      peak = Math.max(peak, Math.abs(audioData[i]));
    }
    
    // Avoid division by zero
    if (peak === 0) {
      return audioData;
    }
    
    // Calculate gain to reach target level
    const gain = targetLevel / peak;
    
    // Apply gain (but don't amplify beyond target)
    const normalizedData = new Float32Array(audioData.length);
    if (gain <= 1.0) {
      for (let i = 0; i < audioData.length; i++) {
        normalizedData[i] = audioData[i] * gain;
      }
    } else {
      // Don't amplify, just copy
      normalizedData.set(audioData);
    }
    
    return normalizedData;
  }
  
  /**
   * Apply simple high-pass filter to remove DC offset
   */
  static highPassFilter(audioData: Float32Array, cutoffFreq: number = 80, sampleRate: number = 16000): Float32Array {
    const filteredData = new Float32Array(audioData.length);
    const RC = 1.0 / (2 * Math.PI * cutoffFreq);
    const dt = 1.0 / sampleRate;
    const alpha = RC / (RC + dt);
    
    filteredData[0] = audioData[0];
    
    for (let i = 1; i < audioData.length; i++) {
      filteredData[i] = alpha * (filteredData[i - 1] + audioData[i] - audioData[i - 1]);
    }
    
    return filteredData;
  }
}

// ============================================
// Audio Quality Assessment
// ============================================

export class AudioQualityAnalyzer {
  /**
   * Analyze audio quality metrics
   */
  static analyze(audioData: Float32Array, sampleRate: number = 16000): AudioMetrics {
    // Calculate RMS level
    let sumSquares = 0;
    let peak = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i];
      sumSquares += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    
    const rms = Math.sqrt(sumSquares / audioData.length);
    const level = Math.min(rms * 3, 1); // Scale for visualization
    
    // Detect clipping
    const isClipping = peak > 0.95;
    
    // Assess signal quality
    let signalQuality: "excellent" | "good" | "fair" | "poor" = "excellent";
    
    if (level < 0.005) signalQuality = "poor";
    else if (level < 0.02) signalQuality = "fair";
    else if (level < 0.1) signalQuality = "good";
    
    // Additional quality checks
    if (isClipping) {
      signalQuality = signalQuality === "excellent" ? "good" : 
                     signalQuality === "good" ? "fair" : "poor";
    }
    
    // Check for silence or very low signal
    if (peak < 0.001) {
      signalQuality = "poor";
    }
    
    return {
      level,
      peakLevel: peak,
      isClipping,
      signalQuality
    };
  }
  
  /**
   * Calculate zero-crossing rate (useful for voice activity detection)
   */
  static calculateZeroCrossingRate(audioData: Float32Array): number {
    let crossings = 0;
    
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i - 1] >= 0) !== (audioData[i] >= 0)) {
        crossings++;
      }
    }
    
    return crossings / (audioData.length - 1);
  }
  
  /**
   * Simple voice activity detection
   */
  static detectVoiceActivity(
    audioData: Float32Array, 
    threshold: number = 0.01,
    zcrThreshold: number = 0.3
  ): boolean {
    const metrics = this.analyze(audioData);
    const zcr = this.calculateZeroCrossingRate(audioData);
    
    // Voice typically has moderate energy and lower zero-crossing rate
    return metrics.level > threshold && zcr < zcrThreshold;
  }
}