<script lang="ts">
  import type { ConnectionStatusProps, ASRClientState } from '$lib/asr/types';
  
  let { state, showDetails = false, isConnecting = false }: ConnectionStatusProps = $props();
  
  // Get status color and icon based on connection state
  function getStatusColor(state: ASRClientState, isConnecting: boolean) {
    if (isConnecting) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
    if (!state.isConnected) return 'text-red-500 bg-red-100 dark:bg-red-900/20';
    
    switch (state.connectionQuality) {
      case 'excellent': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'good': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'poor': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  }
  
  function getStatusIcon(state: ASRClientState, isConnecting: boolean) {
    if (isConnecting) {
      return `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>`;
    }
    if (!state.isConnected) {
      return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`;
    }
    
    switch (state.connectionQuality) {
      case 'excellent':
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h20v2H2zm1.15-4.05L4 11l4 4 4-4 4 4 4-4 1.85 1.95L17 17.5l-4-4-4 4-4-4z"/>
        </svg>`;
      case 'good':
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h20v2H2zm1.15-4.05L4 11l4 4 4-4v8l-4-4-4 4z"/>
        </svg>`;
      case 'poor':
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h20v2H2zm1.15-4.05L4 11l4 4v4l-4-4z"/>
        </svg>`;
      default:
        return `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
        </svg>`;
    }
  }
  
  function getStatusText(state: ASRClientState, isConnecting: boolean) {
    if (isConnecting) return 'Connecting...';
    if (!state.isConnected) return 'Disconnected';
    
    switch (state.connectionQuality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'poor': return 'Poor';
      default: return 'Connected';
    }
  }
  
  function getDetailedStatus(state: ASRClientState, isConnecting: boolean) {
    const parts = [];
    
    if (isConnecting) {
      parts.push('Connecting to server...');
    } else if (state.isConnected) {
      parts.push('Connected');
      if (state.isRecording) {
        parts.push(state.isPaused ? 'Paused' : 'Recording');
      }
    } else {
      parts.push('Disconnected');
    }
    
    if (state.error) {
      parts.push(`Error: ${state.error}`);
    }
    
    return parts.join(' • ');
  }
  
  let statusColor = $derived(getStatusColor(state, isConnecting));
  let statusIcon = $derived(getStatusIcon(state, isConnecting));
  let statusText = $derived(getStatusText(state, isConnecting));
  let detailedStatus = $derived(getDetailedStatus(state, isConnecting));
</script>

<div class="connection-status flex items-center gap-3">
  <!-- Status Indicator -->
  <div class="flex items-center gap-2">
    <div class={`flex items-center justify-center w-8 h-8 rounded-full ${statusColor}`}>
      {@html statusIcon}
    </div>
    
    {#if showDetails}
      <div class="flex flex-col">
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {statusText}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {detailedStatus}
        </div>
      </div>
    {:else}
      <span class="text-sm font-medium text-gray-900 dark:text-white">
        {statusText}
      </span>
    {/if}
  </div>
  
  <!-- Connection Quality Bars -->
  {#if state.isConnected}
    <div class="flex items-center gap-1">
      <div class="flex gap-0.5">
        <!-- Bar 1 - Always active when connected -->
        <div class={`w-1 h-4 rounded-sm ${
          state.connectionQuality !== 'disconnected' 
            ? 'bg-green-500' 
            : 'bg-gray-300 dark:bg-gray-600'
        }`}></div>
        
        <!-- Bar 2 - Active for good+ quality -->
        <div class={`w-1 h-5 rounded-sm ${
          ['good', 'excellent'].includes(state.connectionQuality) 
            ? 'bg-green-500' 
            : 'bg-gray-300 dark:bg-gray-600'
        }`}></div>
        
        <!-- Bar 3 - Active for excellent quality -->
        <div class={`w-1 h-6 rounded-sm ${
          state.connectionQuality === 'excellent' 
            ? 'bg-green-500' 
            : 'bg-gray-300 dark:bg-gray-600'
        }`}></div>
      </div>
    </div>
  {/if}
  
  <!-- Recording Indicator -->
  {#if state.isRecording}
    <div class="flex items-center gap-2">
      <div class={`w-2 h-2 rounded-full ${
        state.isPaused 
          ? 'bg-yellow-500' 
          : 'bg-red-500 animate-pulse'
      }`}></div>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
        {state.isPaused ? 'PAUSED' : 'REC'}
      </span>
    </div>
  {/if}
  
  <!-- WebSocket URL (only in detailed view) -->
  {#if showDetails && state.wsUrl}
    <div class="hidden md:block">
      <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
        {state.wsUrl.replace('wss://', '').replace('ws://', '')}
      </div>
    </div>
  {/if}
</div>

<style>
  .connection-status {
    min-width: fit-content;
  }
  
  @media (max-width: 640px) {
    .connection-status {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }
</style>