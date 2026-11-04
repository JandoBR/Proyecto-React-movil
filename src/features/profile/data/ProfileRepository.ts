import { DEFAULT_AVATAR } from '@/src/core/roble/constants';
import { RobleService } from '@/src/core/roble/service';
import { CollaboratorProfile } from '@/src/features/home/domain/models';

export class ProfileRepository {
  constructor(private readonly roble: RobleService) {}

  getProfile(): Promise<CollaboratorProfile> {
    const cached = this.roble.cachedUser;
    return this.readProfile(this.roble.currentUserId, {
      name: String(cached?.name ?? 'Colaborador'),
      avatarUrl: cached?.avatar_url ?? cached?.avatarUrl,
      career: cached?.career,
    });
  }

  getCollaborator(userId: string): Promise<CollaboratorProfile> {
    return this.readProfile(userId);
  }

  private async readProfile(
    userId: string,
    defaults: { name?: string; avatarUrl?: unknown; career?: unknown } = {},
  ): Promise<CollaboratorProfile> {
    let name = defaults.name ?? 'Colaborador';
    let avatarUrl = String(defaults.avatarUrl ?? DEFAULT_AVATAR);
    let career = String(defaults.career ?? 'Estudiante');
    let skills: string[] = [];
    let interests: string[] = [];

    try {
      if (userId) {
        const profile = await this.roble.findCollaborator(userId);
        if (profile) {
          name = String(profile.name ?? name);
          avatarUrl = String(profile.avatar_url ?? profile.avatarUrl ?? avatarUrl);
          career = String(profile.career ?? career);
        }

        const skillRows = await this.roble.client.read('collaborator_skill', {
          collaborator_id: userId,
        });
        skills = skillRows
          .map((row) => String(row.skill_name ?? row.skillName ?? row.name ?? ''))
          .filter(Boolean);

        const interestRows = await this.roble.client.read('collaborator_interest', {
          collaborator_id: userId,
        });
        interests = interestRows
          .map((row) =>
            String(row.interest_name ?? row.interestName ?? row.name ?? ''),
          )
          .filter(Boolean);
      }
    } catch {
      // Keep defaults when the profile cannot be read.
    }

    return { name, avatarUrl, career, skills, interests };
  }

  async updateProfile({
    name,
    career,
    avatarUrl,
  }: {
    name: string;
    career: string;
    avatarUrl: string;
  }): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) return;

    const existing = await this.roble.findCollaborator(userId);
    if (existing) {
      const profileId = String(existing._id ?? existing.id);
      await this.roble.client.update('collaborator', profileId, {
        name,
        career,
        avatar_url: avatarUrl,
      });
    } else {
      await this.roble.client.create('collaborator', {
        id: userId,
        name,
        career,
        avatar_url: avatarUrl,
      });
    }
    this.roble.updateCachedUser({ name, avatar_url: avatarUrl, career });
  }

  async addSkill(skill: string): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) return;
    await this.roble.client.create('collaborator_skill', {
      collaborator_id: userId,
      skill_name: skill.trim(),
    });
  }

  async removeSkill(skill: string): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) return;
    const rows = await this.roble.client.read('collaborator_skill', {
      collaborator_id: userId,
      skill_name: skill.trim(),
    });
    for (const row of rows) {
      const id = row._id ?? row.id;
      if (id) await this.roble.client.remove('collaborator_skill', String(id));
    }
  }

  async addInterest(interest: string): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) return;
    await this.roble.client.create('collaborator_interest', {
      collaborator_id: userId,
      interest_name: interest.trim(),
    });
  }

  async removeInterest(interest: string): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) return;
    const rows = await this.roble.client.read('collaborator_interest', {
      collaborator_id: userId,
      interest_name: interest.trim(),
    });
    for (const row of rows) {
      const id = row._id ?? row.id;
      if (id) await this.roble.client.remove('collaborator_interest', String(id));
    }
  }

  getStats(): Promise<Record<string, number>> {
    return this.getStatsFor(this.roble.currentUserId);
  }

  async getStatsFor(userId: string): Promise<Record<string, number>> {
    let created = 0;
    let member = 0;
    let applied = 0;

    if (userId) {
      try {
        created = (await this.roble.client.read('project', { author_id: userId })).length;
      } catch {}
      try {
        member = (
          await this.roble.client.read('project_member', { collaborator_id: userId })
        ).length;
      } catch {}
      try {
        applied = (
          await this.roble.client.read('application', { applicant_id: userId })
        ).length;
      } catch {}
    }

    return { created, member, applied };
  }
}
