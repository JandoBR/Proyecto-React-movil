import { DEFAULT_AVATAR } from '@/src/core/roble/constants';
import { RobleRecord } from '@/src/core/roble/client';
import { RobleService } from '@/src/core/roble/service';
import {
  Applicant,
  AppliedProject,
  CreatedProject,
  CreatedProjectStatus,
  applicationStatusFrom,
  createdProjectStatusFrom,
} from '../domain/models';

export class ProjectRepository {
  private readonly collaboratorByApplication = new Map<string, string>();

  constructor(private readonly roble: RobleService) {}

  private async readApplications(projectId: string): Promise<RobleRecord[]> {
    try {
      const result = await this.roble.client.executeQueryByName(
        'postulaciones_de_proyecto',
        [projectId, this.roble.currentUserId],
      );
      return result.rows;
    } catch {
      return this.roble.client.read('application', { project_id: projectId });
    }
  }

  private async setApplicationStatus(
    applicationId: string,
    status: 'accepted' | 'rejected',
  ): Promise<void> {
    try {
      const result = await this.roble.client.executeQueryByName(
        'responder_postulacion',
        [applicationId, status, this.roble.currentUserId],
      );
      if (result.rows.length > 0) return;
    } catch {
      // Saved query unavailable.
    }
    await this.roble.client.update('application', applicationId, { status });
  }

  private async getById(table: string, id: string): Promise<RobleRecord | null> {
    try {
      let rows = await this.roble.client.read(table, { _id: id });
      if (!rows.length) rows = await this.roble.client.read(table, { id });
      return rows.length ? rows[0] : null;
    } catch {
      return null;
    }
  }

  private vacanciesOf(project: RobleRecord | null): number {
    return Number.parseInt(String(project?.vacancies ?? '0'), 10) || 0;
  }

  private readMembers(projectId: string): Promise<RobleRecord[]> {
    return this.roble.client
      .read('project_member', { project_id: projectId })
      .catch(() => []);
  }

  private collaboratorIdOf(member: RobleRecord): string {
    return String(member.collaborator_id ?? member.collaboratorId ?? '');
  }

  private async syncProjectStatus(
    project: RobleRecord | null,
    projectId: string,
    memberCount: number,
  ): Promise<void> {
    if (!project) return;
    const current = String(project.status ?? '');
    if (current === 'completed') return;

    const vacancies = this.vacanciesOf(project);
    if (vacancies <= 0) return;

    const next = memberCount >= vacancies ? 'active' : 'recruiting';
    if (current === next) return;

    try {
      await this.roble.client.update(
        'project',
        String(project._id ?? projectId),
        { status: next },
      );
    } catch {
      // The project still works even if its status could not be synced.
    }
  }

  async getAppliedProjects(): Promise<AppliedProject[]> {
    const userId = this.roble.currentUserId;
    if (!userId) return [];

    const applied: AppliedProject[] = [];

    try {
      const applications = await this.roble.client.read('application', {
        applicant_id: userId,
      });

      for (const application of applications) {
        const projectId = String(application.project_id ?? application.projectId ?? '');
        if (!projectId) continue;

        const project = await this.getById('project', projectId);
        if (!project) continue;

        const realProjectId = String(project.id ?? project._id ?? projectId);
        let categories: string[] = [];
        try {
          const rows = await this.roble.client.read('project_category', {
            project_id: realProjectId,
          });
          categories = rows
            .map((row) =>
              String(row.category_name ?? row.categoryName ?? row.name ?? ''),
            )
            .filter(Boolean);
        } catch {}

        let authorName = 'Autor';
        let authorCareer = 'Estudiante';
        let authorAvatar = DEFAULT_AVATAR;
        const authorId = String(project.author_id ?? project.authorId ?? '');
        if (authorId) {
          const profile = await this.getById('collaborator', authorId);
          if (profile) {
            authorName = String(profile.name ?? authorName);
            authorCareer = String(profile.career ?? authorCareer);
            authorAvatar = String(
              profile.avatar_url ?? profile.avatarUrl ?? authorAvatar,
            );
          }
        }

        applied.push({
          id: String(application._id ?? application.id ?? projectId),
          title: String(project.title ?? 'Sin título'),
          description: String(project.description ?? ''),
          vision: String(project.vision ?? project.description ?? ''),
          authorName,
          authorCareer,
          authorAvatarUrl: authorAvatar,
          categories: categories.length ? categories : ['General'],
          status: applicationStatusFrom(application.status),
          appliedDate: String(
            application.applied_date ?? application.appliedDate ?? 'Reciente',
          ),
        });
      }
    } catch {
      return [];
    }

    return applied;
  }

