import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform } from 'react-native';

import { colors } from '@/src/core/theme/colors';
import CreateProjectScreen from '@/src/features/create/screens/CreateProjectScreen';
import ExploreScreen from '@/src/features/explore/screens/ExploreScreen';
import HomeScreen from '@/src/features/home/screens/HomeScreen';
import MyProjectsScreen from '@/src/features/project/screens/MyProjectsScreen';
import ProfileScreen from '@/src/features/profile/screens/ProfileScreen';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<
  keyof TabParamList,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  Home: 'home-variant-outline',
  Explore: 'magnify',
  Create: 'plus-circle-outline',
  Projects: 'folder-outline',
  Profile: 'account-outline',
};

const LABELS: Record<keyof TabParamList, string> = {
  Home: 'Inicio',
  Explore: 'Explorar',
  Create: 'Crear',
  Projects: 'Proyectos',
  Profile: 'Perfil',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabel: LABELS[route.name],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name]}
            size={size + 2}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Create" component={CreateProjectScreen} />
      <Tab.Screen name="Projects" component={MyProjectsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
