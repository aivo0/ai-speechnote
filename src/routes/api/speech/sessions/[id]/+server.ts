import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSession, speechSegment } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/speech/sessions/[id] - Get specific session
export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    if (!sessionId) {
      return json({ error: 'Session ID required' }, { status: 400 });
    }

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
      return json({ error: 'Session not found' }, { status: 404 });
    }

    return json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// PATCH /api/speech/sessions/[id] - Update session
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    if (!sessionId) {
      return json({ error: 'Session ID required' }, { status: 400 });
    }

    const updates = await request.json() as Record<string, any>;
    const allowedFields = ['title', 'status', 'language', 'totalDuration', 'segmentCount', 'wsUrl', 'metadata'];
    
    // Filter only allowed fields
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'metadata' && value) {
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

    const [updatedSession] = await db
      .update(speechSession)
      .set(filteredUpdates)
      .where(
        and(
          eq(speechSession.id, sessionId),
          eq(speechSession.userId, locals.user.id)
        )
      )
      .returning();

    if (!updatedSession) {
      return json({ error: 'Session not found or not authorized' }, { status: 404 });
    }

    return json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// DELETE /api/speech/sessions/[id] - Delete session
export const DELETE: RequestHandler = async ({ locals, params }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.id;
    if (!sessionId) {
      return json({ error: 'Session ID required' }, { status: 400 });
    }

    // First, delete all segments associated with this session
    await db
      .delete(speechSegment)
      .where(eq(speechSegment.sessionId, sessionId));

    // Then delete the session
    const result = await db
      .delete(speechSession)
      .where(
        and(
          eq(speechSession.id, sessionId),
          eq(speechSession.userId, locals.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return json({ error: 'Session not found or not authorized' }, { status: 404 });
    }

    return json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};