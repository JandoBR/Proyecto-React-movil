export interface ProjectMember {
  name: string;
  avatarUrl: string;
  discipline: string;
}

export interface ProjectRole {
  name: string;
  hasSkill: boolean;
}

export interface Project {
  id: string;
  authorId: string;
  title: string;
  description: string;
  vision: string;
  authorName: string;
  authorCareer: string;
  authorAvatarUrl: string;
  categories: string[];
  matchPercentage: number;
  imageUrl?: string | null;
  vacancies: number;
  roles: ProjectRole[];
  members: ProjectMember[];
  requestedToJoin: boolean;
}

export const FOR_YOU_CATEGORY = 'Para Ti';

export const DEFAULT_CATEGORIES = [
  FOR_YOU_CATEGORY,
  'Medio Ambiente',
  'Tech',
  'Arte y Diseño',
  'Salud',
  'Investigación Académica',
];
