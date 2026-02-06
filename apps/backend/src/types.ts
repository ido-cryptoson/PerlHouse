// Bayit Backend Types

export interface TaskExtractionItem {
  title: string;
  description: string | null;
  suggested_owner: string | null;
  due_date: string | null;
  due_time: string | null;
  category: TaskCategory;
  icon: string;
  needs_calendar_event: boolean;
  confidence: number;
}

export interface TaskExtraction {
  tasks: TaskExtractionItem[];
  not_a_task: boolean;
  reply_suggestion: string | null;
}

export type TaskCategory =
  | 'בית' | 'ילדים' | 'כספים' | 'בריאות'
  | 'קניות' | 'רכב' | 'כללי';

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  household_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  push_subscription: PushSubscriptionRecord | null;
  created_at: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Task {
  id: string;
  household_id: string;
  status: 'pending' | 'active' | 'done' | 'rejected';
  title: string;
  description: string | null;
  owner_id: string | null;
  icon: string;
  category: TaskCategory;
  due_date: string | null;
  due_time: string | null;
  calendar_event_id: string | null;
  source_type: 'whatsapp_text' | 'whatsapp_image' | 'whatsapp_voice' | 'gmail' | 'manual';
  source_raw: string | null;
  needs_calendar_event: boolean;
  ai_confidence: number;
  reply_suggestion: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>;

export interface GreenAPIWebhookPayload {
  typeWebhook: string;
  instanceData: { idInstance: number; wid: string; typeInstance: string };
  timestamp: number;
  idMessage: string;
  senderData: {
    chatId: string;
    chatName: string;
    sender: string;
    senderName: string;
    senderContactName?: string;
  };
  messageData: {
    typeMessage: string;
    textMessageData?: { textMessage: string };
    extendedTextMessageData?: { text: string; description?: string; title?: string; forwardingScore?: number };
    imageMessageData?: { downloadUrl: string; caption?: string; jpegThumbnail?: string; mimeType?: string };
    audioMessageData?: { downloadUrl: string; mimeType?: string };
  };
}
