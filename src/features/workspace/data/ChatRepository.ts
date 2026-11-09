import { RobleService } from '@/src/core/roble/service';
import {
  ChatMessage,
  messageFromJson,
  messageToJson,
  sortMessages,
} from '../domain/chat';

const TABLE = 'project_message';

/**
 * Mensajes del chat de cada proyecto, en la tabla `project_message` de Roble.
 * No hay tiempo real: la pantalla vuelve a leer cada pocos segundos.
 */
export class ChatRepository {
  constructor(private readonly roble: RobleService) {}

  get currentUserId(): string {
    return this.roble.currentUserId;
  }

  async getMessages(projectId: string): Promise<ChatMessage[]> {
    const rows = await this.roble.client.read(TABLE, { project_id: projectId });
    return sortMessages(rows.map(messageFromJson));
  }

  async sendMessage(projectId: string, text: string): Promise<ChatMessage> {
    const cached = this.roble.cachedUser;
    const message = {
      senderId: this.currentUserId,
      senderName: String(cached?.name ?? cached?.userName ?? '') || 'Colaborador',
      text: text.trim(),
      sentAt: new Date(),
    };
    const row = await this.roble.client.create(TABLE, messageToJson(projectId, message));
    return { ...message, id: String(row?._id ?? row?.id ?? '') };
  }
}
