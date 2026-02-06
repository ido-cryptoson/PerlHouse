import Anthropic from '@anthropic-ai/sdk';
import { TaskExtraction } from '../types';

const MODEL = 'claude-sonnet-4-5-20250929';
const anthropic = new Anthropic();

function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const todayDayName = dayNames[new Date().getDay()];

  return `אתה מערכת לחילוץ משימות מהודעות וואטסאפ של משפחה ישראלית.
התאריך היום: ${today} (יום ${todayDayName}).

## ההנחיות:
1. חלץ משימות מובנות מהודעות בעברית (וגם משולבות עם אנגלית).
2. הבן הקשר ישראלי: קופת חולים, ועד בית, גן ילדים, ארנונה, חוגים, צהרון, טיפת חלב, ביטוח לאומי.
3. זהה אם ההודעה היא לא משימה: בדיחות, ממים, שיחה כללית, ברכות → not_a_task: true.
4. חלץ מספר משימות מהודעה אחת אם רלוונטי.
5. תאריכים: המר שמות ימים בעברית לתאריכים. "מחר" = מחר, "יום שלישי" = תאריך יום שלישי הקרוב.
6. קטגוריות: בית, ילדים, כספים, בריאות, קניות, רכב, כללי.
7. confidence: 0-1.
8. reply_suggestion: הצע תגובה קצרה בעברית אם רלוונטי.

## פורמט — JSON בלבד:
{
  "tasks": [{
    "title": "כותרת קצרה",
    "description": "תיאור או null",
    "suggested_owner": "שם או null",
    "due_date": "YYYY-MM-DD או null",
    "due_time": "HH:mm או null",
    "category": "קטגוריה",
    "icon": "אמוג׳י אחד",
    "needs_calendar_event": true/false,
    "confidence": 0.0-1.0
  }],
  "not_a_task": false,
  "reply_suggestion": "הצעה או null"
}

החזר JSON תקין בלבד. אל תעטוף ב-markdown. אל תוסיף הסברים.`;
}

export async function extractTasks(
  content: string,
  type: 'text' | 'image' | 'voice',
  imageBase64?: string,
): Promise<TaskExtraction> {
  const systemPrompt = buildSystemPrompt();
  const userContent = buildUserContent(content, type, imageBase64);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') throw new Error('No text in response');

      let raw = textBlock.text.trim();
      // Strip markdown code fences if present
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }

      return JSON.parse(raw) as TaskExtraction;
    } catch (error) {
      console.error(`[AI] Attempt ${attempt} failed:`, error);
      if (attempt === 2) {
        console.error('[AI] Both attempts failed. Returning fallback.');
        return {
          tasks: [{
            title: content.slice(0, 100),
            description: content,
            suggested_owner: null,
            due_date: null,
            due_time: null,
            category: 'כללי',
            icon: '📝',
            needs_calendar_event: false,
            confidence: 0,
          }],
          not_a_task: false,
          reply_suggestion: null,
        };
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('[AI] Unreachable');
}

function buildUserContent(
  content: string,
  type: 'text' | 'image' | 'voice',
  imageBase64?: string,
): Anthropic.MessageCreateParams['messages'][0]['content'] {
  if (type === 'image' && imageBase64) {
    const parts: any[] = [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
    ];
    parts.push({
      type: 'text',
      text: content ? `כיתוב התמונה: ${content}\n\nנתח את התמונה והטקסט וחלץ משימות.` : 'נתח את התמונה וחלץ משימות אם יש.',
    });
    return parts;
  }
  const prefix = type === 'voice' ? 'תמלול הודעה קולית' : 'הודעת וואטסאפ';
  return `${prefix}:\n\n${content}`;
}
