<script lang="ts">
  import { onMount } from 'svelte';
  import type { AudioMetrics } from '$lib/asr/types';
  
  interface Props {
    metrics: AudioMetrics | null;
    isActive: boolean;
    height?: number;
    showDetails?: boolean;
  }
  
  let { 
    metrics = null, 
    isActive = false, 
    height = 60, 
    showDetails = false 
  }: Props = $props();
  
  let canvas: HTMLCanvasElement;
  let animationFrame: number | null = null;
  
  // Audio level history for visualization
  let levelHistory: number[] = [];
  const maxHistoryLength = 100;
  
  onMount(() => {
    if (canvas) {
      startVisualization();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  });
  
  function startVisualization() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    function draw() {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--tw-prose-body') || '#374151';
      ctx.fillRect(0, 0, width, height);
      
      if (!isActive || !metrics) {
        // Draw inactive state
        drawInactiveState(ctx, width, height);
      } else {
        // Draw active visualization
        drawActiveVisualization(ctx, width, height);
      }
      
      animationFrame = requestAnimationFrame(draw);
    }
    
    draw();
  }
  
  function drawInactiveState(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Dark background
    ctx.fillStyle = isDarkMode() ? '#1f2937' : '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    // Center line
    ctx.strokeStyle = isDarkMode() ? '#4b5563' : '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Inactive text
    ctx.fillStyle = isDarkMode() ? '#6b7280' : '#9ca3af';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Audio visualizer (inactive)', width / 2, height / 2 + 5);
  }
  
  function drawActiveVisualization(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Background
    const bgColor = isDarkMode() ? '#111827' : '#f9fafb';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Update level history
    if (metrics) {
      levelHistory.push(metrics.level);
      if (levelHistory.length > maxHistoryLength) {
        levelHistory.shift();
      }
    }
    
    // Draw waveform
    if (levelHistory.length > 1) {
      drawWaveform(ctx, width, height);
    }
    
    // Draw current level indicator
    drawLevelIndicator(ctx, width, height);
    
    // Draw signal quality indicator
    if (showDetails && metrics) {
      drawSignalQuality(ctx, width, height);
    }
  }
  
  function drawWaveform(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const centerY = height / 2;
    const maxAmplitude = height * 0.4;
    
    // Calculate step size based on available width and history length
    const stepSize = width / Math.max(levelHistory.length - 1, 1);
    
    // Draw the waveform line
    ctx.strokeStyle = getWaveformColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    levelHistory.forEach((level, index) => {
      const x = index * stepSize;
      const y = centerY + (level - 0.5) * maxAmplitude * 2;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw filled area under the line
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = getWaveformColor();
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    levelHistory.forEach((level, index) => {
      const x = index * stepSize;
      const y = centerY + (level - 0.5) * maxAmplitude * 2;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo((levelHistory.length - 1) * stepSize, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  function drawLevelIndicator(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!metrics) return;
    
    const centerY = height / 2;
    const indicatorWidth = 60;
    const indicatorHeight = 8;
    const x = width - indicatorWidth - 10;
    const y = centerY - indicatorHeight / 2;
    
    // Background
    ctx.fillStyle = isDarkMode() ? '#374151' : '#e5e7eb';
    ctx.fillRect(x, y, indicatorWidth, indicatorHeight);
    
    // Level bar
    const levelWidth = indicatorWidth * metrics.level;
    ctx.fillStyle = getLevelColor(metrics.level);
    ctx.fillRect(x, y, levelWidth, indicatorHeight);
    
    // Peak level indicator
    if (metrics.peakLevel > 0) {
      const peakX = x + (indicatorWidth * metrics.peakLevel);
      ctx.strokeStyle = metrics.isClipping ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(peakX, y);
      ctx.lineTo(peakX, y + indicatorHeight);
      ctx.stroke();
    }
  }
  
  function drawSignalQuality(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!metrics) return;
    
    const qualityColors = {
      excellent: '#22c55e',
      good: '#eab308',
      fair: '#f97316',
      poor: '#ef4444'
    };
    
    const color = qualityColors[metrics.signalQuality];
    const radius = 6;
    const x = 20;
    const y = 20;
    
    // Quality indicator dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Quality text
    ctx.fillStyle = isDarkMode() ? '#d1d5db' : '#374151';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(metrics.signalQuality.toUpperCase(), x + radius + 8, y + 4);
    
    // Clipping indicator
    if (metrics.isClipping) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('CLIP', x, y + radius + 15);
    }
  }
  
  function getWaveformColor(): string {
    if (!metrics) return isDarkMode() ? '#3b82f6' : '#2563eb';
    
    // Color based on signal quality
    const qualityColors = {
      excellent: isDarkMode() ? '#22c55e' : '#16a34a',
      good: isDarkMode() ? '#eab308' : '#ca8a04',
      fair: isDarkMode() ? '#f97316' : '#ea580c',
      poor: isDarkMode() ? '#ef4444' : '#dc2626'
    };
    
    return qualityColors[metrics.signalQuality] || (isDarkMode() ? '#6b7280' : '#9ca3af');
  }
  
  function getLevelColor(level: number): string {
    if (level < 0.1) return isDarkMode() ? '#ef4444' : '#dc2626'; // Red for very low
    if (level < 0.3) return isDarkMode() ? '#f97316' : '#ea580c'; // Orange for low
    if (level < 0.7) return isDarkMode() ? '#22c55e' : '#16a34a'; // Green for good
    if (level < 0.9) return isDarkMode() ? '#eab308' : '#ca8a04'; // Yellow for high
    return isDarkMode() ? '#ef4444' : '#dc2626'; // Red for clipping
  }
  
  function isDarkMode(): boolean {
    // Simple dark mode detection - in a real app you'd use your theme store
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Reactive canvas resize
  $effect(() => {
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      canvas.style.width = rect.width + 'px';
      canvas.style.height = height + 'px';
    }
  });
</script>

<div class="audio-visualizer w-full bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
  <canvas
    bind:this={canvas}
    class="w-full"
    style="height: {height}px;"
  ></canvas>
  
  {#if showDetails && metrics}
    <div class="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-4">
          <span class="text-gray-600 dark:text-gray-400">
            Level: <span class="font-mono font-medium">{(metrics.level * 100).toFixed(0)}%</span>
          </span>
          <span class="text-gray-600 dark:text-gray-400">
            Peak: <span class="font-mono font-medium">{(metrics.peakLevel * 100).toFixed(0)}%</span>
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${
            {
              excellent: 'bg-green-500',
              good: 'bg-yellow-500',
              fair: 'bg-orange-500',
              poor: 'bg-red-500'
            }[metrics.signalQuality]
          }`}></div>
          <span class="text-gray-700 dark:text-gray-300 capitalize">
            {metrics.signalQuality}
          </span>
          {#if metrics.isClipping}
            <span class="text-red-600 dark:text-red-400 font-medium text-xs">
              CLIPPING
            </span>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .audio-visualizer {
    user-select: none;
  }
  
  canvas {
    display: block;
    image-rendering: pixelated;
  }
</style>