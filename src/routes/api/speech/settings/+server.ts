import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { speechSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/speech/settings - Get user's speech settings
export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [settings] = await db
      .select()
      .from(speechSettings)
      .where(eq(speechSettings.userId, locals.user.id));

    if (!settings) {
      // Create default settings if none exist
      const settingsId = crypto.randomUUID();
      const now = new Date();

      const [defaultSettings] = await db
        .insert(speechSettings)
        .values({
          id: settingsId,
          userId: locals.user.id,
          defaultLanguage: 'et',
          wsUrl: 'wss://tekstiks.ee/asr/ws/asr',
          nBest: 1,
          autoSave: true,
          autoExport: false,
          exportFormat: 'txt',
          bufferSize: 1024,
          maxSegmentLength: 300,
          metadata: null,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return json({
        success: true,
        data: {
          ...defaultSettings,
          metadata: defaultSettings.metadata ? JSON.parse(defaultSettings.metadata) : null
        }
      });
    }

    // Parse metadata if exists
    const processedSettings = {
      ...settings,
      metadata: settings.metadata ? JSON.parse(settings.metadata) : null
    };

    return json({
      success: true,
      data: processedSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// PATCH /api/speech/settings - Update user's speech settings
export const PATCH: RequestHandler = async ({ locals, request }) => {
  try {
    if (!locals.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json() as Record<string, any>;
    const allowedFields = [
      'defaultLanguage',
      'wsUrl',
      'nBest',
      'autoSave',
      'autoExport',
      'exportFormat',
      'bufferSize',
      'maxSegmentLength',
      'metadata'
    ];
    
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

    // Check if settings exist
    const [existingSettings] = await db
      .select()
      .from(speechSettings)
      .where(eq(speechSettings.userId, locals.user.id));

    let updatedSettings;

    if (!existingSettings) {
      // Create new settings with updates
      const settingsId = crypto.randomUUID();
      const now = new Date();

      [updatedSettings] = await db
        .insert(speechSettings)
        .values({
          id: settingsId,
          userId: locals.user.id,
          defaultLanguage: 'et',
          wsUrl: 'wss://tekstiks.ee/asr/ws/asr',
          nBest: 1,
          autoSave: true,
          autoExport: false,
          exportFormat: 'txt',
          bufferSize: 1024,
          maxSegmentLength: 300,
          metadata: null,
          createdAt: now,
          updatedAt: now,
          ...filteredUpdates
        })
        .returning();
    } else {
      // Update existing settings
      [updatedSettings] = await db
        .update(speechSettings)
        .set(filteredUpdates)
        .where(eq(speechSettings.userId, locals.user.id))
        .returning();
    }

    // Parse metadata for response
    const processedSettings = {
      ...updatedSettings,
      metadata: updatedSettings.metadata ? JSON.parse(updatedSettings.metadata) : null
    };

    return json({
      success: true,
      data: processedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};