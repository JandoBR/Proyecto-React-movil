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
import { Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { shareProject } from '@/src/core/project-share';
import { colors, gradient } from '@/src/core/theme/colors';
import { ProjectRepository } from '@/src/features/project/data/ProjectRepository';
import {
  AppliedProject,
  CreatedProject,
  pendingApplicants,
  teamMembers,
} from '@/src/features/project/domain/models';
import { RootStackParamList, TabParamList } from '@/src/navigation/types';
import {
  Avatar,
  BrandLogo,
  Card,
  SegmentedTabs,
  StatusBadge,
} from '@/src/ui/components';
import { useDialog } from '@/src/ui/dialogs';
import { useFeedback } from '@/src/ui/feedback';
import { useAvatarUrl } from '@/src/features/profile/useAvatarUrl';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Projects'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Tab = 'created' | 'applied';

export default function MyProjectsScreen({ navigation }: Props) {
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProjectRepository>(TOKENS.ProjectRepo),
    [di],
  );
  const { confirm } = useDialog();
  const { showSuccess, showError } = useFeedback();
  const avatarUrl = useAvatarUrl();

  const [tab, setTab] = useState<Tab>('applied');
  const [created, setCreated] = useState<CreatedProject[]>([]);
  const [applied, setApplied] = useState<AppliedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextCreated, nextApplied] = await Promise.all([
        repository.getCreatedProjects(),
        repository.getAppliedProjects(),
      ]);
      setCreated(nextCreated);
      setApplied(nextApplied);
    } catch (error) {
      showError('No se pudieron cargar tus proyectos', error);
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

  const withdraw = async (project: AppliedProject) => {
    const ok = await confirm({
      title: 'Cancelar postulación',
      message: `¿Retirar tu postulación a "${project.title}"?`,
      confirmText: 'Sí, retirar',
      danger: true,
    });
    if (!ok) return;
    try {
      await repository.withdrawApplication(project.id);
      setApplied((current) => current.filter((item) => item.id !== project.id));
      showSuccess('Postulación retirada', `Ya no apareces como postulante en "${project.title}".`);
    } catch (error) {
      showError('No se pudo retirar', error);
    }
  };

  const startProject = async (project: CreatedProject) => {
    const ok = await confirm({
      title: 'Iniciar proyecto',
      message: `"${project.title}" pasará a estado Activo y se habilitará su espacio de trabajo con tareas, calendario y progreso.`,
      confirmText: 'Iniciar',
    });
    if (!ok) return;
    try {
      await repository.updateProject({
        projectId: project.id,
        title: project.title,
        description: project.description,
        vision: project.vision,
        vacancies: project.vacancies,
        status: 'active',
        categories: project.categories,
        roles: project.roles,
        imageUrl: project.imageUrl,
      });
      await load();
      showSuccess(
        '¡Proyecto iniciado!',
        'Ya puedes organizar tareas y fechas en el espacio de trabajo.',
      );
    } catch (error) {
      showError('No se pudo iniciar el proyecto', error);
    }
  };

  const removeProject = async (project: CreatedProject) => {
    const ok = await confirm({
      title: 'Eliminar proyecto',
      message: `¿Eliminar "${project.title}"? Se borrarán también sus postulaciones y miembros. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await repository.deleteProject(project.id);
      setCreated((current) => current.filter((item) => item.id !== project.id));
      showSuccess('Proyecto eliminado', `"${project.title}" se eliminó definitivamente.`);
    } catch (error) {
      showError('No se pudo eliminar', error);
    }
  };

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
        <BrandLogo avatarUrl={avatarUrl} onAvatarTap={() => navigation.navigate('Profile')} />
        <Text style={styles.title}>Mis Proyectos</Text>
        <View style={{ marginTop: 18 }}>
          <SegmentedTabs
            segments={[
              { label: 'Creados', value: 'created' },
              { label: 'Aplicados', value: 'applied' },
            ]}
            selected={tab}
            onSelect={setTab}
          />
        </View>

        <View style={{ marginTop: 18 }}>
          {loading && !created.length && !applied.length ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : tab === 'created' ? (
            created.length ? (
              created.map((project) => (
                <View key={project.id} style={{ marginBottom: 16 }}>
                  <CreatedProjectCard
                    project={project}
                    onManageTeam={() =>
                      navigation.navigate('TeamManagement', {
                        projectId: project.id,
                      })
                    }
                    onEdit={() =>
                      navigation.navigate('EditProject', { projectId: project.id })
                    }
                    onDelete={() => removeProject(project)}
                    onShare={() =>
                      shareProject({
                        projectId: project.id,
                        title: project.title,
                        description: project.description,
                      })
                    }
                    onStart={() => startProject(project)}
                    onOpenWorkspace={() =>
                      navigation.navigate('Workspace', {
                        projectId: project.id,
                        projectTitle: project.title,
                        isOwner: true,
                      })
                    }
                  />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aún no has creado proyectos.</Text>
            )
          ) : applied.length ? (
            applied.map((project) => (
              <View key={project.id} style={{ marginBottom: 16 }}>
                <AppliedProjectCard
                  project={project}
                  onView={() =>
                    navigation.navigate('AppliedProjectDetail', { project })
                  }
                  onWithdraw={() => withdraw(project)}
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aún no has aplicado a proyectos.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CreatedProjectCard({
  project,
  onManageTeam,
  onEdit,
  onDelete,
  onShare,
  onStart,
  onOpenWorkspace,
}: {
  project: CreatedProject;
  onManageTeam: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onStart: () => void;
  onOpenWorkspace: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pending = pendingApplicants(project).length;
  const team = teamMembers(project).length;

  return (
    <Card>
      <View style={styles.cardHeader}>
        <Text style={styles.createdTitle}>{project.title}</Text>
        <StatusBadge kind="project" status={project.status} />
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={colors.subtle}
              />
            </Pressable>
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuOpen(false);
              onEdit();
            }}
            title="Editar"
            leadingIcon="pencil-outline"
          />
          <Menu.Item
            onPress={() => {
              setMenuOpen(false);
              onShare();
            }}
            title="Compartir"
            leadingIcon="share-variant-outline"
          />
          <Menu.Item
            onPress={() => {
              setMenuOpen(false);
              onDelete();
            }}
            title="Eliminar"
            leadingIcon="delete-outline"
            titleStyle={{ color: colors.danger }}
          />
        </Menu>
      </View>

      <Text style={styles.createdDescription}>{project.description}</Text>

      {project.status === 'recruiting' ? (
        <Pressable onPress={onStart} style={{ marginTop: 16 }}>
          <View style={styles.startButton}>
            <MaterialCommunityIcons
              name="rocket-launch-outline"
              size={18}
              color={colors.primaryDark}
            />
            <Text style={styles.startButtonText}>Iniciar proyecto</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable onPress={onOpenWorkspace} style={{ marginTop: 16 }}>
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
      )}

      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>
          {project.vacancies} vacantes · {pending} postulantes · {team} en equipo
        </Text>
        <Pressable onPress={onManageTeam} style={styles.manageButton}>
          <Text style={styles.manageText}>Gestionar Equipo</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>
    </Card>
  );
}

function AppliedProjectCard({
  project,
  onView,
  onWithdraw,
}: {
  project: AppliedProject;
  onView: () => void;
  onWithdraw: () => void;
}) {
  return (
    <Card>
      <View style={styles.authorRow}>
        <Avatar uri={project.authorAvatarUrl} size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.authorName}>{project.authorName}</Text>
          <Text style={styles.authorRole}>Creador</Text>
        </View>
        <StatusBadge kind="application" status={project.status} />
      </View>

      <Text style={styles.appliedTitle}>{project.title}</Text>
      <Text style={styles.appliedDescription}>{project.description}</Text>

      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
        <Text style={styles.appliedDate}>Aplicado el {project.appliedDate}</Text>
        <Pressable onPress={onView} style={styles.manageButton}>
          <Text style={styles.manageText}>Ver detalles</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>

      {project.status === 'underReview' ? (
        <Pressable onPress={onWithdraw} style={styles.withdrawButton}>
          <MaterialCommunityIcons name="undo" size={16} color={colors.primaryDark} />
          <Text style={styles.withdrawText}>Cancelar postulación</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  title: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textSoft,
  },
  emptyText: {
    paddingTop: 60,
    textAlign: 'center',
    color: colors.muted,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  createdTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: colors.textSoft,
  },
  createdDescription: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.muted,
  },
  startButton: {
    height: 46,
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  workspaceButton: {
    height: 46,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  workspaceText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  cardDivider: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardMeta: { flex: 1, fontSize: 12.5, color: colors.subtle },
  manageButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  manageText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorName: { fontSize: 14.5, fontWeight: '700', color: colors.textSoft },
  authorRole: { fontSize: 12, color: colors.subtle, marginTop: 2 },
  appliedTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: '800',
    color: colors.textSoft,
  },
  appliedDescription: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.muted,
  },
  appliedDate: { fontSize: 12.5, color: colors.subtle },
  withdrawButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  withdrawText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});
