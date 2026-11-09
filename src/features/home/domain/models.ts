import { AccountType } from '@/src/features/auth/domain/models';

export interface CollaboratorProfile {
  name: string;
  avatarUrl: string;
  career: string;
  accountType: AccountType | null;
  skills: string[];
  interests: string[];
}

export interface EnrolledProject {
  id: string;
  title: string;
  description: string;
  authorName: string;
  authorAvatarUrl: string;
  role: string;
  isMember: boolean;
}
