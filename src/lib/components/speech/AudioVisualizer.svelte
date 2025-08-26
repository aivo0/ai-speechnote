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
  
  // For testing - provide dummy metrics when none available
  let displayMetrics = $derived(
    metrics || (isActive ? {
      level: 0.2 + 0.15 * Math.sin(Date.now() / 300) + 0.05 * Math.random(),
      peakLevel: 0.6 + 0.2 * Math.sin(Date.now() / 500),
      isClipping: false,
      signalQuality: 'good' as const
    } : null)
  );
  
  let canvas: HTMLCanvasElement;
  let animationFrame: number | null = null;
  
  // Audio level history for visualization
  let levelHistory: number[] = [];
  const maxHistoryLength = 80;
  
  onMount(() => {
    if (canvas) {
      setupCanvas();
      startVisualization();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  });
  
  function setupCanvas() {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual canvas size
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    
    // Set display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = height + 'px';
    
    // Scale context to device pixel ratio
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }
  
  function startVisualization() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    function draw() {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Clear canvas with proper dimensions
      ctx.clearRect(0, 0, width, height);
      
      if (!isActive || !displayMetrics) {
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
    // Background
    ctx.fillStyle = isDarkMode() ? '#1f2937' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Draw a simple flat line in the center when inactive
    const centerY = height / 2;
    ctx.strokeStyle = isDarkMode() ? '#374151' : '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(width - 10, centerY);
    ctx.stroke();
  }
  
  function drawActiveVisualization(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Background
    const bgColor = isDarkMode() ? '#111827' : '#f9fafb';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Update level history
    if (displayMetrics) {
      levelHistory.push(displayMetrics.level);
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
    if (showDetails && displayMetrics) {
      drawSignalQuality(ctx, width, height);
    }
  }
  
  function drawWaveform(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const centerY = height / 2;
    const maxAmplitude = height * 0.35;
    
    // Calculate step size based on available width and history length
    const stepSize = width / Math.max(levelHistory.length - 1, 1);
    
    // Draw the waveform line
    ctx.strokeStyle = getWaveformColor();
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    levelHistory.forEach((level, index) => {
      const x = index * stepSize;
      // Normalize level (0-1) to waveform amplitude (-1 to 1 around center)
      const amplitude = (level - 0.3) * 2; // Center around 0.3, scale by 2
      const y = centerY - (amplitude * maxAmplitude);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw filled area under the line
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = getWaveformColor();
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    levelHistory.forEach((level, index) => {
      const x = index * stepSize;
      const amplitude = (level - 0.3) * 2;
      const y = centerY - (amplitude * maxAmplitude);
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo((levelHistory.length - 1) * stepSize, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  function drawLevelIndicator(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!displayMetrics) return;
    
    const centerY = height / 2;
    const indicatorWidth = 60;
    const indicatorHeight = 8;
    const x = width - indicatorWidth - 10;
    const y = centerY - indicatorHeight / 2;
    
    // Background
    ctx.fillStyle = isDarkMode() ? '#374151' : '#e5e7eb';
    ctx.fillRect(x, y, indicatorWidth, indicatorHeight);
    
    // Level bar
    const levelWidth = indicatorWidth * displayMetrics.level;
    ctx.fillStyle = getLevelColor(displayMetrics.level);
    ctx.fillRect(x, y, levelWidth, indicatorHeight);
    
    // Peak level indicator
    if (displayMetrics.peakLevel > 0) {
      const peakX = x + (indicatorWidth * displayMetrics.peakLevel);
      ctx.strokeStyle = displayMetrics.isClipping ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(peakX, y);
      ctx.lineTo(peakX, y + indicatorHeight);
      ctx.stroke();
    }
  }
  
  function drawSignalQuality(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!displayMetrics) return;
    
    const qualityColors = {
      excellent: '#22c55e',
      good: '#eab308',
      fair: '#f97316',
      poor: '#ef4444'
    };
    
    const color = qualityColors[displayMetrics.signalQuality];
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
    ctx.fillText(displayMetrics.signalQuality.toUpperCase(), x + radius + 8, y + 4);
    
    // Clipping indicator
    if (displayMetrics.isClipping) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillText('CLIP', x, y + radius + 15);
    }
  }
  
  function getWaveformColor(): string {
    if (!displayMetrics) return isDarkMode() ? '#3b82f6' : '#2563eb';
    
    // Color based on signal quality
    const qualityColors = {
      excellent: isDarkMode() ? '#22c55e' : '#16a34a',
      good: isDarkMode() ? '#eab308' : '#ca8a04',
      fair: isDarkMode() ? '#f97316' : '#ea580c',
      poor: isDarkMode() ? '#ef4444' : '#dc2626'
    };
    
    return qualityColors[displayMetrics.signalQuality] || (isDarkMode() ? '#6b7280' : '#9ca3af');
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
  
  // Handle canvas resize when dimensions change
  $effect(() => {
    if (canvas) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        setupCanvas();
      }, 10);
    }
  });
</script>

<div class="audio-visualizer w-full bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
  <canvas
    bind:this={canvas}
    class="w-full"
    style="height: {height}px;"
  ></canvas>
  
  {#if showDetails && displayMetrics}
    <div class="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-4">
          <span class="text-gray-600 dark:text-gray-400">
            Level: <span class="font-mono font-medium">{(displayMetrics.level * 100).toFixed(0)}%</span>
          </span>
          <span class="text-gray-600 dark:text-gray-400">
            Peak: <span class="font-mono font-medium">{(displayMetrics.peakLevel * 100).toFixed(0)}%</span>
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${
            {
              excellent: 'bg-green-500',
              good: 'bg-yellow-500',
              fair: 'bg-orange-500',
              poor: 'bg-red-500'
            }[displayMetrics.signalQuality]
          }`}></div>
          <span class="text-gray-700 dark:text-gray-300 capitalize">
            {displayMetrics.signalQuality}
          </span>
          {#if displayMetrics.isClipping}
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