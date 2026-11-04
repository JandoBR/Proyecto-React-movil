import { DEFAULT_AVATAR } from '@/src/core/roble/constants';
import { RobleRecord } from '@/src/core/roble/client';
import { RobleService } from '@/src/core/roble/service';
import { computeMatch } from '../domain/match';
import {
  DEFAULT_CATEGORIES,
  FOR_YOU_CATEGORY,
  Project,
  ProjectMember,
  ProjectRole,
} from '../domain/models';
import { seedProjects } from './seed';

const NO_USER = '00000000-0000-0000-0000-000000000000';

interface Lookups {
  collaborators: Map<string, RobleRecord>;
  categoriesByProject: Map<string, string[]>;
  rolesByProject: Map<string, string[]>;
  membersByProject: Map<string, RobleRecord[]>;
  userSkills: string[];
  userInterests: string[];
  appliedProjectIds: Set<string>;
}

function jsonList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) {
    try {
      const decoded = JSON.parse(value);
      return Array.isArray(decoded) ? decoded : [];
    } catch {
      return [];
    }
  }
  return [];
}

function stringList(value: unknown): string[] {
  return jsonList(value).map((item) => String(item));
}

function memberList(value: unknown): ProjectMember[] {
  return jsonList(value).map((item) => {
    if (item && typeof item === 'object') {
      const row = item as RobleRecord;
      return {
        name: String(row.name ?? 'Miembro'),
        avatarUrl: String(row.avatar_url ?? row.avatarUrl ?? DEFAULT_AVATAR),
        discipline: String(row.discipline ?? 'Miembro'),
      };
    }
    return { name: 'Miembro', avatarUrl: DEFAULT_AVATAR, discipline: 'Miembro' };
  });
}

function groupStrings(rows: RobleRecord[], field: string): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const projectId = String(row.project_id ?? row.projectId ?? '');
    const value = String(row[field] ?? row.name ?? '');
    if (!projectId || !value) continue;
    const list = grouped.get(projectId) ?? [];
    list.push(value);
    grouped.set(projectId, list);
  }
  return grouped;
}

function groupRows(rows: RobleRecord[]): Map<string, RobleRecord[]> {
  const grouped = new Map<string, RobleRecord[]>();
  for (const row of rows) {
    const projectId = String(row.project_id ?? row.projectId ?? '');
    if (!projectId) continue;
    const list = grouped.get(projectId) ?? [];
    list.push(row);
    grouped.set(projectId, list);
  }
  return grouped;
}

export class ExploreRepository {
  constructor(private readonly roble: RobleService) {}

  async getCategories(): Promise<string[]> {
    const categories = new Set(DEFAULT_CATEGORIES);
    try {
      const rows = await this.roble.client.read('project_category');
      for (const row of rows) {
        const category = String(row.category_name ?? row.categoryName ?? row.name ?? '');
        if (category) categories.add(category);
      }
    } catch {
      // Defaults are enough.
    }
    return [...categories];
  }

