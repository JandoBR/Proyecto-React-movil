import { DEFAULT_AVATAR, DEFAULT_PROJECT_IMAGE } from '@/src/core/roble/constants';
import { RobleService } from '@/src/core/roble/service';
import { generateUuidV4 } from '@/src/core/uuid';

export class CreateRepository {
  constructor(private readonly roble: RobleService) {}

  async createProject({
    title,
    description,
    vision,
    categories,
    roles,
    vacancies,
    imageUrl,
  }: {
    title: string;
    description: string;
    vision: string;
    categories: string[];
    roles: string[];
    vacancies: number;
    imageUrl?: string | null;
  }): Promise<string> {
    const userId = this.roble.currentUserId;
    const image = imageUrl?.trim() || DEFAULT_PROJECT_IMAGE;

    try {
      const existing = await this.roble.findCollaborator(userId);
      if (!existing) {
        const cached = this.roble.cachedUser;
        await this.roble.client.create('collaborator', {
          id: userId,
          name: String(cached?.name ?? 'Colaborador'),
          career: String(cached?.career ?? 'Estudiante'),
          avatar_url: String(
            cached?.avatar_url ?? cached?.avatarUrl ?? DEFAULT_AVATAR,
          ),
        });
      }
    } catch {
      // The FK row may already exist.
    }

    const projectId = generateUuidV4();
    await this.roble.client.create('project', {
      id: projectId,
      author_id: userId,
      title,
      description,
      vision,
      image_url: image,
      vacancies,
      status: 'recruiting',
    });

    for (const category of categories) {
      if (!category.trim()) continue;
      try {
        await this.roble.client.create('project_category', {
          project_id: projectId,
          category_name: category.trim(),
        });
      } catch {
        // Keep creating the rest of the rows.
      }
    }

    for (const role of roles) {
      if (!role.trim()) continue;
      try {
        await this.roble.client.create('project_role', {
          project_id: projectId,
          role_name: role.trim(),
        });
      } catch {
        // Keep creating the rest of the rows.
      }
    }

    return projectId;
  }
}
