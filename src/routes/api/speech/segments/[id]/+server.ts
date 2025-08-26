import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSession, speechSegment } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/speech/segments/[id] - Update segment
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segmentId = params.id;
    if (!segmentId) {
      return json({ error: 'Segment ID required' }, { status: 400 });
    }

    const updates = await request.json();
    const allowedFields = ['text', 'partialText', 'confidence', 'duration', 'language', 'alternatives', 'isEdited', 'metadata'];
    
    // Filter only allowed fields
    const filteredUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if ((key === 'alternatives' || key === 'metadata') && value) {
          filteredUpdates[key] = JSON.stringify(value);
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    filteredUpdates.updatedAt = new Date();

    // First get the segment to verify ownership through session
    const [existingSegment] = await db
      .select({
        segment: speechSegment,
        session: speechSession
      })
      .from(speechSegment)
      .innerJoin(speechSession, eq(speechSegment.sessionId, speechSession.id))
      .where(
        and(
          eq(speechSegment.id, segmentId),
          eq(speechSession.userId, locals.user.id)
        )
      );

    if (!existingSegment) {
      return json({ error: 'Segment not found or not authorized' }, { status: 404 });
    }

    const [updatedSegment] = await db
      .update(speechSegment)
      .set(filteredUpdates)
      .where(eq(speechSegment.id, segmentId))
      .returning();

    // Parse JSON fields for response
    const processedSegment = {
      ...updatedSegment,
      alternatives: updatedSegment.alternatives ? JSON.parse(updatedSegment.alternatives) : null,
      metadata: updatedSegment.metadata ? JSON.parse(updatedSegment.metadata) : null
    };

    return json({
      success: true,
      data: processedSegment
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// DELETE /api/speech/segments/[id] - Delete segment
export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segmentId = params.id;
    if (!segmentId) {
      return json({ error: 'Segment ID required' }, { status: 400 });
    }

    // First get the segment to verify ownership and get session info
    const [existingSegment] = await db
      .select({
        segment: speechSegment,
        session: speechSession
      })
      .from(speechSegment)
      .innerJoin(speechSession, eq(speechSegment.sessionId, speechSession.id))
      .where(
        and(
          eq(speechSegment.id, segmentId),
          eq(speechSession.userId, locals.user.id)
        )
      );

    if (!existingSegment) {
      return json({ error: 'Segment not found or not authorized' }, { status: 404 });
    }

    // Delete the segment
    await db
      .delete(speechSegment)
      .where(eq(speechSegment.id, segmentId));

    // Update session segment count
    await db
      .update(speechSession)
      .set({
        segmentCount: Math.max(0, existingSegment.session.segmentCount - 1),
        updatedAt: new Date()
      })
      .where(eq(speechSession.id, existingSegment.segment.sessionId));

    return json({
      success: true,
      message: 'Segment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};