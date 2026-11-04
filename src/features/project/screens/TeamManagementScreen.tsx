import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors, gradient } from '@/src/core/theme/colors';
import { ProjectRepository } from '@/src/features/project/data/ProjectRepository';
import {
  Applicant,
  CreatedProject,
  pendingApplicants,
  teamMembers,
} from '@/src/features/project/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import {
  Avatar,
  CircleIconButton,
  EmptyState,
  SegmentedTabs,
  SectionLabel,
  StatusBadge,
} from '@/src/ui/components';
import { useDialog } from '@/src/ui/dialogs';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamManagement'>;

export default function TeamManagementScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProjectRepository>(TOKENS.ProjectRepo),
    [di],
  );
  const { confirm } = useDialog();
  const { showSuccess, showError } = useFeedback();
  const insets = useSafeAreaInsets();

  const [project, setProject] = useState<CreatedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'team'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setProject(await repository.getCreatedProjectById(projectId));
    } catch {
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const run = async (
    applicantId: string,
    action: () => Promise<void>,
    message: string,
  ) => {
    if (processingId) return;
    setProcessingId(applicantId);
    try {
      await action();
      showSuccess('Listo', message);
      await load();
    } catch (error) {
      showError('No se pudo completar la acción', error);
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (applicant: Applicant) => {
    const ok = await confirm({
      title: 'Rechazar postulación',
      message: `¿Rechazar a ${applicant.name} para el rol "${applicant.requestedRole}"?`,
      confirmText: 'Sí, rechazar',
      danger: true,
    });
    if (ok) {
      await run(
        applicant.id,
        () => repository.rejectApplicant(projectId, applicant.id),
        'Postulación rechazada.',
      );
    }
  };

  const remove = async (member: Applicant) => {
    const ok = await confirm({
      title: 'Retirar del equipo',
      message: `¿Retirar a ${member.name} del equipo? Su cupo quedará disponible de nuevo.`,
      confirmText: 'Sí, retirar',
      danger: true,
    });
    if (ok) {
      await run(
        member.id,
        () => repository.removeMember(projectId, member.id),
        'Integrante retirado del equipo.',
      );
    }
  };

  if (loading && !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={{ color: '#6B6B6B' }}>No se pudo cargar el proyecto.</Text>
      </View>
    );
  }

  const pending = pendingApplicants(project);
  const team = teamMembers(project);
  const canAccept = project.vacancies <= 0 || team.length < project.vacancies;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.hero}>
        {project.imageUrl ? (
          <Image source={{ uri: project.imageUrl }} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[styles.heroAction, { top: insets.top + 10 }]}>
          <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <SectionLabel>Gestionar equipo</SectionLabel>
          <StatusBadge kind="project" status={project.status} />
        </View>
        <Text style={styles.title}>{project.title}</Text>

        <View style={styles.capacityCard}>
          <View style={styles.capacityHeader}>
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.capacityTitle}>Capacidad del equipo</Text>
            <Text style={styles.capacityValue}>
              {project.vacancies > 0
                ? `${team.length} / ${project.vacancies}`
                : `${team.length}`}
            </Text>
          </View>
          {project.vacancies > 0 ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (team.length / project.vacancies) * 100,
                    )}%`,
                    backgroundColor:
                      team.length >= project.vacancies
                        ? colors.green
                        : colors.primary,
                  },
                ]}
              />
            </View>
          ) : null}
          <View style={styles.statsRow}>
            <Stat label="En equipo" value={team.length} />
            <View style={styles.statDivider} />
            <Stat label="Pendientes" value={pending.length} />
            <View style={styles.statDivider} />
            <Stat
              label="Vacantes"
              value={project.vacancies > 0 ? project.vacancies : '∞'}
            />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <SegmentedTabs
            segments={[
              { label: `Postulantes (${pending.length})`, value: 'pending' },
              { label: `Equipo (${team.length})`, value: 'team' },
            ]}
            selected={tab}
            onSelect={setTab}
          />
        </View>

        <View style={{ marginTop: 18, gap: 12 }}>
          {tab === 'pending' ? (
            pending.length ? (
              pending.map((applicant) => (
                <ApplicantTile
                  key={applicant.id}
                  applicant={applicant}
                  processing={processingId === applicant.id}
                  acceptEnabled={canAccept}
                  onAccept={() =>
                    run(
                      applicant.id,
                      () => repository.acceptApplicant(projectId, applicant.id),
                      'Colaborador aceptado en el equipo.',
                    )
                  }
                  onReject={() => reject(applicant)}
                  onProfile={
                    applicant.collaboratorId
                      ? () =>
                          navigation.navigate('PublicProfile', {
                            userId: applicant.collaboratorId,
                            fallbackName: applicant.name,
                            fallbackCareer: applicant.career,
                            fallbackAvatarUrl: applicant.avatarUrl,
                          })
                      : undefined
                  }
                />
              ))
            ) : (
              <EmptyState
                icon="inbox-outline"
                title="Sin postulantes pendientes"
                message="Cuando alguien solicite unirse a tu proyecto, aparecerá aquí para que lo revises."
              />
            )
          ) : team.length ? (
            team.map((member) => (
              <ApplicantTile
                key={member.id}
                applicant={member}
                processing={processingId === member.id}
                onRemove={() => remove(member)}
                onProfile={
                  member.collaboratorId
                    ? () =>
                        navigation.navigate('PublicProfile', {
                          userId: member.collaboratorId,
                          fallbackName: member.name,
                          fallbackCareer: member.career,
                          fallbackAvatarUrl: member.avatarUrl,
                        })
                    : undefined
                }
              />
            ))
          ) : (
            <EmptyState
              icon="account-group-outline"
              title="Aún no hay integrantes"
              message="Acepta postulantes para empezar a armar tu equipo."
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ApplicantTile({
  applicant,
  processing,
  acceptEnabled = true,
  onAccept,
  onReject,
  onRemove,
  onProfile,
}: {
  applicant: Applicant;
  processing: boolean;
  acceptEnabled?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  onProfile?: () => void;
}) {
  const pendingTile = !!onAccept && !!onReject;
  return (
    <View style={styles.applicantCard}>
      <Pressable style={styles.applicantRow} onPress={onProfile}>
        <Avatar uri={applicant.avatarUrl} size={48} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.applicantName} numberOfLines={1}>
            {applicant.name}
          </Text>
          {applicant.career ? (
            <Text style={styles.applicantCareer} numberOfLines={1}>
              {applicant.career}
            </Text>
          ) : null}
          {applicant.requestedRole ? (
            <View style={styles.rolePill}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={12}
                color={colors.primary}
              />
              <Text style={styles.rolePillText} numberOfLines={1}>
                {applicant.requestedRole}
              </Text>
            </View>
          ) : null}
        </View>
        {onProfile ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.subtle}
          />
        ) : null}
      </Pressable>

      {pendingTile ? (
        <View style={styles.decisionRow}>
          {processing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Pressable onPress={onReject} style={styles.rejectButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.red}
                />
                <Text style={styles.rejectText}>Rechazar</Text>
              </Pressable>
              <Pressable
                onPress={acceptEnabled ? onAccept : undefined}
                style={[
                  styles.acceptButton,
                  !acceptEnabled && { opacity: 0.45 },
                ]}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={colors.white}
                />
                <Text style={styles.acceptText}>Aceptar</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : onRemove ? (
        <Pressable
          onPress={processing ? undefined : onRemove}
          style={styles.removeRow}
        >
          {processing ? (
            <ActivityIndicator color={colors.red} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="account-remove-outline"
                size={18}
                color={colors.red}
              />
              <Text style={styles.removeText}>Retirar del equipo</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {pendingTile && !acceptEnabled ? (
        <Text style={styles.capacityHint}>
          Equipo completo: aumenta las vacantes para aceptar más.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    gap: 16,
  },
  hero: {
    height: 190,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroAction: { position: 'absolute', left: 16 },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textSoft,
  },
  capacityCard: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
  },
  capacityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  capacityTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  capacityValue: { fontSize: 15, fontWeight: '800', color: colors.primary },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: colors.chipBg,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: 10, borderRadius: 10 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  applicantCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
  },
  applicantRow: { flexDirection: 'row', alignItems: 'center' },
  applicantName: { fontSize: 15, fontWeight: '700', color: colors.textSoft },
  applicantCareer: { fontSize: 12.5, color: colors.subtle, marginTop: 2 },
  rolePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCCBC',
    backgroundColor: 'rgba(255,112,67,0.08)',
  },
  rolePillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primary,
    maxWidth: 200,
  },
  decisionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  rejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 30,
    backgroundColor: colors.redBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectText: { fontSize: 14, fontWeight: '700', color: colors.red },
  acceptButton: {
    flex: 1,
    height: 44,
    borderRadius: 30,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptText: { fontSize: 14, fontWeight: '700', color: colors.white },
  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE6',
    paddingTop: 10,
  },
  removeText: { fontSize: 13, fontWeight: '600', color: colors.red },
  capacityHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: colors.subtle,
  },
});
