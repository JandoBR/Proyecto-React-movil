export interface CollaboratorProfile {
  name: string;
  avatarUrl: string;
  career: string;
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
