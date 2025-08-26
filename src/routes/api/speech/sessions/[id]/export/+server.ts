import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSession, speechSegment } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// POST /api/speech/sessions/[id]/export - Export session transcript
export const POST: RequestHandler = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    if (!sessionId) {
      return json({ error: 'Session ID required' }, { status: 400 });
    }

    // Verify session ownership
    const [session] = await db
      .select()
      .from(speechSession)
      .where(
        and(
          eq(speechSession.id, sessionId),
          eq(speechSession.userId, locals.user.id)
        )
      );

    if (!session) {
      return json({ error: 'Session not found or not authorized' }, { status: 404 });
    }

    // Get export options
    const body = await request.json();
    const {
      format = 'txt',
      includeMetadata = false,
      includeTimestamps = false,
      includeAlternatives = false,
      segmentSeparator = '\n\n'
    } = body;

    // Get all segments for the session
    const segments = await db
      .select()
      .from(speechSegment)
      .where(eq(speechSegment.sessionId, sessionId))
      .orderBy(asc(speechSegment.sequence));

    if (segments.length === 0) {
      return json({ error: 'No segments found for this session' }, { status: 404 });
    }

    // Process segments
    const processedSegments = segments.map(segment => ({
      ...segment,
      alternatives: segment.alternatives ? JSON.parse(segment.alternatives) : null,
      metadata: segment.metadata ? JSON.parse(segment.metadata) : null
    }));

    let content: string | Buffer;
    let mimeType: string;
    let filename: string;

    const sessionTitle = session.title || 'transcript';
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (format) {
      case 'txt':
        content = exportAsText(processedSegments, {
          includeMetadata,
          includeTimestamps,
          includeAlternatives,
          segmentSeparator
        });
        mimeType = 'text/plain';
        filename = `${sessionTitle}_${timestamp}.txt`;
        break;

      case 'json':
        content = exportAsJSON(session, processedSegments, {
          includeMetadata,
          includeTimestamps,
          includeAlternatives
        });
        mimeType = 'application/json';
        filename = `${sessionTitle}_${timestamp}.json`;
        break;

      case 'csv':
        content = exportAsCSV(processedSegments, {
          includeMetadata,
          includeTimestamps,
          includeAlternatives
        });
        mimeType = 'text/csv';
        filename = `${sessionTitle}_${timestamp}.csv`;
        break;

      default:
        return json({ error: 'Unsupported export format' }, { status: 400 });
    }

    return new Response(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error exporting session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Export helpers
function exportAsText(segments: any[], options: any): string {
  const { includeMetadata, includeTimestamps, includeAlternatives, segmentSeparator } = options;
  
  return segments.map((segment, index) => {
    let output = '';
    
    // Add segment header if metadata or timestamps requested
    if (includeMetadata || includeTimestamps) {
      output += `[Segment ${index + 1}`;
      
      if (includeTimestamps) {
        output += ` - ${new Date(segment.createdAt).toLocaleString()}`;
      }
      
      if (includeMetadata && segment.confidence) {
        output += ` - Confidence: ${Math.round(segment.confidence * 100)}%`;
      }
      
      if (includeMetadata && segment.duration) {
        output += ` - Duration: ${segment.duration.toFixed(1)}s`;
      }
      
      output += ']\n';
    }
    
    // Add main text
    output += segment.text;
    
    // Add alternatives if requested
    if (includeAlternatives && segment.alternatives && segment.alternatives.length > 1) {
      output += '\n\nAlternatives:';
      segment.alternatives.slice(1).forEach((alt: any, altIndex: number) => {
        output += `\n${altIndex + 2}. ${alt.text}`;
        if (alt.confidence) {
          output += ` (${Math.round(alt.confidence * 100)}%)`;
        }
      });
    }
    
    return output;
  }).join(segmentSeparator);
}

function exportAsJSON(session: any, segments: any[], options: any): string {
  const exportData = {
    session: {
      id: session.id,
      title: session.title,
      language: session.language,
      totalDuration: session.totalDuration,
      segmentCount: session.segmentCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      ...(options.includeMetadata && { metadata: session.metadata ? JSON.parse(session.metadata) : null })
    },
    segments: segments.map(segment => ({
      id: segment.id,
      sequence: segment.sequence,
      text: segment.text,
      isEdited: segment.isEdited,
      ...(options.includeTimestamps && {
        createdAt: segment.createdAt,
        updatedAt: segment.updatedAt
      }),
      ...(options.includeMetadata && {
        partialText: segment.partialText,
        confidence: segment.confidence,
        duration: segment.duration,
        language: segment.language,
        metadata: segment.metadata
      }),
      ...(options.includeAlternatives && {
        alternatives: segment.alternatives
      })
    })),
    exportedAt: new Date().toISOString()
  };
  
  return JSON.stringify(exportData, null, 2);
}

function exportAsCSV(segments: any[], options: any): string {
  const { includeMetadata, includeTimestamps, includeAlternatives } = options;
  
  // Build headers
  const headers = ['Segment', 'Text'];
  
  if (includeTimestamps) {
    headers.push('Created At', 'Updated At');
  }
  
  if (includeMetadata) {
    headers.push('Confidence', 'Duration', 'Language', 'Is Edited');
  }
  
  if (includeAlternatives) {
    headers.push('Alternatives');
  }
  
  // Build rows
  const rows = [headers];
  
  segments.forEach((segment, index) => {
    const row = [
      (index + 1).toString(),
      `"${segment.text.replace(/"/g, '""')}"`
    ];
    
    if (includeTimestamps) {
      row.push(
        new Date(segment.createdAt).toISOString(),
        new Date(segment.updatedAt).toISOString()
      );
    }
    
    if (includeMetadata) {
      row.push(
        (segment.confidence || '').toString(),
        (segment.duration || '').toString(),
        segment.language || '',
        segment.isEdited ? 'Yes' : 'No'
      );
    }
    
    if (includeAlternatives) {
      const alternatives = segment.alternatives && segment.alternatives.length > 1
        ? segment.alternatives.slice(1).map((alt: any) => alt.text).join('; ')
        : '';
      row.push(`"${alternatives.replace(/"/g, '""')}"`);
    }
    
    rows.push(row);
  });
  
  return rows.map(row => row.join(',')).join('\n');
}