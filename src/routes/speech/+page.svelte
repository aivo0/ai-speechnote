<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ASRRecorder from '$lib/components/speech/ASRRecorder.svelte';
  import TranscriptSegment from '$lib/components/speech/TranscriptSegment.svelte';
  import { 
    currentSession, 
    currentSegments,
    recentSessions,
    sessionActions,
    segmentActions,
    uiPreferences,
    exportOptions,
    clipboardActions,
    errorActions
  } from '$lib/asr/stores';
  import type { SpeechSegment, SpeechSession } from '$lib/asr/types';
  import * as m from '$lib/paraglide/messages';
  
  // Component state
  let showSessionsList = $state(false);
  let showExportDialog = $state(false);
  let isExporting = $state(false);
  let autoScrollEnabled = $state(true);
  let transcriptContainer: HTMLElement;
  
  // Reactive state from stores - use derived to avoid infinite loops
  let session = $derived($currentSession);
  let segments = $derived($currentSegments);
  let sessions = $derived($recentSessions);
  let preferences = $derived($uiPreferences);
  let exportOpts = $derived($exportOptions);
  
  // Auto-scroll effect
  $effect(() => {
    // Auto-scroll to latest segment if enabled
    if (autoScrollEnabled && segments.length > 0 && transcriptContainer) {
      setTimeout(() => {
        transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
      }, 100);
    }
  });
  
  onMount(() => {
    // Initialize if no current session
    if (!session) {
      createNewSession();
    }
    
    // Set up keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            createNewSession();
            break;
          case 'e':
            e.preventDefault();
            showExportDialog = true;
            break;
          case 'l':
            e.preventDefault();
            showSessionsList = !showSessionsList;
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
  
  // Session management
  async function createNewSession() {
    const sessionId = await sessionActions.createSession(
      `Recording ${new Date().toLocaleString()}`,
      'et'
    );
    
    if (!sessionId) {
      errorActions.setError('session', 'Failed to create new session');
    }
  }
  
  async function loadSession(sessionId: string) {
    const success = await sessionActions.loadSession(sessionId);
    if (success) {
      showSessionsList = false;
    }
  }
  
  async function deleteSession(sessionId: string) {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      const success = await sessionActions.deleteSession(sessionId);
      if (success && session?.id === sessionId) {
        createNewSession();
      }
    }
  }
  
  // Segment management
  function handleSegmentEdit(segmentId: string, newText: string) {
    segmentActions.updateSegment(segmentId, {
      text: newText,
      isEdited: true
    });
  }
  
  function handleSegmentDelete(segmentId: string) {
    segmentActions.deleteSegment(segmentId);
  }
  
  function handleSegmentCopy(segmentId: string) {
    // Visual feedback is handled by the component
    console.log('Copied segment:', segmentId);
  }
  
  // Export functionality
  async function exportSession() {
    if (!session || segments.length === 0) {
      alert('No transcript to export');
      return;
    }
    
    isExporting = true;
    
    try {
      const response = await fetch(`/api/speech/sessions/${session.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportOpts)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.title || 'transcript'}.${exportOpts.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showExportDialog = false;
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export session');
    } finally {
      isExporting = false;
    }
  }
  
  // Copy all text to clipboard
  async function copyAllText() {
    const allText = segments.map(seg => seg.text).join('\n\n');
    const success = await clipboardActions.copyToClipboard(allText);
    
    if (success) {
      // Show success feedback
      const button = document.querySelector('[data-copy-all]');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }
  }
  
  // Format session title for display
  function formatSessionTitle(session: SpeechSession): string {
    return session.title || `Session ${new Date(session.createdAt).toLocaleDateString()}`;
  }
  
  // Format session date for display
  function formatSessionDate(date: Date): string {
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  }
  
  // Toggle auto-scroll
  function toggleAutoScroll() {
    autoScrollEnabled = !autoScrollEnabled;
    uiPreferences.update(prefs => ({ ...prefs, autoScroll: autoScrollEnabled }));
  }
</script>

<svelte:head>
  <title>Speech Recognition - SpeechNote</title>
  <meta name="description" content="Real-time speech recognition and transcription" />
</svelte:head>

<div class="speech-page min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-4">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Speech Recognition
          </h1>
          
          {#if session}
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {formatSessionTitle(session)}
            </div>
          {/if}
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Sessions List Button -->
          <button
            onclick={() => showSessionsList = !showSessionsList}
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Sessions (Ctrl+L)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Sessions
          </button>
          
          <!-- New Session Button -->
          <button
            onclick={createNewSession}
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            title="New Session (Ctrl+N)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            New
          </button>
          
          <!-- Export Button -->
          {#if segments.length > 0}
            <button
              onclick={() => showExportDialog = true}
              class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Export (Ctrl+E)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recorder Panel -->
      <div class="lg:col-span-1">
        <div class="sticky top-32">
          <ASRRecorder
            sessionId={session?.id}
            language="et"
            wsUrl="wss://tekstiks.ee/asr/ws/asr"
          />
        </div>
      </div>
      
      <!-- Transcript Panel -->
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <!-- Transcript Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Transcript
              </h2>
              {#if segments.length > 0}
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {segments.length} segments • {segments.reduce((sum, seg) => sum + seg.text.split(' ').length, 0)} words
                </p>
              {/if}
            </div>
            
            {#if segments.length > 0}
              <div class="flex items-center gap-3">
                <!-- Auto-scroll Toggle -->
                <button
                  onclick={toggleAutoScroll}
                  class={`p-2 rounded-md transition-colors ${
                    autoScrollEnabled 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  title="Toggle auto-scroll"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                  </svg>
                </button>
                
                <!-- Copy All Button -->
                <button
                  onclick={copyAllText}
                  data-copy-all
                  class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Copy all text"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy All
                </button>
              </div>
            {/if}
          </div>
          
          <!-- Transcript Content -->
          <div 
            bind:this={transcriptContainer}
            class="transcript-container max-h-96 overflow-y-auto p-6"
          >
            {#if segments.length === 0}
              <div class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No transcript yet
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Start recording to see your transcript appear here
                </p>
              </div>
            {:else}
              <div class="space-y-4">
                {#each segments as segment (segment.id)}
                  <TranscriptSegment
                    {segment}
                    onEdit={handleSegmentEdit}
                    onDelete={handleSegmentDelete}
                    onCopy={handleSegmentCopy}
                  />
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Sessions List Modal -->
{#if showSessionsList}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Sessions
        </h3>
        <button
          onclick={() => showSessionsList = false}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="overflow-y-auto max-h-80">
        {#if sessions.length === 0}
          <div class="p-6 text-center text-gray-600 dark:text-gray-400">
            No sessions found
          </div>
        {:else}
          {#each sessions as sessionItem (sessionItem.id)}
            <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {formatSessionTitle(sessionItem)}
                  </h4>
                  {#if sessionItem.id === session?.id}
                    <span class="px-2 py-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                      Current
                    </span>
                  {/if}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatSessionDate(sessionItem.createdAt)} • {sessionItem.segmentCount} segments
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  onclick={() => loadSession(sessionItem.id)}
                  class="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  Load
                </button>
                <button
                  onclick={() => deleteSession(sessionItem.id)}
                  class="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  Delete
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Export Dialog -->
{#if showExportDialog}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Export Transcript
        </h3>
        <button
          onclick={() => showExportDialog = false}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="p-6 space-y-4">
        <!-- Format Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format
          </label>
          <select 
            bind:value={exportOpts.format}
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="txt">Plain Text (.txt)</option>
            <option value="json">JSON (.json)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="docx">Word Document (.docx)</option>
          </select>
        </div>
        
        <!-- Options -->
        <div class="space-y-3">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              bind:checked={exportOpts.includeMetadata}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Include metadata (timestamps, confidence)
            </span>
          </label>
          
          <label class="flex items-center">
            <input 
              type="checkbox" 
              bind:checked={exportOpts.includeTimestamps}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Include timestamps
            </span>
          </label>
          
          <label class="flex items-center">
            <input 
              type="checkbox" 
              bind:checked={exportOpts.includeAlternatives}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Include alternative transcriptions
            </span>
          </label>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <button
            onclick={() => showExportDialog = false}
            class="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onclick={exportSession}
            disabled={isExporting}
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .transcript-container {
    scroll-behavior: smooth;
  }
  
  .speech-page {
    min-height: calc(100vh - 4rem); /* Account for header */
  }
  
  @media (max-width: 1024px) {
    .transcript-container {
      max-height: 50vh;
    }
  }
</style>