import { describe, it, expect, vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  const response = {
    content: [{
      type: 'text',
      text: JSON.stringify({
        tasks: [{
          title: 'לקנות חלב',
          description: null,
          suggested_owner: null,
          due_date: null,
          due_time: null,
          category: 'קניות',
          icon: '🛒',
          needs_calendar_event: false,
          confidence: 0.9,
        }],
        not_a_task: false,
        reply_suggestion: null,
      }),
    }],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockAnthropic = function (this: Record<string, unknown>) {
    this.messages = { create: vi.fn().mockResolvedValue(response) };
  };
  return { default: MockAnthropic };
});

import { extractTasks } from './ai';

describe('extractTasks', () => {
  it('extracts a task from a Hebrew text message', async () => {
    const result = await extractTasks('צריך לקנות חלב', 'text');

    expect(result).toBeDefined();
    expect(result.not_a_task).toBe(false);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('לקנות חלב');
    expect(result.tasks[0].category).toBe('קניות');
    expect(result.tasks[0].confidence).toBeGreaterThan(0);
  });

  it('returns tasks array with expected shape', async () => {
    const result = await extractTasks('test message', 'text');
    const task = result.tasks[0];

    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('due_date');
    expect(task).toHaveProperty('due_time');
    expect(task).toHaveProperty('category');
    expect(task).toHaveProperty('icon');
    expect(task).toHaveProperty('confidence');
  });
});
