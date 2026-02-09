import cron from 'node-cron';
import axios from 'axios';
import { sendMessage } from './greenapi';
import { createClient } from '@supabase/supabase-js';

const LAT = 32.1875;
const LON = 34.8935;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function weatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function weatherLabel(code: number): string {
  if (code === 0) return 'בהיר';
  if (code <= 3) return 'מעונן חלקית';
  if (code <= 48) return 'ערפל';
  if (code <= 57) return 'טפטוף';
  if (code <= 67) return 'גשם';
  if (code <= 77) return 'שלג';
  if (code <= 82) return 'ממטרים';
  if (code <= 86) return 'שלג';
  if (code <= 99) return 'סופות רעמים';
  return '';
}

async function fetchWeatherSummary(): Promise<string> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Jerusalem&forecast_days=1`;
    const { data } = await axios.get(url, { timeout: 10_000 });

    const curr = data.current;
    const daily = data.daily;
    const icon = weatherIcon(curr.weather_code);
    const label = weatherLabel(curr.weather_code);
    const tempNow = Math.round(curr.temperature_2m);
    const tempMax = Math.round(daily.temperature_2m_max[0]);
    const tempMin = Math.round(daily.temperature_2m_min[0]);

    return `${icon} *מזג אוויר היום:* ${label}, ${tempNow}°\n🌡️ ${tempMin}°–${tempMax}°`;
  } catch (err) {
    console.error('[DailySummary] Weather fetch failed:', err);
    return '🌡️ מזג אוויר לא זמין';
  }
}

async function fetchTodayTasks(householdId: string): Promise<string> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }); // YYYY-MM-DD
  const supabase = db();

  const { data, error } = await supabase
    .from('tasks')
    .select('title, icon, due_time, status, owner:members!tasks_owner_id_fkey(name)')
    .eq('household_id', householdId)
    .eq('due_date', today)
    .neq('status', 'rejected')
    .neq('status', 'done')
    .order('due_time', { ascending: true });

  if (error) {
    console.error('[DailySummary] Tasks fetch failed:', error);
    return '';
  }

  if (!data || data.length === 0) return '📭 אין משימות להיום';

  const lines = data.map((t) => {
    const time = t.due_time ? `⏰ ${t.due_time}` : '';
    const ownerRecord = Array.isArray(t.owner) ? t.owner[0] : t.owner;
    const owner = ownerRecord?.name ? ` (${ownerRecord.name})` : '';
    const status = t.status === 'pending' ? ' 🟡' : t.status === 'active' ? ' 🟢' : '';
    return `${t.icon} ${t.title}${owner} ${time}${status}`;
  });

  return `📋 *משימות להיום (${data.length}):*\n${lines.join('\n')}`;
}

async function getAllHouseholdsWithMembers(): Promise<Array<{ householdId: string; chatIds: string[] }>> {
  const supabase = db();
  const { data, error } = await supabase
    .from('members')
    .select('household_id, phone')
    .not('phone', 'is', null);

  if (error || !data) {
    console.error('[DailySummary] Members fetch failed:', error);
    return [];
  }

  // Group by household
  const map = new Map<string, string[]>();
  for (const m of data) {
    if (!m.phone) continue;
    const chatId = `${m.phone}@c.us`;
    const list = map.get(m.household_id) ?? [];
    list.push(chatId);
    map.set(m.household_id, list);
  }

  return Array.from(map.entries()).map(([householdId, chatIds]) => ({ householdId, chatIds }));
}

async function sendDailySummary(): Promise<void> {
  console.log('[DailySummary] Starting daily summary...');

  const [weather, households] = await Promise.all([
    fetchWeatherSummary(),
    getAllHouseholdsWithMembers(),
  ]);

  for (const { householdId, chatIds } of households) {
    const tasks = await fetchTodayTasks(householdId);

    const now = new Date();
    const dayName = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long' });
    const dateStr = now.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric' });

    const message = `🌅 *בוקר טוב! יום ${dayName}, ${dateStr}*\n\n${weather}\n\n${tasks}\n\n_יום פרודוקטיבי!_ 💪`;

    for (const chatId of chatIds) {
      try {
        await sendMessage(chatId, message);
        console.log(`[DailySummary] Sent to ${chatId}`);
      } catch (err) {
        console.error(`[DailySummary] Failed to send to ${chatId}:`, err);
      }
    }
  }

  console.log('[DailySummary] Done.');
}

export function startDailySummaryCron(): void {
  // 7:00 AM Israel time (Asia/Jerusalem)
  cron.schedule('0 7 * * *', () => {
    sendDailySummary().catch((err) => console.error('[DailySummary] Cron error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  console.log('[DailySummary] Cron scheduled: 07:00 Asia/Jerusalem');
}

// Export for manual testing
export { sendDailySummary };
