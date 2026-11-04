import { NavigatorScreenParams } from '@react-navigation/native';

import { AppliedProject } from '@/src/features/project/domain/models';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Projects: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  ProjectDetail: { projectId: string };
  RequestSent: { projectId: string };
  PublicProfile: {
    userId: string;
    fallbackName?: string;
    fallbackCareer?: string;
    fallbackAvatarUrl?: string;
  };
  TeamManagement: { projectId: string };
  EditProject: { projectId: string };
  AppliedProjectDetail: { project: AppliedProject };
  EditProfile: undefined;
  Workspace: { projectId: string; projectTitle: string; isOwner: boolean };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
