import { parseDate } from '@/src/core/date-labels';

export const CHAT_MESSAGE_MAX_LENGTH = 1000;

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: Date | null;
}

export function messageFromJson(json: Record<string, any>): ChatMessage {
  return {
    id: String(json._id ?? json.id ?? ''),
    senderId: String(json.sender_id ?? ''),
    senderName: String(json.sender_name ?? 'Colaborador'),
    text: String(json.content ?? ''),
    sentAt: parseDate(json.created_at),
  };
}

export function messageToJson(
  projectId: string,
  message: Omit<ChatMessage, 'id'>,
): Record<string, unknown> {
  return {
    project_id: projectId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    content: message.text,
    created_at: (message.sentAt ?? new Date()).toISOString(),
  };
}

/** Por fecha de envío; sin fecha, al final, y a igual fecha por id. */
export function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const byTime =
      (a.sentAt?.getTime() ?? Infinity) - (b.sentAt?.getTime() ?? Infinity);
    if (byTime && !Number.isNaN(byTime)) return byTime;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
