/**
 * Calendar API Handler
 * Full CRUD operations for calendar events
 */

// Helper function (should match worker.js)
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

async function handleCalendar(request, env, tenantId, corsHeaders) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const eventId = pathParts.length > 3 ? pathParts[3] : null;

  // GET /api/calendar - List events
  if (request.method === 'GET' && !eventId) {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const userId = url.searchParams.get('user_id');
    const projectId = url.searchParams.get('project_id');

    let query = 'SELECT * FROM calendar_events WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    if (start) {
      query += ' AND start_time >= ?';
      params.push(start);
    }

    if (end) {
      query += ' AND end_time <= ?';
      params.push(end);
    }

    query += ' ORDER BY start_time ASC';

    try {
      const result = await env.DB.prepare(query).bind(...params).all();
      const events = (result.results || []).map(event => ({
        id: event.id,
        user_id: event.user_id,
        project_id: event.project_id || null,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone || 'UTC',
        location: event.location,
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        reminder_minutes: event.reminder_minutes || 15,
        event_type: event.event_type || 'meeting',
        is_all_day: event.is_all_day || 0,
        recurrence_rule: event.recurrence_rule,
        status: event.status || 'scheduled',
        created_at: event.created_at,
        updated_at: event.updated_at
      }));

      return jsonResponse({ success: true, data: events }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // GET /api/calendar/:id - Get single event
  if (request.method === 'GET' && eventId) {
    try {
      const result = await env.DB.prepare(
        'SELECT * FROM calendar_events WHERE id = ?'
      ).bind(eventId).first();

      if (!result) {
        return jsonResponse({ success: false, error: 'Event not found' }, 404, corsHeaders);
      }

      const event = {
        id: result.id,
        user_id: result.user_id,
        project_id: result.project_id || null,
        title: result.title,
        description: result.description,
        start_time: result.start_time,
        end_time: result.end_time,
        timezone: result.timezone || 'UTC',
        location: result.location,
        attendees: result.attendees ? JSON.parse(result.attendees) : [],
        reminder_minutes: result.reminder_minutes || 15,
        event_type: result.event_type || 'meeting',
        is_all_day: result.is_all_day || 0,
        recurrence_rule: result.recurrence_rule,
        status: result.status || 'scheduled',
        created_at: result.created_at,
        updated_at: result.updated_at
      };

      return jsonResponse({ success: true, data: event }, 200, corsHeaders);
    } catch (error) {
      console.error('Error fetching event:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // POST /api/calendar - Create event
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const {
        user_id,
        project_id,
        title,
        description,
        start_time,
        end_time,
        timezone = 'UTC',
        location,
        attendees = [],
        reminder_minutes = 15,
        event_type = 'meeting',
        is_all_day = 0,
        recurrence_rule,
        status = 'scheduled'
      } = body;

      if (!title || !start_time || !user_id) {
        return jsonResponse(
          { success: false, error: 'Missing required fields: title, start_time, user_id' },
          400,
          corsHeaders
        );
      }

      const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Math.floor(Date.now() / 1000);

      await env.DB.prepare(
        `INSERT INTO calendar_events (
          id, user_id, project_id, title, description, start_time, end_time,
          timezone, location, attendees, reminder_minutes, event_type,
          is_all_day, recurrence_rule, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        user_id,
        project_id || null,
        title,
        description || null,
        start_time,
        end_time || start_time,
        timezone,
        location || null,
        JSON.stringify(attendees),
        reminder_minutes,
        event_type,
        is_all_day,
        recurrence_rule || null,
        status,
        now,
        now
      ).run();

      // Create reminder if needed
      if (reminder_minutes > 0) {
        const reminderTime = parseInt(start_time) - (reminder_minutes * 60);
        await env.DB.prepare(
          `INSERT INTO calendar_reminders (
            id, event_id, user_id, email, reminder_time, status, created_at
          ) VALUES (?, ?, ?, ?, ?, 'pending', ?)`
        ).bind(
          `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          id,
          user_id,
          user_id, // Using user_id as email placeholder
          reminderTime,
          now
        ).run();
      }

      return jsonResponse(
        { success: true, data: { id, ...body } },
        201,
        corsHeaders
      );
    } catch (error) {
      console.error('Error creating event:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // PUT /api/calendar/:id - Update event
  if (request.method === 'PUT' && eventId) {
    try {
      const body = await request.json();
      const updates = [];
      const params = [];

      const allowedFields = [
        'title', 'description', 'start_time', 'end_time', 'timezone',
        'location', 'attendees', 'reminder_minutes', 'event_type',
        'is_all_day', 'recurrence_rule', 'status'
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          if (field === 'attendees' && Array.isArray(body[field])) {
            params.push(JSON.stringify(body[field]));
          } else {
            params.push(body[field]);
          }
        }
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: 'No fields to update' },
          400,
          corsHeaders
        );
      }

      updates.push('updated_at = ?');
      params.push(Math.floor(Date.now() / 1000));
      params.push(eventId);

      await env.DB.prepare(
        `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...params).run();

      return jsonResponse({ success: true, message: 'Event updated' }, 200, corsHeaders);
    } catch (error) {
      console.error('Error updating event:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  // DELETE /api/calendar/:id - Delete event
  if (request.method === 'DELETE' && eventId) {
    try {
      // Delete reminders first
      await env.DB.prepare(
        'DELETE FROM calendar_reminders WHERE event_id = ?'
      ).bind(eventId).run();

      // Delete event
      const result = await env.DB.prepare(
        'DELETE FROM calendar_events WHERE id = ?'
      ).bind(eventId).run();

      if (result.meta.changes === 0) {
        return jsonResponse({ success: false, error: 'Event not found' }, 404, corsHeaders);
      }

      return jsonResponse({ success: true, message: 'Event deleted' }, 200, corsHeaders);
    } catch (error) {
      console.error('Error deleting event:', error);
      return jsonResponse({ success: false, error: error.message }, 500, corsHeaders);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
}
