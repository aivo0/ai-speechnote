import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSession, speechSegment } from '$lib/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// GET /api/speech/sessions/[id]/segments - Get segments for a session
export const GET: RequestHandler = async ({ locals, params, url }) => {
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

    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const segments = await db
      .select()
      .from(speechSegment)
      .where(eq(speechSegment.sessionId, sessionId))
      .orderBy(asc(speechSegment.sequence))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const processedSegments = segments.map(segment => ({
      ...segment,
      alternatives: segment.alternatives ? JSON.parse(segment.alternatives) : null,
      metadata: segment.metadata ? JSON.parse(segment.metadata) : null
    }));

    return json({
      success: true,
      data: processedSegments,
      pagination: {
        limit,
        offset,
        total: processedSegments.length
      }
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};