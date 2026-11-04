import { DEFAULT_AVATAR } from '@/src/core/roble/constants';
import { RobleService } from '@/src/core/roble/service';
import { CollaboratorProfile, EnrolledProject } from '../domain/models';

export class HomeRepository {
  constructor(private readonly roble: RobleService) {}

  async getCollaboratorProfile(): Promise<CollaboratorProfile> {
    const userId = this.roble.currentUserId;
    const cached = this.roble.cachedUser;

    let name = String(cached?.name ?? 'Colaborador');
    let avatarUrl = DEFAULT_AVATAR;
    let career = 'Estudiante';
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
        const dbSkills = skillRows
          .map((row) => String(row.skill_name ?? row.skillName ?? row.name ?? ''))
          .filter(Boolean);
        if (dbSkills.length) skills = dbSkills;

        const interestRows = await this.roble.client.read('collaborator_interest', {
          collaborator_id: userId,
        });
        const dbInterests = interestRows
          .map((row) =>
            String(row.interest_name ?? row.interestName ?? row.name ?? ''),
          )
          .filter(Boolean);
        if (dbInterests.length) interests = dbInterests;
      }
    } catch {
      // Tables may not exist yet: keep the safe defaults.
    }

    return { name, avatarUrl, career, skills, interests };
  }

  async getEnrolledProjects(): Promise<EnrolledProject[]> {
    const userId = this.roble.currentUserId;
    if (!userId) return [];

    const enrolled: EnrolledProject[] = [];
    const added = new Set<string>();

    try {
      const members = await this.roble.client.read('project_member', {
        collaborator_id: userId,
      });
      for (const member of members) {
        const projectId = String(member.project_id ?? member.projectId ?? '');
        if (!projectId) continue;

        let rows = await this.roble.client.read('project', { id: projectId });
        if (!rows.length) rows = await this.roble.client.read('project', { _id: projectId });
        if (!rows.length) continue;

        const project = rows[0];
        const realId = String(project.id ?? project._id ?? projectId);
        if (added.has(realId)) continue;
        added.add(realId);

        const authorId = String(project.author_id ?? project.authorId ?? '');
        const author = authorId ? await this.roble.findCollaborator(authorId) : null;

        enrolled.push({
          id: realId,
          title: String(project.title ?? 'Proyecto sin título'),
          description: String(project.description ?? ''),
          authorName: String(author?.name ?? 'Autor'),
          authorAvatarUrl: String(
            author?.avatar_url ?? author?.avatarUrl ?? DEFAULT_AVATAR,
          ),
          role: String(member.discipline ?? member.role ?? 'Miembro'),
          isMember: true,
        });
      }
    } catch {
      // Ignore partial failures.
    }

    try {
      const applications = await this.roble.client.read('application', {
        applicant_id: userId,
      });
      for (const application of applications) {
        const projectId = String(application.project_id ?? application.projectId ?? '');
        if (!projectId) continue;

        let rows = await this.roble.client.read('project', { _id: projectId });
        if (!rows.length) rows = await this.roble.client.read('project', { id: projectId });
        if (!rows.length) continue;

        const project = rows[0];
        const realId = String(project.id ?? project._id ?? projectId);
        if (added.has(realId)) continue;
        added.add(realId);

        const authorId = String(project.author_id ?? project.authorId ?? '');
        const author = authorId ? await this.roble.findCollaborator(authorId) : null;
        const status = String(application.status ?? 'underReview');
        const role =
          status === 'accepted'
            ? 'Aceptado'
            : status === 'rejected'
              ? 'Rechazado'
              : 'Aplicado';

        enrolled.push({
          id: realId,
          title: String(project.title ?? 'Proyecto sin título'),
          description: String(project.description ?? ''),
          authorName: String(author?.name ?? 'Autor'),
          authorAvatarUrl: String(
            author?.avatar_url ?? author?.avatarUrl ?? DEFAULT_AVATAR,
          ),
          role,
          isMember: false,
        });
      }
    } catch {
      // Ignore partial failures.
    }

    return enrolled;
  }

  async leaveProject(projectId: string): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) return;

    const members = await this.roble.client.read('project_member', {
      project_id: projectId,
      collaborator_id: userId,
    });
    for (const member of members) {
      const id = member._id ?? member.id;
      if (id) await this.roble.client.remove('project_member', String(id));
    }
  }
}