  async getCreatedProjects(): Promise<CreatedProject[]> {
    const userId = this.roble.currentUserId;
    if (!userId) return [];

    const created: CreatedProject[] = [];

    try {
      const projectRows = await this.roble.client.read('project', {
        author_id: userId,
      });

      for (const project of projectRows) {
        const projectId = String(project.id ?? project._id ?? '');
        if (!projectId) continue;

        const applicants: Applicant[] = [];
        const acceptedIds = new Set<string>();
        const memberByCollaborator = new Map<string, RobleRecord>();

        try {
          const members = await this.roble.client.read('project_member', {
            project_id: projectId,
          });
          for (const member of members) {
            const collaboratorId = this.collaboratorIdOf(member);
            if (!collaboratorId) continue;
            acceptedIds.add(collaboratorId);
            memberByCollaborator.set(collaboratorId, member);
          }
        } catch {}

        try {
          const applications = await this.readApplications(projectId);
          for (const application of applications) {
            const applicantId = String(
              application.applicant_id ?? application.applicantId ?? '',
            );
            const applicationId = String(
              application._id ?? application.id ?? '',
            );
            if (applicationId && applicantId) {
              this.collaboratorByApplication.set(applicationId, applicantId);
            }

            const joinedName = application.applicant_name;
            let name = joinedName != null ? String(joinedName) : 'Postulante';
            let avatarUrl = String(
              application.applicant_avatar_url ?? DEFAULT_AVATAR,
            );
            let career = String(application.applicant_career ?? 'Estudiante');

            if (joinedName == null && applicantId) {
              const profile = await this.getById('collaborator', applicantId);
              if (profile) {
                name = String(profile.name ?? name);
                avatarUrl = String(
                  profile.avatar_url ?? profile.avatarUrl ?? avatarUrl,
                );
                career = String(profile.career ?? career);
              }
            }

            const isAccepted = acceptedIds.has(applicantId);
            const status = isAccepted
              ? 'accepted'
              : applicationStatusFrom(application.status);
            const memberRow = memberByCollaborator.get(applicantId);
            const tileId = isAccepted
              ? String(
                  memberRow?._id ?? memberRow?.id ?? applicantId,
                )
              : applicationId;

            applicants.push({
              id: tileId,
              collaboratorId: applicantId,
              name,
              avatarUrl,
              career,
              requestedRole: String(
                application.requested_role ?? application.requestedRole ?? 'Colaborador',
              ),
              status,
            });
          }
        } catch {
          // The RLS policy may hide applications from the author.
        }

        for (const collaboratorId of acceptedIds) {
          if (applicants.some((item) => item.collaboratorId === collaboratorId)) {
            continue;
          }
          const member = memberByCollaborator.get(collaboratorId);
          let name = 'Miembro del Equipo';
          let avatarUrl = DEFAULT_AVATAR;
          let career = 'Estudiante';
          const profile = await this.getById('collaborator', collaboratorId);
          if (profile) {
            name = String(profile.name ?? name);
            avatarUrl = String(profile.avatar_url ?? profile.avatarUrl ?? avatarUrl);
            career = String(profile.career ?? career);
          }
          applicants.push({
            id: String(member?._id ?? member?.id ?? collaboratorId),
            collaboratorId,
            name,
            avatarUrl,
            career,
            requestedRole: String(member?.discipline ?? 'Colaborador'),
            status: 'accepted',
          });
        }

        created.push({
          id: projectId,
          title: String(project.title ?? 'Sin título'),
          description: String(project.description ?? ''),
          vision: String(project.vision ?? ''),
          imageUrl: String(project.image_url ?? project.imageUrl ?? ''),
          categories: await this.readChildValues(
            'project_category',
            projectId,
            'category_name',
          ),
          roles: await this.readChildValues('project_role', projectId, 'role_name'),
          status: createdProjectStatusFrom(project.status),
          vacancies: Number.parseInt(String(project.vacancies ?? '2'), 10) || 2,
          applicants,
        });
      }
    } catch (error) {
      throw new Error(`Error al obtener proyectos creados: ${String(error)}`);
    }

    return created;
  }

  async getCreatedProjectById(id: string): Promise<CreatedProject> {
    const projects = await this.getCreatedProjects();
    const project = projects.find((item) => item.id === id);
    if (!project) throw new Error(`Proyecto creado no encontrado: ${id}`);
    return project;
  }

