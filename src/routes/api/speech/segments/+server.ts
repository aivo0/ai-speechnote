import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSession, speechSegment } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/speech/segments - Create new segment
export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      sequence,
      text,
      partialText = null,
      confidence = null,
      duration = null,
      language = null,
      alternatives = null,
      metadata = null
    } = body;

    if (!sessionId || !text || sequence === undefined) {
      return json({ error: 'Missing required fields: sessionId, text, sequence' }, { status: 400 });
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

    const segmentId = crypto.randomUUID();
    const now = new Date();

    const [segment] = await db
      .insert(speechSegment)
      .values({
        id: segmentId,
        sessionId,
        sequence,
        text,
        partialText,
        confidence,
        duration,
        language,
        alternatives: alternatives ? JSON.stringify(alternatives) : null,
        isEdited: false,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    // Update session segment count
    await db
      .update(speechSession)
      .set({
        segmentCount: session.segmentCount + 1,
        updatedAt: now
      })
      .where(eq(speechSession.id, sessionId));

    // Parse JSON fields for response
    const processedSegment = {
      ...segment,
      alternatives: segment.alternatives ? JSON.parse(segment.alternatives) : null,
      metadata: segment.metadata ? JSON.parse(segment.metadata) : null
    };

    return json({
      success: true,
      data: processedSegment
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating segment:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};