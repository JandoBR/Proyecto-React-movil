import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors, cardShadow } from '@/src/core/theme/colors';
import { ACCOUNT_TYPE_LABEL } from '@/src/features/auth/domain/models';
import { CollaboratorProfile } from '@/src/features/home/domain/models';
import { AccountTypeBadge } from '@/src/features/profile/AccountTypeBadge';
import { ProfileRepository } from '@/src/features/profile/data/ProfileRepository';
import { RootStackParamList } from '@/src/navigation/types';
import {
  Avatar,
  CircleIconButton,
  SectionLabel,
  TagChip,
} from '@/src/ui/components';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicProfile'>;

export default function PublicProfileScreen({ navigation, route }: Props) {
  const { userId, fallbackName, fallbackCareer, fallbackAvatarUrl } = route.params;
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProfileRepository>(TOKENS.ProfileRepo),
    [di],
  );

  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('Perfil no disponible');
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      repository.getCollaborator(userId),
      repository.getStatsFor(userId),
    ])
      .then(([nextProfile, nextStats]) => {
        if (!active) return;
        setProfile(nextProfile);
        setStats(nextStats);
      })
      .catch(() => active && setError('No se pudo cargar el perfil.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repository, userId]);

  const name = profile?.name ?? fallbackName ?? 'Colaborador';
  const career = profile?.career ?? fallbackCareer ?? 'Estudiante';
  const avatarUrl = profile?.avatarUrl ?? fallbackAvatarUrl ?? '';
  const skills = profile?.skills ?? [];
  const interests = profile?.interests ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignSelf: 'flex-start' }}>
          <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.profileCard}>
          <Avatar uri={avatarUrl} size={92} />
          <Text style={styles.name}>{name}</Text>
          {profile?.accountType &&
          career === ACCOUNT_TYPE_LABEL[profile.accountType] ? null : (
            <Text style={styles.career}>{career}</Text>
          )}
          <AccountTypeBadge accountType={profile?.accountType ?? null} />
        </View>

        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsCard}>
              <Stat label="Creados" value={stats.created ?? 0} />
              <View style={styles.statDivider} />
              <Stat label="Miembro" value={stats.member ?? 0} />
              <View style={styles.statDivider} />
              <Stat label="Postulado" value={stats.applied ?? 0} />
            </View>

            <View style={{ marginTop: 24 }}>
              <SectionLabel>Habilidades</SectionLabel>
            </View>
            {skills.length ? (
              <View style={styles.tagRow}>
                {skills.map((skill) => (
                  <TagChip key={skill} label={skill} />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Este colaborador aún no ha agregado habilidades.
              </Text>
            )}

            <View style={{ marginTop: 24 }}>
              <SectionLabel>Áreas de interés</SectionLabel>
            </View>
            {interests.length ? (
              <View style={styles.tagRow}>
                {interests.map((interest) => (
                  <TagChip key={interest} label={interest} accent />
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Sin áreas de interés registradas.</Text>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  profileCard: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    ...cardShadow,
  },
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
  statsCard: {
    marginTop: 18,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...cardShadow,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  emptyText: { marginTop: 10, fontSize: 13, color: colors.subtle },
  errorText: { marginTop: 20, fontSize: 13, color: colors.subtle },
});