  async acceptApplicant(projectId: string, applicantId: string): Promise<void> {
    let collaboratorId = this.collaboratorByApplication.get(applicantId) ?? '';
    let applicationRobleId = collaboratorId ? applicantId : null;

    if (!collaboratorId) {
      let rows = await this.roble.client.read('application', {
        _id: applicantId,
      }).catch(() => []);
      if (!rows.length) {
        rows = await this.roble.client.read('application', { id: applicantId }).catch(
          () => [],
        );
      }
      if (rows.length) {
        applicationRobleId = String(rows[0]._id ?? '');
        collaboratorId = String(
          rows[0].applicant_id ?? rows[0].applicantId ?? '',
        );
      }
    }

    if (!collaboratorId) {
      throw new Error(`No se encontró la postulación ${applicantId}.`);
    }

    const projectRow = await this.getById('project', projectId);
    const vacancies = this.vacanciesOf(projectRow);
    const members = await this.readMembers(projectId);
    const alreadyMember = members.some(
      (member) => this.collaboratorIdOf(member) === collaboratorId,
    );
    if (!alreadyMember && vacancies > 0 && members.length >= vacancies) {
      throw new Error(`El proyecto ya alcanzó sus ${vacancies} vacantes.`);
    }

    await this.setApplicationStatus(
      applicationRobleId ?? applicantId,
      'accepted',
    );

    if (!alreadyMember) {
      try {
        await this.roble.client.create('project_member', {
          project_id: projectId,
          collaborator_id: collaboratorId,
          discipline: 'Colaborador',
        });
      } catch {
        // The member row may already exist.
      }
    }

    await this.syncProjectStatus(
      projectRow,
      projectId,
      alreadyMember ? members.length : members.length + 1,
    );
  }

  async rejectApplicant(projectId: string, applicantId: string): Promise<void> {
    void projectId;
    let applicationRobleId = this.collaboratorByApplication.has(applicantId)
      ? applicantId
      : null;

    if (!applicationRobleId) {
      let rows = await this.roble.client.read('application', {
        _id: applicantId,
      }).catch(() => []);
      if (!rows.length) {
        rows = await this.roble.client.read('application', { id: applicantId }).catch(
          () => [],
        );
      }
      if (rows.length) applicationRobleId = String(rows[0]._id ?? '');
    }

    await this.setApplicationStatus(applicationRobleId ?? applicantId, 'rejected');
  }

  async removeMember(projectId: string, applicantId: string): Promise<void> {
    try {
      await this.roble.client.remove('project_member', applicantId);
    } catch {
      const members = await this.roble.client.read('project_member', {
        project_id: projectId,
        collaborator_id: applicantId,
      });
      for (const member of members) {
        const id = member._id ?? member.id;
        if (id) await this.roble.client.remove('project_member', String(id));
      }
    }

    const projectRow = await this.getById('project', projectId);
    const remaining = await this.readMembers(projectId);
    await this.syncProjectStatus(projectRow, projectId, remaining.length);
  }

  async withdrawApplication(applicationId: string): Promise<void> {
    try {
      await this.roble.client.remove('application', applicationId);
    } catch {
      const rows = await this.roble.client.read('application', {
        _id: applicationId,
      });
      for (const row of rows) {
        const id = row._id ?? row.id;
        if (id) await this.roble.client.remove('application', String(id));
      }
    }
  }

  private async readChildValues(
    table: string,
    projectId: string,
    valueField: string,
  ): Promise<string[]> {
    try {
      const rows = await this.roble.client.read(table, { project_id: projectId });
      return rows
        .map((row) => String(row[valueField] ?? row.name ?? ''))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private async replaceChildRows(
    table: string,
    projectId: string,
    valueField: string,
    values: string[],
  ): Promise<void> {
    try {
      const rows = await this.roble.client.read(table, { project_id: projectId });
      for (const row of rows) {
        const id = row._id ?? row.id;
        if (id) await this.roble.client.remove(table, String(id));
      }
    } catch {}

    for (const value of values) {
      const trimmed = value.trim();
      if (!trimmed) continue;
      try {
        await this.roble.client.create(table, {
          project_id: projectId,
          [valueField]: trimmed,
        });
      } catch {}
    }
  }

  async updateProject({
    projectId,
    title,
    description,
    vision,
    vacancies,
    status,
    categories,
    roles,
    imageUrl,
  }: {
    projectId: string;
    title: string;
    description: string;
    vision: string;
    vacancies: number;
    status: CreatedProjectStatus;
    categories: string[];
    roles: string[];
    imageUrl?: string | null;
  }): Promise<void> {
    const row = await this.getById('project', projectId);
    const robleId = String(row?._id ?? projectId);

    await this.roble.client.update('project', robleId, {
      title,
      description,
      vision,
      vacancies,
      status,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    });

    await this.replaceChildRows(
      'project_category',
      projectId,
      'category_name',
      categories,
    );
    await this.replaceChildRows('project_role', projectId, 'role_name', roles);
  }

  async deleteProject(projectId: string): Promise<void> {
    for (const table of [
      'project_category',
      'project_role',
      'project_member',
      'application',
      'project_task',
      'project_event',
    ]) {
      try {
        const rows = await this.roble.client.read(table, { project_id: projectId });
        for (const row of rows) {
          const id = row._id ?? row.id;
          if (id) await this.roble.client.remove(table, String(id));
        }
      } catch {}
    }

    const row = await this.getById('project', projectId);
    const robleId = String(row?._id ?? projectId);
    await this.roble.client.remove('project', robleId);
  }
}
