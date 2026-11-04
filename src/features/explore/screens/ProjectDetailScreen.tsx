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
import { shareProject } from '@/src/core/project-share';
import { colors, gradient } from '@/src/core/theme/colors';
import { useAuth } from '@/src/features/auth/AuthContext';
import { ExploreRepository } from '@/src/features/explore/data/ExploreRepository';
import { Project } from '@/src/features/explore/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import {
  Avatar,
  CircleIconButton,
  GradientButton,
  OutlineButton,
  SectionLabel,
  TagChip,
} from '@/src/ui/components';
import { useDialog } from '@/src/ui/dialogs';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ExploreRepository>(TOKENS.ExploreRepo),
    [di],
  );
  const { user } = useAuth();
  const { confirm } = useDialog();
  const { showSuccess, showError } = useFeedback();
  const insets = useSafeAreaInsets();

  const [project, setProject] = useState<Project | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setProject(null);
    setSelectedRole(null);
    repository
      .getProjectById(projectId)
      .then((loaded) => {
        if (!active) return;
        setProject(loaded);
        const firstSkill = loaded.roles.find((role) => role.hasSkill);
        setSelectedRole(firstSkill?.name ?? null);
      })
      .catch(() => {
        if (active) setProject(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, repository]);

  const join = async () => {
    if (!project || submitting) return;
    setSubmitting(true);
    try {
      await repository.requestToJoin(project.id, selectedRole);
      setProject({ ...project, requestedToJoin: true });
      navigation.navigate('RequestSent', { projectId: project.id });
    } catch (error) {
      showError('No se pudo enviar la solicitud', error);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    if (!project || submitting) return;
    const ok = await confirm({
      title: 'Cancelar postulación',
      message: `¿Retirar tu postulación a "${project.title}"?`,
      confirmText: 'Sí, cancelar',
      danger: true,
    });
    if (!ok) return;
    setSubmitting(true);
    try {
      await repository.cancelRequest(project.id);
      setProject({ ...project, requestedToJoin: false });
      showSuccess('Postulación cancelada', 'Ya no apareces como postulante en este proyecto.');
    } catch (error) {
      showError('No se pudo cancelar', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !project) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={{ color: '#6B6B6B', marginTop: 16 }}>
          No se pudo cargar el proyecto.
        </Text>
      </View>
    );
  }

  const isOwner = !!project.authorId && project.authorId === user?.userId;

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
        <View style={[styles.heroActions, { top: insets.top + 10 }]}>
          <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <CircleIconButton
            icon="share-variant-outline"
            onPress={() =>
              shareProject({
                projectId: project.id,
                title: project.title,
                description: project.description,
              })
            }
          />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.tagRow}>
          {project.categories.map((category, index) => (
            <TagChip key={`${category}-${index}`} label={category} />
          ))}
        </View>

        <Text style={styles.title}>{project.title}</Text>

        <Pressable
          style={styles.authorRow}
          disabled={!project.authorId}
          onPress={() =>
            navigation.navigate('PublicProfile', {
              userId: project.authorId,
              fallbackName: project.authorName,
              fallbackCareer: project.authorCareer,
              fallbackAvatarUrl: project.authorAvatarUrl,
            })
          }
        >
          <Avatar uri={project.authorAvatarUrl} size={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.authorName}>Propuesto por {project.authorName}</Text>
            <Text style={styles.authorCareer}>Carrera: {project.authorCareer}</Text>
          </View>
          {project.authorId ? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.subtle}
            />
          ) : null}
        </Pressable>

        <View style={{ marginTop: 24 }}>
          <SectionLabel>Visión del proyecto</SectionLabel>
        </View>
        <Text style={styles.paragraph}>{project.vision}</Text>

        <View style={{ marginTop: 24 }}>
          <SectionLabel>Roles y habilidades requeridas</SectionLabel>
        </View>
        {project.roles.length ? (
          <Text style={styles.hint}>Elige el rol al que quieres postularte.</Text>
        ) : null}
        <View style={{ marginTop: 12, gap: 10 }}>
          {project.roles.map((role) => {
            const selected = role.name === selectedRole;
            return (
              <Pressable
                key={role.name}
                onPress={() => setSelectedRole(role.name)}
                style={[
                  styles.roleRow,
                  selected ? styles.roleRowSelected : styles.roleRowIdle,
                ]}
              >
                <MaterialCommunityIcons
                  name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={20}
                  color={selected ? colors.primary : '#BFBFBF'}
                />
                <Text
                  style={[
                    styles.roleName,
                    selected && { color: colors.primary },
                  ]}
                >
                  {role.name}
                </Text>
                {role.hasSkill ? (
                  <Text style={styles.skillText}>Tienes Éxito</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 22 }}>
          <SectionLabel>Equipo actual</SectionLabel>
        </View>
        <View style={styles.membersRow}>
          {project.members.map((member, index) => (
            <View key={`${member.name}-${index}`} style={styles.member}>
              <Avatar uri={member.avatarUrl} size={48} />
              <Text style={styles.memberText}>
                {member.name} ({member.discipline})
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 28 }}>
          {isOwner ? (
            <View style={styles.ownerBadge}>
              <MaterialCommunityIcons
                name="star"
                size={20}
                color="#FFAA00"
              />
              <Text style={styles.ownerText}>Eres el creador de este proyecto</Text>
            </View>
          ) : project.requestedToJoin ? (
            <OutlineButton
              label="Cancelar postulación"
              icon="cancel"
              color={colors.danger}
              onPress={cancel}
              disabled={submitting}
            />
          ) : (
            <GradientButton
              label={
                project.roles.length && !selectedRole
                  ? 'Elige un rol para postularte'
                  : 'Solicitar Unirse al Equipo'
              }
              icon="send"
              disabled={project.roles.length > 0 && !selectedRole}
              loading={submitting}
              onPress={join}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  hero: {
    height: 210,
    width: '100%',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textSoft,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
  authorName: { fontSize: 14, fontWeight: '600', color: colors.body },
  authorCareer: { fontSize: 12.5, color: colors.subtle, marginTop: 2 },
  paragraph: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
  },
  hint: { marginTop: 6, fontSize: 12.5, color: colors.subtle },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    gap: 12,
  },
  roleRowSelected: {
    backgroundColor: 'rgba(255,112,67,0.08)',
    borderColor: colors.primary,
    borderWidth: 1.6,
  },
  roleRowIdle: { backgroundColor: colors.white, borderColor: '#ECECEC' },
  roleName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSoft },
  skillText: { fontSize: 12, fontWeight: '600', color: colors.green },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 14,
  },
  member: { alignItems: 'center', maxWidth: 110 },
  memberText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  ownerBadge: {
    height: 54,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ownerText: { fontSize: 14, fontWeight: '700', color: '#6B6B6B' },
});
