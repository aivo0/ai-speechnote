<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EnhancedASRClient } from '$lib/asr/websocket-client';
  import { AudioProcessor } from '$lib/asr/audio-processor';
  import { 
    asrState, 
    currentSession, 
    currentSegments,
    audioMetrics,
    sessionActions,
    segmentActions,
    errorActions
  } from '$lib/asr/stores';
  import type { SpeechSegment, AudioMetrics, RecorderProps } from '$lib/asr/types';
  import ConnectionStatus from './ConnectionStatus.svelte';
  import AudioVisualizer from './AudioVisualizer.svelte';
  
  // Props
  let { 
    sessionId = undefined,
    language = 'et',
    wsUrl = 'ws://localhost:8000/ws/asr',
    onSegmentCreated = undefined,
    onSessionUpdated = undefined,
    onError = undefined 
  }: RecorderProps = $props();
  
  // Component state
  let asrClient: EnhancedASRClient | null = null;
  let audioProcessor: AudioProcessor | null = null;
  let recordingStartTime: number | null = null;
  let recordingDuration = $state(0);
  let durationTimer: number | null = null;
  let isConnecting = $state(false);
  
  // Reactive state from stores - use derived to avoid infinite loops
  let state = $derived($asrState);
  let currentSessionData = $derived($currentSession);
  let segments = $derived($currentSegments);
  let metrics = $derived($audioMetrics);
  
  // Initialize client and processor
  onMount(async () => {
    try {
      // Initialize ASR client
      asrClient = new EnhancedASRClient({ wsUrl });
      
      // Set up event listeners
      asrClient.addEventListener('connection', handleConnectionEvent);
      asrClient.addEventListener('transcription', handleTranscriptionEvent);
      asrClient.addEventListener('recording', handleRecordingEvent);
      asrClient.addEventListener('error', handleErrorEvent);
      
      // Subscribe to client state changes
      asrClient.state.subscribe(newState => {
        asrState.set(newState);
      });
      
      // Initialize audio processor
      audioProcessor = new AudioProcessor({
        sampleRate: 16000,
        bufferSize: 1024,
        channelCount: 1
      });
      
      audioProcessor.onMetrics(handleAudioMetrics);
      audioProcessor.onAudioData(handleAudioData);
      
      // Load or create session
      if (sessionId) {
        await sessionActions.loadSession(sessionId);
      } else {
        const newSessionId = await sessionActions.createSession(
          `Recording ${new Date().toLocaleString()}`,
          language
        );
        if (newSessionId) {
          sessionId = newSessionId;
        }
      }
      
    } catch (error) {
      console.error('Failed to initialize ASR recorder:', error);
      const errorMsg = error instanceof Error ? error.message : 'Initialization failed';
      errorActions.setError('general', errorMsg);
      onError?.(errorMsg);
    }
  });
  
  onDestroy(() => {
    cleanup();
  });
  
  // Event handlers
  function handleConnectionEvent(event: any) {
    console.log('Connection event:', event);
    
    if (event.data?.status === 'connected') {
      // Clear any previous connection errors when successfully connected
      errorActions.clearError('connection');
      errorActions.clearError('general');
    } else if (event.data?.status === 'disconnected') {
      // Handle unexpected disconnection
      console.log('WebSocket disconnected - connection will need to be re-established');
    } else if (event.data?.status === 'error') {
      // Handle connection errors
      errorActions.setError('connection', 'WebSocket connection failed');
    }
  }
  
  function handleTranscriptionEvent(event: any) {
    const { data } = event;
    
    if (data.isFinal && data.text.trim()) {
      // Create new segment for final transcription
      const segment: SpeechSegment = {
        id: crypto.randomUUID(),
        sessionId: currentSessionData?.id || '',
        sequence: segments.length,
        text: data.text.trim(),
        partialText: null,
        confidence: data.confidence || null,
        duration: null, // Would be calculated from audio timing
        language: language,
        alternatives: data.alternatives || null,
        isEdited: false,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      segmentActions.addSegment(segment);
      segmentActions.saveSegment(segment);
      onSegmentCreated?.(segment);
      
      // Clear partial text
      asrState.update(s => ({ ...s, partialText: '' }));
    }
  }
  
  function handleRecordingEvent(event: any) {
    const { data } = event;
    console.log('Recording event:', data);
    
    if (data.status === 'started') {
      recordingStartTime = Date.now();
      startDurationTimer();
    } else if (data.status === 'stopped') {
      stopDurationTimer();
      recordingStartTime = null;
    }
  }
  
  function handleErrorEvent(event: any) {
    const errorMsg = event.data.message || 'ASR error occurred';
    console.error('ASR error:', errorMsg);
    errorActions.setError('general', errorMsg);
    onError?.(errorMsg);
  }
  
  function handleAudioMetrics(newMetrics: AudioMetrics) {
    audioMetrics.set(newMetrics);
  }
  
  function handleAudioData(audioData: Float32Array) {
    // Send audio data to WebSocket client
    if (asrClient && state.isRecording && !state.isPaused) {
      // The WebSocket client will handle the audio data
      // This is where the enhanced client would queue and send the audio
    }
  }
  
  // Control functions
  async function connect() {
    if (!asrClient || isConnecting) return;
    
    try {
      isConnecting = true;
      // Clear all previous errors when attempting new connection
      errorActions.clearAllErrors();
      
      console.log('Attempting to connect to WebSocket...');
      await asrClient.connect();
      console.log('WebSocket connection established');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      console.error('Connection failed:', errorMsg);
      errorActions.setError('connection', errorMsg);
      onError?.(errorMsg);
    } finally {
      isConnecting = false;
    }
  }
  
  async function startRecording() {
    if (!asrClient || !audioProcessor) return;
    
    try {
      errorActions.clearAllErrors();
      
      // Clear any previous partial text to start fresh
      asrState.update(s => ({ ...s, partialText: '' }));
      
      // Always ensure audio processor is properly initialized before starting
      // This handles cases where it was stopped previously
      try {
        await audioProcessor.initialize();
      } catch (initError) {
        // If already initialized, that's fine - just continue
        console.log('Audio processor already initialized:', initError.message);
      }
      
      // Set up audio data callback
      audioProcessor.onAudioData((data) => {
        // Send to WebSocket client
        asrClient.sendAudioData(data);
        console.log('Audio data sent to WebSocket:', data.length);
      });
      
      // Start audio processing first, then update WebSocket state
      await audioProcessor.start();
      await asrClient.startRecording();
      
      recordingStartTime = Date.now();
      startDurationTimer();
      
      console.log('Recording started successfully');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('Start recording error:', errorMsg);
      errorActions.setError('audio', errorMsg);
      onError?.(errorMsg);
    }
  }
  
  function pauseRecording() {
    if (!asrClient) return;
    
    asrClient.pauseRecording();
    audioProcessor?.stop();
  }
  
  function resumeRecording() {
    if (!asrClient || !audioProcessor) return;
    
    asrClient.resumeRecording();
    audioProcessor.start();
  }
  
  async function stopRecording() {
    if (!asrClient || !audioProcessor) return;
    
    try {
      // Finalize any partial text as a segment before stopping
      const state = $asrState;
      if (state.partialText && state.partialText.trim()) {
        const segment: SpeechSegment = {
          id: crypto.randomUUID(),
          sessionId: currentSessionData?.id || '',
          sequence: segments.length,
          text: state.partialText.trim(),
          partialText: null,
          confidence: null,
          duration: null,
          language: language,
          alternatives: null,
          isEdited: false,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        segmentActions.addSegment(segment);
        await segmentActions.saveSegment(segment);
        onSegmentCreated?.(segment);
      }
      
      // Always clear partial text when stopping
      asrState.update(s => ({ ...s, partialText: '' }));
      
      await asrClient.stopRecording();
      audioProcessor.stop(); // Only stop, don't cleanup - preserve media stream
      
      stopDurationTimer();
      recordingStartTime = null;
      
      // Update session with final duration
      if (currentSessionData) {
        await sessionActions.updateSession(currentSessionData.id, {
          totalDuration: recordingDuration,
          status: 'completed',
          updatedAt: new Date()
        });
        
        onSessionUpdated?.(currentSessionData);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to stop recording';
      errorActions.setError('audio', errorMsg);
      onError?.(errorMsg);
    }
  }
  
  function disconnect() {
    asrClient?.disconnect();
    audioProcessor?.cleanup();
  }
  
  // Timer functions
  function startDurationTimer() {
    stopDurationTimer();
    durationTimer = window.setInterval(() => {
      if (recordingStartTime) {
        recordingDuration = Math.floor((Date.now() - recordingStartTime) / 1000);
      }
    }, 1000);
  }
  
  function stopDurationTimer() {
    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }
  }
  
  // Cleanup
  async function cleanup() {
    stopDurationTimer();
    await asrClient?.closeConnection();
    audioProcessor?.cleanup();
  }
  
  // Format duration for display
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Reactive getters
  let canConnect = $derived(!state.isConnected && !state.isRecording && !isConnecting);
  let canRecord = $derived(state.isConnected && !state.isRecording && currentSessionData !== null);
  let canPause = $derived(state.isRecording && !state.isPaused);
  let canResume = $derived(state.isRecording && state.isPaused);
  let canStop = $derived(state.isRecording);
</script>

<div class="asr-recorder bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Voice Recorder</h2>
      {#if currentSessionData}
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Session: {currentSessionData.title || 'Untitled'}
        </p>
      {/if}
    </div>
    
    <ConnectionStatus {state} {isConnecting} showDetails={true} />
  </div>
  
  <!-- Audio Visualizer -->
  <div class="mb-6">
    <AudioVisualizer {metrics} isActive={state.isRecording && !state.isPaused} />
  </div>
  
  <!-- Recording Duration -->
  {#if state.isRecording || recordingDuration > 0}
    <div class="text-center mb-6">
      <div class="text-3xl font-mono font-bold text-gray-900 dark:text-white">
        {formatDuration(recordingDuration)}
      </div>
      <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {state.isPaused ? 'Paused' : state.isRecording ? 'Recording' : 'Stopped'}
      </div>
    </div>
  {/if}
  
  <!-- Partial Text Display -->
  {#if state.partialText}
    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div class="text-sm text-blue-600 dark:text-blue-400 mb-2">Live transcription:</div>
      <div class="text-gray-900 dark:text-white font-medium">
        {state.partialText}
        <span class="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
      </div>
    </div>
  {/if}
  
  <!-- Control Buttons -->
  <div class="flex items-center justify-center gap-4 mb-6">
    <!-- Connect Button -->
    {#if !state.isConnected}
      <button
        onclick={connect}
        disabled={!canConnect}
        class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {#if isConnecting}
          <!-- Loading spinner -->
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        {:else}
          <!-- Connect icon -->
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Connect
        {/if}
      </button>
    {/if}
    
    <!-- Record Button -->
    {#if !state.isRecording}
      <button
        onclick={startRecording}
        disabled={!canRecord}
        class="flex items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
        Record
      </button>
    {:else}
      <!-- Pause/Resume and Stop Buttons -->
      <div class="flex gap-3">
        {#if state.isPaused}
          <button
            onclick={resumeRecording}
            disabled={!canResume}
            class="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 8L7 20V4z" />
            </svg>
            Resume
          </button>
        {:else}
          <button
            onclick={pauseRecording}
            disabled={!canPause}
            class="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            Pause
          </button>
        {/if}
        
        <button
          onclick={stopRecording}
          disabled={!canStop}
          class="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
          Stop
        </button>
      </div>
    {/if}
  </div>
  
  <!-- Session Stats -->
  {#if segments.length > 0}
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {segments.length}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Segments</div>
        </div>
        
        <div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {segments.reduce((sum, seg) => sum + seg.text.split(' ').length, 0)}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Words</div>
        </div>
        
        <div>
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatDuration(currentSessionData?.totalDuration || 0)}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Duration</div>
        </div>
        
        <div>
          <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Math.round((segments.reduce((sum, seg) => sum + (seg.confidence || 0), 0) / segments.length) * 100) || 0}%
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Error Display -->
  {#if state.error}
    <div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span class="font-medium">Error:</span>
        <span>{state.error}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .asr-recorder {
    max-width: 100%;
  }
  
  @media (max-width: 768px) {
    .asr-recorder {
      padding: 1rem;
    }
  }
</style>