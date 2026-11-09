import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors, cardShadow } from '@/src/core/theme/colors';
import { useAuth } from '@/src/features/auth/AuthContext';
import { ACCOUNT_TYPE_LABEL } from '@/src/features/auth/domain/models';
import { CollaboratorProfile } from '@/src/features/home/domain/models';
import { AccountTypeBadge } from '@/src/features/profile/AccountTypeBadge';
import { ProfileRepository } from '@/src/features/profile/data/ProfileRepository';
import { RootStackParamList, TabParamList } from '@/src/navigation/types';
import { Avatar, Card, OutlineButton } from '@/src/ui/components';
import { useDialog } from '@/src/ui/dialogs';
import { useFeedback } from '@/src/ui/feedback';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProfileScreen({ navigation }: Props) {
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProfileRepository>(TOKENS.ProfileRepo),
    [di],
  );
  const { logout } = useAuth();
  const { confirm, prompt } = useDialog();
  const { showError } = useFeedback();

  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({
    created: 0,
    member: 0,
    applied: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextStats] = await Promise.all([
        repository.getProfile(),
        repository.getStats(),
      ]);
      setProfile(nextProfile);
      setStats(nextStats);
    } catch (error) {
      showError('Error al cargar perfil', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [repository, showError]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const addSkill = async () => {
    const value = await prompt({
      title: 'Nueva Habilidad',
      hint: 'Ej. Flutter, Figma, Python...',
    });
    if (!value) return;
    try {
      await repository.addSkill(value);
      setProfile((current) =>
        current && !current.skills.includes(value)
          ? { ...current, skills: [...current.skills, value] }
          : current,
      );
    } catch (error) {
      showError('No se pudo agregar la habilidad', error);
    }
  };

  const removeSkill = async (skill: string) => {
    try {
      await repository.removeSkill(skill);
      setProfile((current) =>
        current
          ? { ...current, skills: current.skills.filter((item) => item !== skill) }
          : current,
      );
    } catch (error) {
      showError('No se pudo eliminar la habilidad', error);
    }
  };

  const addInterest = async () => {
    const value = await prompt({
      title: 'Nuevo Interés',
      hint: 'Ej. Inteligencia Artificial, Sostenibilidad...',
    });
    if (!value) return;
    try {
      await repository.addInterest(value);
      setProfile((current) =>
        current && !current.interests.includes(value)
          ? { ...current, interests: [...current.interests, value] }
          : current,
      );
    } catch (error) {
      showError('No se pudo agregar el interés', error);
    }
  };

  const removeInterest = async (interest: string) => {
    try {
      await repository.removeInterest(interest);
      setProfile((current) =>
        current
          ? {
              ...current,
              interests: current.interests.filter((item) => item !== interest),
            }
          : current,
      );
    } catch (error) {
      showError('No se pudo eliminar el interés', error);
    }
  };

  const confirmLogout = async () => {
    const ok = await confirm({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir de tu cuenta?',
      confirmText: 'Salir',
      danger: true,
    });
    if (ok) await logout();
  };

  if (loading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Avatar uri={profile?.avatarUrl} size={92} />
          <Text style={styles.name}>{profile?.name ?? 'Colaborador'}</Text>
          {profile?.accountType &&
          profile.career === ACCOUNT_TYPE_LABEL[profile.accountType] ? null : (
            <Text style={styles.career}>{profile?.career ?? 'Estudiante'}</Text>
          )}
          <AccountTypeBadge accountType={profile?.accountType ?? null} />
          <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
            <OutlineButton
              label="Editar Perfil"
              icon="pencil-outline"
              onPress={() => navigation.navigate('EditProfile')}
            />
          </View>
        </Card>

        <Card style={{ marginTop: 18 }}>
          <View style={styles.statsRow}>
            <Stat label="Creados" value={stats.created ?? 0} />
            <View style={styles.statDivider} />
            <Stat label="Miembro" value={stats.member ?? 0} />
            <View style={styles.statDivider} />
            <Stat label="Postulado" value={stats.applied ?? 0} />
          </View>
        </Card>

        <ChipCard
          title="Habilidades"
          icon="head-cog-outline"
          items={profile?.skills ?? []}
          onAdd={addSkill}
          onRemove={removeSkill}
        />

        <ChipCard
          title="Áreas de Interés"
          icon="star-outline"
          items={profile?.interests ?? []}
          onAdd={addInterest}
          onRemove={removeInterest}
        />

        <Pressable onPress={confirmLogout} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ChipCard({
  title,
  icon,
  items,
  onAdd,
  onRemove,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  items: string[];
  onAdd: () => void;
  onRemove: (value: string) => void;
}) {
  return (
    <Card style={{ marginTop: 18 }}>
      <View style={styles.chipHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
          <Text style={styles.chipTitle}>{title}</Text>
        </View>
        <Pressable onPress={onAdd} hitSlop={8}>
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <Text style={styles.chipEmpty}>Aún no has agregado ninguno.</Text>
      ) : (
        <View style={styles.chipWrap}>
          {items.map((item) => (
            <View key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <Pressable onPress={() => onRemove(item)} hitSlop={6}>
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  career: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  chipEmpty: { marginTop: 10, fontSize: 13, color: colors.subtle },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCBC',
    backgroundColor: 'rgba(255,112,67,0.08)',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  logoutButton: {
    marginTop: 28,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...cardShadow,
    backgroundColor: colors.white,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.red },
});
