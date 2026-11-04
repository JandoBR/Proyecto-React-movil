import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradient } from '@/src/core/theme/colors';
import {
  APPLICATION_STATUS_LABEL,
  ApplicationStatus,
} from '@/src/features/project/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import {
  Avatar,
  Card,
  CircleIconButton,
  SectionLabel,
  StatusBadge,
  TagChip,
} from '@/src/ui/components';

type Props = NativeStackScreenProps<RootStackParamList, 'AppliedProjectDetail'>;

const STATUS_STYLE: Record<
  ApplicationStatus,
  { fg: string; bg: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; message: string }
> = {
  accepted: {
    fg: colors.green,
    bg: colors.greenBg,
    icon: 'party-popper',
    message: '¡Felicidades! Ya formas parte del equipo de este proyecto.',
  },
  underReview: {
    fg: colors.amber,
    bg: colors.amberBg,
    icon: 'timer-sand',
    message:
      'El autor está revisando tu perfil. Verás el resultado aquí en cuanto responda.',
  },
  rejected: {
    fg: colors.red,
    bg: colors.redBg,
    icon: 'information-outline',
    message:
      'Esta vez no fuiste seleccionado. Sigue explorando otros proyectos afines a ti.',
  },
};

export default function AppliedProjectDetailScreen({ navigation, route }: Props) {
  const { project } = route.params;
  const insets = useSafeAreaInsets();
  const style = STATUS_STYLE[project.status];
  const resolved = project.status !== 'underReview';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.body}>
        {project.categories.length ? (
          <View style={styles.tagRow}>
            {project.categories.map((category, index) => (
              <TagChip key={`${category}-${index}`} label={category} />
            ))}
          </View>
        ) : null}

        <Text style={styles.title}>{project.title}</Text>

        <View style={styles.authorRow}>
          <Avatar uri={project.authorAvatarUrl} size={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.authorName}>
              Propuesto por {project.authorName}
            </Text>
            {project.authorCareer ? (
              <Text style={styles.authorCareer}>
                Carrera: {project.authorCareer}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionLabel>Tu postulación</SectionLabel>
        </View>

        <Card style={{ marginTop: 12 }}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: style.bg }]}>
              <MaterialCommunityIcons
                name={style.icon}
                size={22}
                color={style.fg}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <StatusBadge kind="application" status={project.status} />
              <Text style={styles.statusMessage}>{style.message}</Text>
            </View>
          </View>

          <View style={styles.statusDivider} />

          <TimelineStep
            title="Postulación enviada"
            subtitle={project.appliedDate ? `El ${project.appliedDate}` : undefined}
            color={colors.green}
            done
          />
          <TimelineStep
            title="En revisión por el autor"
            color={resolved ? colors.green : style.fg}
            done={resolved}
            current={!resolved}
          />
          <TimelineStep
            title={resolved ? APPLICATION_STATUS_LABEL[project.status] : 'Respuesta del equipo'}
            color={resolved ? style.fg : '#BDBDBD'}
            done={resolved}
            current={resolved}
            last
          />
        </Card>

        <View style={{ marginTop: 24 }}>
          <SectionLabel>Descripción</SectionLabel>
        </View>
        <Text style={styles.paragraph}>
          {project.description || 'Sin descripción.'}
        </Text>

        {project.vision && project.vision !== project.description ? (
          <>
            <View style={{ marginTop: 24 }}>
              <SectionLabel>Visión del proyecto</SectionLabel>
            </View>
            <Text style={styles.paragraph}>{project.vision}</Text>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function TimelineStep({
  title,
  subtitle,
  color,
  done = false,
  current = false,
  last = false,
}: {
  title: string;
  subtitle?: string;
  color: string;
  done?: boolean;
  current?: boolean;
  last?: boolean;
}) {
  const active = done || current;
  return (
    <View style={styles.timelineRow}>
      <View style={{ alignItems: 'center', width: 20 }}>
        <View
          style={[
            styles.timelineDot,
            { backgroundColor: active ? color : colors.white, borderColor: active ? color : colors.border },
          ]}
        >
          {done ? (
            <MaterialCommunityIcons name="check" size={12} color={colors.white} />
          ) : null}
        </View>
        {!last ? (
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: done ? color : colors.border },
            ]}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, marginLeft: 12, paddingBottom: last ? 0 : 16 }}>
        <Text
          style={[
            styles.timelineTitle,
            {
              color: active ? colors.textSoft : colors.subtle,
              fontWeight: current ? '700' : '600',
            },
          ]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.timelineSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  hero: {
    height: 190,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textSoft,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  authorName: { fontSize: 14, fontWeight: '600', color: colors.body },
  authorCareer: { fontSize: 12.5, color: colors.subtle, marginTop: 2 },
  statusHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMessage: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.body,
  },
  statusDivider: {
    marginVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE6',
  },
  timelineRow: { flexDirection: 'row' },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineTitle: { fontSize: 14 },
  timelineSubtitle: { fontSize: 12.5, color: colors.subtle, marginTop: 2 },
  paragraph: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
  },
});
