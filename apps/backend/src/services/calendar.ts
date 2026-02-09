import { google, calendar_v3 } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? '';
const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN ?? '';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? 'primary';

function getCalendarClient(): calendar_v3.Calendar | null {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.warn('[Calendar] Google Calendar credentials not configured');
    return null;
  }
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface CalendarEventParams {
  title: string;
  description: string | null;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  durationMinutes?: number;
  attendeeEmails?: string[];
}

export async function createCalendarEvent(params: CalendarEventParams): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  const { title, description, date, time, durationMinutes = 60, attendeeEmails = [] } = params;

  const startDateTime = `${date}T${time}:00`;
  const startMs = new Date(`${startDateTime}`).getTime();
  const endDateTime = new Date(startMs + durationMinutes * 60 * 1000).toISOString();

  const event: calendar_v3.Schema$Event = {
    summary: title,
    description: description ?? undefined,
    start: { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' },
    end: { dateTime: endDateTime, timeZone: 'Asia/Jerusalem' },
    attendees: attendeeEmails.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 30 }],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      sendUpdates: attendeeEmails.length > 0 ? 'all' : 'none',
    });
    const eventId = response.data.id ?? null;
    console.log(`[Calendar] Event created: ${eventId} — "${title}" on ${date} ${time}`);
    return eventId;
  } catch (error) {
    console.error('[Calendar] Failed to create event:', error);
    return null;
  }
}
