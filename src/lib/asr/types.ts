// ============================================
// WebSocket Protocol Types
// ============================================

export interface WSMessage {
  event: string;
  [key: string]: any;
}

export interface ConfigMessage extends WSMessage {
  event: "config";
  n_best?: number;
}

export interface EndMessage extends WSMessage {
  event: "end";
}

export interface FlushMessage extends WSMessage {
  event: "flush";
}

export interface ResetMessage extends WSMessage {
  event: "reset";
}

export interface ASRResult {
  text?: string;
  is_final: boolean;
  alternatives?: Array<{
    text: string;
    confidence?: number;
  }>;
  duration?: number;
  error?: string;
}

// ============================================
// Client State Types
// ============================================

export interface ASRClientState {
  isConnected: boolean;
  isRecording: boolean;
  isPaused: boolean;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";
  partialText: string;
  error: string | null;
  wsUrl: string;
}

export interface ASRClientOptions {
  wsUrl?: string;
  sampleRate?: number;
  bufferSize?: number;
  maxQueueSize?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

// ============================================
// Session and Segment Types
// ============================================

export interface SpeechSession {
  id: string;
  userId: string;
  title: string | null;
  language: string;
  status: "active" | "paused" | "completed" | "archived";
  totalDuration: number;
  segmentCount: number;
  wsUrl: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  segments?: SpeechSegment[];
}

export interface SpeechSegment {
  id: string;
  sessionId: string;
  sequence: number;
  text: string;
  partialText: string | null;
  confidence: number | null;
  duration: number | null;
  language: string | null;
  alternatives: Array<{ text: string; confidence?: number }> | null;
  isEdited: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpeechSettings {
  id: string;
  userId: string;
  defaultLanguage: string;
  wsUrl: string;
  nBest: number;
  autoSave: boolean;
  autoExport: boolean;
  exportFormat: "txt" | "json" | "csv" | "docx";
  bufferSize: number;
  maxSegmentLength: number;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Component Props Types
// ============================================

export interface RecorderProps {
  sessionId?: string;
  language?: string;
  wsUrl?: string;
  onSegmentCreated?: (segment: SpeechSegment) => void;
  onSessionUpdated?: (session: SpeechSession) => void;
  onError?: (error: string) => void;
}

export interface TranscriptSegmentProps {
  segment: SpeechSegment;
  isActive?: boolean;
  onEdit?: (segmentId: string, newText: string) => void;
  onDelete?: (segmentId: string) => void;
  onCopy?: (segmentId: string) => void;
}

export interface ConnectionStatusProps {
  state: ASRClientState;
  showDetails?: boolean;
  isConnecting?: boolean;
}

// ============================================
// Audio Processing Types
// ============================================

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  bufferSize: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface AudioMetrics {
  level: number; // RMS level (0-1)
  peakLevel: number; // Peak level (0-1)
  isClipping: boolean;
  signalQuality: "excellent" | "good" | "fair" | "poor";
}

// ============================================
// Export and Import Types
// ============================================

export interface ExportOptions {
  format: "txt" | "json" | "csv" | "docx";
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeAlternatives: boolean;
  segmentSeparator?: string;
}

export interface ExportResult {
  content: string | ArrayBuffer;
  filename: string;
  mimeType: string;
}

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface SessionListResponse extends PaginatedResponse<SpeechSession> {}
export interface SegmentListResponse extends PaginatedResponse<SpeechSegment> {}

// ============================================
// Event Types
// ============================================

export interface ASREvent {
  type: "connection" | "recording" | "transcription" | "error" | "session";
  timestamp: Date;
  data: any;
}

export interface ConnectionEvent extends ASREvent {
  type: "connection";
  data: {
    status: "connecting" | "connected" | "disconnected" | "error";
    quality?: "excellent" | "good" | "poor";
    latency?: number;
  };
}

export interface RecordingEvent extends ASREvent {
  type: "recording";
  data: {
    status: "started" | "paused" | "stopped";
    duration: number;
    audioLevel?: number;
  };
}

export interface TranscriptionEvent extends ASREvent {
  type: "transcription";
  data: {
    segmentId: string;
    text: string;
    isFinal: boolean;
    confidence?: number;
    alternatives?: Array<{ text: string; confidence?: number }>;
  };
}