import { RobleService } from '@/src/core/roble/service';
import {
  ProjectEvent,
  ProjectTask,
  WorkspaceMember,
  eventFromJson,
  eventToJson,
  taskFromJson,
  taskToJson,
} from '../domain/models';

export class WorkspaceRepository {
  constructor(private readonly roble: RobleService) {}

  get currentUserId(): string {
    return this.roble.currentUserId;
  }

  get currentUserName(): string {
    const cached = this.roble.cachedUser;
    const name = String(cached?.name ?? cached?.userName ?? '');
    return name || 'Tú';
  }

  async getTasks(projectId: string): Promise<ProjectTask[]> {
    const rows = await this.roble.client.read('project_task', {
      project_id: projectId,
    });
    return rows.map(taskFromJson);
  }

  async createTask(task: ProjectTask): Promise<ProjectTask> {
    const row = await this.roble.client.create('project_task', taskToJson(task));
    return taskFromJson(row);
  }

  async updateTask(task: ProjectTask): Promise<void> {
    await this.roble.client.update('project_task', task.id, taskToJson(task));
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.roble.client.remove('project_task', taskId);
  }

  async getEvents(projectId: string): Promise<ProjectEvent[]> {
    const rows = await this.roble.client.read('project_event', {
      project_id: projectId,
    });
    return rows.map(eventFromJson);
  }

  async createEvent(event: ProjectEvent): Promise<ProjectEvent> {
    const row = await this.roble.client.create('project_event', eventToJson(event));
    return eventFromJson(row);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.roble.client.remove('project_event', eventId);
  }

  async getMembers(projectId: string): Promise<WorkspaceMember[]> {
    const members: WorkspaceMember[] = [];
    const seen = new Set<string>();

    try {
      let rows = await this.roble.client.read('project', { id: projectId });
      if (!rows.length) rows = await this.roble.client.read('project', { _id: projectId });
      const authorId = rows.length ? String(rows[0].author_id ?? '') : '';
      if (authorId) {
        members.push(await this.memberFor(authorId, 'Líder', true));
        seen.add(authorId);
      }
    } catch {
      // The author may not be readable.
    }

    try {
      const rows = await this.roble.client.read('project_member', {
        project_id: projectId,
      });
      for (const row of rows) {
        const id = String(row.collaborator_id ?? '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        members.push(
          await this.memberFor(id, String(row.discipline ?? 'Colaborador')),
        );
      }
    } catch {
      // Members may not be readable.
    }

    return members;
  }

  private async memberFor(
    userId: string,
    role: string,
    isOwner = false,
  ): Promise<WorkspaceMember> {
    const profile = await this.roble.findCollaborator(userId);
    return {
      id: userId,
      name: String(profile?.name ?? 'Colaborador'),
      avatarUrl: String(profile?.avatar_url ?? profile?.avatarUrl ?? ''),
      role,
      isOwner,
    };
  }
}
