export type ApplicationStatus = 'underReview' | 'accepted' | 'rejected';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  underReview: 'En revisión',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

export function applicationStatusFrom(value: unknown): ApplicationStatus {
  if (value === 'accepted' || value === 'rejected') return value;
  return 'underReview';
}

export type CreatedProjectStatus = 'recruiting' | 'active' | 'completed';

export const CREATED_PROJECT_STATUS_LABEL: Record<
  CreatedProjectStatus,
  string
> = {
  recruiting: 'Reclutando',
  active: 'Activo',
  completed: 'Completado',
};

export function createdProjectStatusFrom(value: unknown): CreatedProjectStatus {
  if (value === 'active' || value === 'completed') return value;
  return 'recruiting';
}

export interface Applicant {
  id: string;
  collaboratorId: string;
  name: string;
  avatarUrl: string;
  career: string;
  requestedRole: string;
  status: ApplicationStatus;
}

export interface AppliedProject {
  id: string;
  title: string;
  description: string;
  vision: string;
  authorName: string;
  authorCareer: string;
  authorAvatarUrl: string;
  categories: string[];
  status: ApplicationStatus;
  appliedDate: string;
}

export interface CreatedProject {
  id: string;
  title: string;
  description: string;
  vision: string;
  imageUrl: string;
  categories: string[];
  roles: string[];
  status: CreatedProjectStatus;
  vacancies: number;
  applicants: Applicant[];
}

export function pendingApplicants(project: CreatedProject): Applicant[] {
  return project.applicants.filter((applicant) => applicant.status === 'underReview');
}

export function teamMembers(project: CreatedProject): Applicant[] {
  return project.applicants.filter((applicant) => applicant.status === 'accepted');
}
