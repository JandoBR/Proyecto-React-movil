import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuth } from '@/src/features/auth/AuthContext';
import LoginScreen from '@/src/features/auth/screens/LoginScreen';
import RegisterScreen from '@/src/features/auth/screens/RegisterScreen';
import ProjectDetailScreen from '@/src/features/explore/screens/ProjectDetailScreen';
import RequestSentScreen from '@/src/features/explore/screens/RequestSentScreen';
import AppliedProjectDetailScreen from '@/src/features/project/screens/AppliedProjectDetailScreen';
import EditProjectScreen from '@/src/features/project/screens/EditProjectScreen';
import TeamManagementScreen from '@/src/features/project/screens/TeamManagementScreen';
import EditProfileScreen from '@/src/features/profile/screens/EditProfileScreen';
import PublicProfileScreen from '@/src/features/profile/screens/PublicProfileScreen';
import WorkspaceScreen from '@/src/features/workspace/screens/WorkspaceScreen';
import MainTabs from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <Stack.Navigator
      key={signedIn ? 'app' : 'auth'}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      {signedIn ? (
        <>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
          <Stack.Screen name="RequestSent" component={RequestSentScreen} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
          <Stack.Screen name="EditProject" component={EditProjectScreen} />
          <Stack.Screen
            name="AppliedProjectDetail"
            component={AppliedProjectDetailScreen}
          />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Workspace" component={WorkspaceScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
