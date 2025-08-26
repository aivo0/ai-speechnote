<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TranscriptSegmentProps, SpeechSegment } from '$lib/asr/types';
  import { clipboardActions } from '$lib/asr/stores';
  
  let { 
    segment, 
    isActive = false,
    onEdit = undefined,
    onDelete = undefined,
    onCopy = undefined 
  }: TranscriptSegmentProps = $props();
  
  const dispatch = createEventDispatcher();
  
  // Component state
  let isEditing = $state(false);
  let editText = $state(segment.text);
  let showActions = $state(false);
  let copySuccess = $state(false);
  let textArea: HTMLTextAreaElement;
  
  // Watch for changes to segment text
  $effect(() => {
    if (!isEditing) {
      editText = segment.text;
    }
  });
  
  // Format timestamp for display
  function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }
  
  // Format duration for display
  function formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(0).padStart(2, '0')}`;
  }
  
  // Get confidence color based on score
  function getConfidenceColor(confidence: number | null): string {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.7) return 'text-yellow-600 dark:text-yellow-400';
    if (confidence >= 0.5) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
  
  // Handle edit start
  function startEdit() {
    isEditing = true;
    editText = segment.text;
    
    // Focus textarea after next tick
    setTimeout(() => {
      if (textArea) {
        textArea.focus();
        textArea.setSelectionRange(textArea.value.length, textArea.value.length);
      }
    }, 0);
  }
  
  // Handle edit save
  async function saveEdit() {
    if (editText.trim() !== segment.text && editText.trim()) {
      onEdit?.(segment.id, editText.trim());
      dispatch('edit', { segmentId: segment.id, newText: editText.trim() });
    }
    
    isEditing = false;
    showActions = false;
  }
  
  // Handle edit cancel
  function cancelEdit() {
    editText = segment.text;
    isEditing = false;
    showActions = false;
  }
  
  // Handle copy to clipboard
  async function copyToClipboard() {
    const success = await clipboardActions.copyToClipboard(segment.text);
    
    if (success) {
      copySuccess = true;
      onCopy?.(segment.id);
      dispatch('copy', { segmentId: segment.id });
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    }
  }
  
  // Handle delete
  function deleteSegment() {
    if (confirm('Are you sure you want to delete this segment?')) {
      onDelete?.(segment.id);
      dispatch('delete', { segmentId: segment.id });
    }
  }
  
  // Handle keyboard events in edit mode
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }
  
  // Auto-resize textarea
  function autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 80) + 'px';
  }
  
  // Get word count
  let wordCount = $derived(segment.text.trim().split(/\s+/).filter(word => word).length);
  
  // Get character count
  let charCount = $derived(segment.text.length);
</script>

<div 
  class={`transcript-segment bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 ${
    isActive 
      ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' 
      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
  } ${segment.isEdited ? 'border-l-4 border-l-orange-400' : ''}`}
  role="article"
  aria-label={`Transcript segment ${segment.sequence + 1}`}
  onmouseenter={() => showActions = true}
  onmouseleave={() => !isEditing && (showActions = false)}
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 pb-2">
    <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <!-- Segment Number -->
      <div class="flex items-center gap-2">
        <div class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          isActive 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}>
          {segment.sequence + 1}
        </div>
        {#if segment.isEdited}
          <div class="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <span class="text-xs">Edited</span>
          </div>
        {/if}
      </div>
      
      <!-- Timestamp -->
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        {formatTimestamp(segment.createdAt)}
      </span>
      
      <!-- Duration -->
      {#if segment.duration}
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {formatDuration(segment.duration)}
        </span>
      {/if}
      
      <!-- Confidence -->
      {#if segment.confidence !== null}
        <span class={`flex items-center gap-1 ${getConfidenceColor(segment.confidence)}`}>
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {Math.round((segment.confidence || 0) * 100)}%
        </span>
      {/if}
    </div>
    
    <!-- Actions -->
    <div class={`flex items-center gap-2 transition-opacity ${
      showActions || isEditing ? 'opacity-100' : 'opacity-0'
    }`}>
      {#if !isEditing}
        <!-- Copy Button -->
        <button
          onclick={copyToClipboard}
          class={`p-2 rounded-md transition-colors ${
            copySuccess 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400'
          }`}
          title="Copy to clipboard"
        >
          {#if copySuccess}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          {/if}
        </button>
        
        <!-- Edit Button -->
        <button
          onclick={startEdit}
          class="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 transition-colors"
          title="Edit text"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        
        <!-- Delete Button -->
        <button
          onclick={deleteSegment}
          class="p-2 rounded-md bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors"
          title="Delete segment"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      {:else}
        <!-- Save Button -->
        <button
          onclick={saveEdit}
          class="p-2 rounded-md bg-green-100 hover:bg-green-200 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 transition-colors"
          title="Save changes (Ctrl+Enter)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </button>
        
        <!-- Cancel Button -->
        <button
          onclick={cancelEdit}
          class="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 transition-colors"
          title="Cancel editing (Escape)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Content -->
  <div class="px-4 pb-4">
    {#if isEditing}
      <textarea
        bind:this={textArea}
        bind:value={editText}
        onkeydown={handleKeydown}
        oninput={(e) => autoResize(e.currentTarget)}
        class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter transcript text..."
        rows="3"
      ></textarea>
      <div class="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          Ctrl+Enter to save, Escape to cancel
        </div>
        <div>
          {charCount} chars, {editText.trim().split(/\s+/).filter(w => w).length} words
        </div>
      </div>
    {:else}
      <div class="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
        {segment.text}
      </div>
      
      <!-- Footer Info -->
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {wordCount} words • {charCount} characters
        </div>
        
        {#if segment.alternatives && segment.alternatives.length > 1}
          <button
            class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            title="Show alternatives"
          >
            {segment.alternatives.length} alternatives
          </button>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Alternatives (collapsible) -->
  {#if segment.alternatives && segment.alternatives.length > 1}
    <details class="border-t border-gray-100 dark:border-gray-700">
      <summary class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
        Alternative transcriptions ({segment.alternatives.length - 1} more)
      </summary>
      <div class="px-4 pb-4">
        {#each segment.alternatives.slice(1) as alternative, index (index)}
          <div class="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div class="text-gray-800 dark:text-gray-200">
              {alternative.text}
            </div>
            {#if alternative.confidence}
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Confidence: {Math.round(alternative.confidence * 100)}%
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </details>
  {/if}
</div>

<style>
  .transcript-segment {
    scroll-margin-top: 100px; /* Account for fixed headers */
  }
  
  .transcript-segment:focus-within {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  textarea {
    field-sizing: content;
    min-height: 80px;
  }
  
  details[open] summary {
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 0;
  }
  
  @media (prefers-color-scheme: dark) {
    details[open] summary {
      border-bottom-color: #374151;
    }
  }
</style>