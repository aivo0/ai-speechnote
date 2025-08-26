import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSession } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/speech/sessions - List sessions for current user
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sessions = await db
      .select()
      .from(speechSession)
      .where(eq(speechSession.userId, locals.user.id))
      .orderBy(desc(speechSession.updatedAt))
      .limit(limit)
      .offset(offset);

    return json({
      success: true,
      data: sessions,
      pagination: {
        limit,
        offset,
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/speech/sessions - Create new session
export const POST: RequestHandler = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, language = 'et', metadata } = body;

    const sessionId = crypto.randomUUID();
    const now = new Date();

    const [session] = await db
      .insert(speechSession)
      .values({
        id: sessionId,
        userId: locals.user.id,
        title: title || null,
        language,
        status: 'active',
        totalDuration: 0,
        segmentCount: 0,
        wsUrl: null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return json({
      success: true,
      data: session
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};