import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, cardShadow, gradient } from '@/src/core/theme/colors';
import { HomeRepository } from '@/src/features/home/data/HomeRepository';
import {
  CollaboratorProfile,
  EnrolledProject,
} from '@/src/features/home/domain/models';
import { RootStackParamList, TabParamList } from '@/src/navigation/types';
import { Avatar, BrandLogo, Card } from '@/src/ui/components';
import { useDialog } from '@/src/ui/dialogs';
import { useFeedback } from '@/src/ui/feedback';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const di = useDI();
  const repository = useMemo(() => di.resolve<HomeRepository>(TOKENS.HomeRepo), [di]);
  const { confirm } = useDialog();
  const { showSuccess, showError } = useFeedback();

  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [projects, setProjects] = useState<EnrolledProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextProjects] = await Promise.all([
        repository.getCollaboratorProfile(),
        repository.getEnrolledProjects(),
      ]);
      setProfile(nextProfile);
      setProjects(nextProjects);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [repository]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const leave = async (project: EnrolledProject) => {
    const ok = await confirm({
      title: 'Salir del equipo',
      message: `¿Deseas salir de "${project.title}"?`,
      confirmText: 'Sí, salir',
      danger: true,
    });
    if (!ok) return;
    try {
      await repository.leaveProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      showSuccess('Saliste del equipo', `Ya no participas en "${project.title}".`);
    } catch (error) {
      showError('No se pudo salir del equipo', error);
    }
  };

  const members = projects.filter((project) => project.isMember);
  const applied = projects.filter((project) => !project.isMember);
  const showGroups = members.length > 0 && applied.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {loading && !profile ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
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
          <BrandLogo
            avatarUrl={profile?.avatarUrl}
            onAvatarTap={() => navigation.navigate('Profile')}
          />
          <Text style={styles.greeting}>¡Hola, {profile?.name ?? 'Colaborador'}! 👋</Text>
          <Text style={styles.subtitle}>
            Encuentra tu próximo proyecto interdisciplinario.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={{ flex: 3 }}
              onPress={() => navigation.navigate('Create')}
            >
              <LinearGradient
                colors={[...gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.actionCard}
              >
                <MaterialCommunityIcons name="plus" size={26} color={colors.white} />
                <Text style={styles.actionTitleLight}>Crear Proyecto</Text>
                <Text style={styles.actionSubtitleLight}>
                  Publica tu idea y recluta colaboradores
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={{ flex: 2 }}
              onPress={() => navigation.navigate('Explore')}
            >
              <View style={[styles.actionCard, styles.actionCardLight]}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={26}
                  color={colors.textSoft}
                />
                <Text style={styles.actionTitle}>Explorar Proyectos</Text>
                <Text style={styles.actionSubtitle}>
                  Únete a equipos de estudiantes
                </Text>
              </View>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Proyectos en los que participas</Text>

          {projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={40}
                color={colors.subtle}
              />
              <Text style={styles.emptyText}>
                Aún no participas en ningún proyecto.
              </Text>
              <Pressable onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.emptyLink}>Explorar proyectos disponibles</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {members.length > 0 ? (
                <>
                  {showGroups ? <Text style={styles.groupLabel}>EN TU EQUIPO</Text> : null}
                  {members.map((project) => (
                    <View key={project.id} style={{ marginBottom: 14 }}>
                      <EnrolledProjectCard
                        project={project}
                        onLeave={() => leave(project)}
                        onOpenWorkspace={() =>
                          navigation.navigate('Workspace', {
                            projectId: project.id,
                            projectTitle: project.title,
                            isOwner: false,
                          })
                        }
                      />
                    </View>
                  ))}
                </>
              ) : null}
              {applied.length > 0 ? (
                <>
                  {showGroups ? (
                    <View style={styles.divider}>
                      <Text style={styles.groupLabel}>TUS POSTULACIONES</Text>
                    </View>
                  ) : null}
                  {applied.map((project) => (
                    <View key={project.id} style={{ marginBottom: 14 }}>
                      <EnrolledProjectCard project={project} />
                    </View>
                  ))}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function EnrolledProjectCard({
  project,
  onLeave,
  onOpenWorkspace,
}: {
  project: EnrolledProject;
  onLeave?: () => void;
  onOpenWorkspace?: () => void;
}) {
  const rejected = project.role.toLowerCase().includes('rechaz');
  return (
    <Card>
      <View style={styles.authorRow}>
        <Avatar uri={project.authorAvatarUrl} size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.authorName}>{project.authorName}</Text>
          <Text style={styles.authorRole}>Creador</Text>
        </View>
        {project.isMember ? (
          <View style={styles.acceptedBadge}>
            <MaterialCommunityIcons
              name="check-circle"
              size={13}
              color={colors.green}
            />
            <Text style={styles.acceptedText}>Aceptado</Text>
          </View>
        ) : (
          <View
            style={[
              styles.statusChip,
              { backgroundColor: rejected ? colors.redBg : colors.amberBg },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                { color: rejected ? colors.red : colors.amber },
              ]}
            >
              {project.role}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.projectTitle}>{project.title}</Text>
      <Text style={styles.projectDescription}>{project.description}</Text>

      {project.isMember ? (
        <>
          <View style={styles.memberFooter}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Tu rol: {project.role}</Text>
            </View>
            {onLeave ? (
              <Pressable onPress={onLeave} style={styles.leaveButton}>
                <MaterialCommunityIcons name="logout" size={15} color={colors.red} />
                <Text style={styles.leaveText}>Salir del equipo</Text>
              </Pressable>
            ) : null}
          </View>
          {onOpenWorkspace ? (
            <Pressable onPress={onOpenWorkspace} style={{ marginTop: 14 }}>
              <LinearGradient
                colors={[...gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.workspaceButton}
              >
                <MaterialCommunityIcons
                  name="view-dashboard-outline"
                  size={18}
                  color={colors.white}
                />
                <Text style={styles.workspaceText}>Espacio de trabajo</Text>
              </LinearGradient>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  greeting: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textSoft,
  },
  subtitle: { marginTop: 6, fontSize: 15, color: colors.muted },
  actions: { flexDirection: 'row', gap: 14, marginTop: 20 },
  actionCard: {
    borderRadius: 22,
    padding: 16,
    minHeight: 150,
    justifyContent: 'flex-start',
  },
  actionCardLight: {
    backgroundColor: colors.white,
    ...cardShadow,
  },
  actionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSoft,
  },
  actionTitleLight: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  actionSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
  },
  actionSubtitleLight: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.95)',
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSoft,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyLink: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  groupLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.subtle,
    marginBottom: 10,
  },
  divider: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 14.5, fontWeight: '700', color: colors.textSoft },
  authorRole: { fontSize: 12, color: colors.subtle, marginTop: 2 },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  acceptedText: { fontSize: 11.5, fontWeight: '700', color: colors.green },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusChipText: { fontSize: 11.5, fontWeight: '700' },
  projectTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textSoft,
  },
  projectDescription: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.muted,
  },
  memberFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rolePill: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rolePillText: { fontSize: 11.5, fontWeight: '600', color: colors.muted },
  leaveButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaveText: { fontSize: 12.5, fontWeight: '700', color: colors.red },
  workspaceButton: {
    height: 46,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  workspaceText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});