  async getProjects({
    category,
    search,
    limit = 20,
    offset = 0,
  }: {
    category?: string | null;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Project[]> {
    const trimmedSearch = search?.trim() ?? '';
    const term = trimmedSearch
      ? trimmedSearch
      : category && category !== FOR_YOU_CATEGORY
        ? category
        : '';
    const userId = this.roble.currentUserId;

    try {
      const result = await this.roble.client.executeQueryByName('proyectos_completos', [
        term,
        limit,
        offset,
        userId || NO_USER,
      ]);
      return this.rowsToProjects(result.rows);
    } catch {
      // Saved query unavailable: read tables instead.
    }

    try {
      return await this.fetchViaTables(term, limit, offset, userId);
    } catch {
      return this.fallbackProjects(category, search, limit, offset);
    }
  }

  async getProjectById(id: string): Promise<Project> {
    const userId = this.roble.currentUserId;

    try {
      const result = await this.roble.client.executeQueryByName('proyecto_completo', [
        id,
        userId || NO_USER,
      ]);
      const rows = result.rows.filter((row) => row && typeof row === 'object');
      if (rows.length) {
        const project = this.projectFromQueryRow(rows[0]);
        if (project.id) return project;
      }
    } catch {
      // Fall back to table reads.
    }

    const projects = await this.fetchViaTables('', 50, 0, userId).catch(() => []);
    const match = projects.find((project) => project.id === id);
    if (match) return match;

    let rows = await this.roble.client.read('project', { _id: id });
    if (!rows.length) rows = await this.roble.client.read('project', { id });
    if (rows.length) {
      const lookups = await this.loadLookups(userId);
      return this.projectFromRow(rows[0], lookups);
    }

    throw new Error(`Proyecto no encontrado: ${id}`);
  }

  async requestToJoin(projectId: string, role?: string | null): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      const existing = await this.roble.findCollaborator(userId);
      if (!existing) {
        const cached = this.roble.cachedUser;
        await this.roble.client.create('collaborator', {
          id: userId,
          name: String(cached?.name ?? cached?.userName ?? 'Colaborador'),
          career: String(cached?.career ?? 'Estudiante'),
          avatar_url: String(
            cached?.avatar_url ?? cached?.avatarUrl ?? DEFAULT_AVATAR,
          ),
        });
      }
    } catch {
      // A duplicate collaborator is fine.
    }

    const now = new Date();
    const appliedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(now.getDate()).padStart(2, '0')}`;

    await this.roble.client.create('application', {
      project_id: projectId,
      applicant_id: userId,
      requested_role: role?.trim() || 'Colaborador',
      status: 'underReview',
      applied_date: appliedDate,
    });
  }

  async cancelRequest(projectId: string): Promise<void> {
    const userId = this.roble.currentUserId;
    if (!userId) throw new Error('Usuario no autenticado');
    const rows = await this.roble.client.read('application', {
      project_id: projectId,
      applicant_id: userId,
    });
    for (const row of rows) {
      const id = row._id ?? row.id;
      if (id) await this.roble.client.remove('application', String(id));
    }
  }

  private fallbackProjects(
    category: string | null | undefined,
    search: string | undefined,
    limit: number,
    offset: number,
  ): Project[] {
    let projects = seedProjects();
    if (category && category !== FOR_YOU_CATEGORY) {
      projects = projects.filter((project) => project.categories.includes(category));
    }
    const term = search?.trim().toLowerCase() ?? '';
    if (term) {
      projects = projects.filter(
        (project) =>
          project.title.toLowerCase().includes(term) ||
          project.categories.some((value) => value.toLowerCase().includes(term)) ||
          project.roles.some((role) => role.name.toLowerCase().includes(term)),
      );
    }
    return projects.slice(offset, offset + limit);
  }

  private rowsToProjects(rows: RobleRecord[]): Project[] {
    const projects: Project[] = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const project = this.projectFromQueryRow(row);
      if (project.id) projects.push(project);
    }
    return projects;
  }

  private projectFromQueryRow(row: RobleRecord): Project {
    const categories = stringList(row.categories);
    const roleNames = stringList(row.roles);
    return {
      id: String(row.id ?? ''),
      authorId: String(row.author_id ?? ''),
      title: String(row.title ?? 'Sin titulo'),
      description: String(row.description ?? ''),
      vision: String(row.vision ?? row.description ?? ''),
      authorName: String(row.author_name ?? 'Autor'),
      authorCareer: String(row.author_career ?? 'Estudiante'),
      authorAvatarUrl: String(row.author_avatar_url ?? DEFAULT_AVATAR),
      categories: categories.length ? categories : ['Tech'],
      matchPercentage: computeMatch({
        userSkills: stringList(row.user_skills),
        userInterests: stringList(row.user_interests),
        projectRoles: roleNames,
        projectCategories: categories,
      }),
      imageUrl: row.image_url ?? row.imageUrl ?? null,
      vacancies: Number.parseInt(String(row.vacancies ?? '2'), 10) || 2,
      roles: roleNames.map<ProjectRole>((name) => ({ name, hasSkill: false })),
      members: memberList(row.members),
      requestedToJoin: row.requested_to_join === true,
    };
  }

  private async fetchViaTables(
    term: string,
    limit: number,
    offset: number,
    userId: string,
  ): Promise<Project[]> {
    const [projectRows, lookups] = await Promise.all([
      this.queryProjectPage(term, limit, offset),
      this.loadLookups(userId),
    ]);
    return projectRows
      .map((row) => this.projectFromRow(row, lookups))
      .filter((project) => !!project.id);
  }

  private async queryProjectPage(
    term: string,
    limit: number,
    offset: number,
  ): Promise<RobleRecord[]> {
    try {
      const result = term
        ? await this.roble.client.executeQueryByName('buscar_proyectos', [
            term,
            limit,
            offset,
          ])
        : await this.roble.client.executeQueryByName('proyectos_paginados', [
            limit,
            offset,
          ]);
      return result.rows;
    } catch {
      return this.roble.client.read('project');
    }
  }

  private async safeRead(table: string): Promise<RobleRecord[]> {
    try {
      return await this.roble.client.read(table);
    } catch {
      return [];
    }
  }

  private async readUserTags(
    table: string,
    valueField: string,
    userId: string,
  ): Promise<string[]> {
    if (!userId) return [];
    try {
      const rows = await this.roble.client.read(table, { collaborator_id: userId });
      return rows
        .map((row) => String(row[valueField] ?? row.name ?? ''))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private async readMyApplications(userId: string): Promise<Set<string>> {
    if (!userId) return new Set();
    try {
      const rows = await this.roble.client.read('application', {
        applicant_id: userId,
      });
      return new Set(
        rows
          .map((row) => String(row.project_id ?? row.projectId ?? ''))
          .filter(Boolean),
      );
    } catch {
      return new Set();
    }
  }

  private async loadLookups(userId: string): Promise<Lookups> {
    const [
      collaboratorRows,
      categoryRows,
      roleRows,
      memberRows,
      userSkills,
      userInterests,
      appliedProjectIds,
    ] = await Promise.all([
      this.safeRead('collaborator'),
      this.safeRead('project_category'),
      this.safeRead('project_role'),
      this.safeRead('project_member'),
      this.readUserTags('collaborator_skill', 'skill_name', userId),
      this.readUserTags('collaborator_interest', 'interest_name', userId),
      this.readMyApplications(userId),
    ]);

    const collaborators = new Map<string, RobleRecord>();
    for (const collaborator of collaboratorRows) {
      for (const key of [collaborator.id, collaborator._id]) {
        const id = String(key ?? '');
        if (id && !collaborators.has(id)) collaborators.set(id, collaborator);
      }
    }

    return {
      collaborators,
      categoriesByProject: groupStrings(categoryRows, 'category_name'),
      rolesByProject: groupStrings(roleRows, 'role_name'),
      membersByProject: groupRows(memberRows),
      userSkills,
      userInterests,
      appliedProjectIds,
    };
  }

  private projectFromRow(row: RobleRecord, lookups: Lookups): Project {
    const id = String(row.id ?? row._id ?? '');
    const categories = lookups.categoriesByProject.get(id) ?? [];
    const roleNames = lookups.rolesByProject.get(id) ?? [];

    const members: ProjectMember[] = (lookups.membersByProject.get(id) ?? []).map(
      (member) => {
        const collaboratorId = String(
          member.collaborator_id ?? member.collaboratorId ?? '',
        );
        const profile = lookups.collaborators.get(collaboratorId);
        return {
          name: String(profile?.name ?? 'Miembro'),
          avatarUrl: String(
            profile?.avatar_url ?? profile?.avatarUrl ?? DEFAULT_AVATAR,
          ),
          discipline: String(member.discipline ?? member.role ?? 'Miembro'),
        };
      },
    );

    const authorId = String(row.author_id ?? row.authorId ?? '');
    const author = authorId ? lookups.collaborators.get(authorId) : undefined;

    return {
      id,
      authorId,
      title: String(row.title ?? 'Sin titulo'),
      description: String(row.description ?? ''),
      vision: String(row.vision ?? row.description ?? ''),
      authorName: String(author?.name ?? 'Autor'),
      authorCareer: String(author?.career ?? 'Estudiante'),
      authorAvatarUrl: String(
        author?.avatar_url ?? author?.avatarUrl ?? DEFAULT_AVATAR,
      ),
      categories: categories.length ? categories : ['Tech'],
      matchPercentage: computeMatch({
        userSkills: lookups.userSkills,
        userInterests: lookups.userInterests,
        projectRoles: roleNames,
        projectCategories: categories,
      }),
      imageUrl: row.image_url ?? row.imageUrl ?? null,
      vacancies: Number.parseInt(String(row.vacancies ?? '2'), 10) || 2,
      roles: roleNames.map<ProjectRole>((name) => ({ name, hasSkill: false })),
      members,
      requestedToJoin: lookups.appliedProjectIds.has(id),
    };
  }
}
