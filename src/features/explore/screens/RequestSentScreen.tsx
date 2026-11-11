import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors, gradient } from '@/src/core/theme/colors';
import { ExploreRepository } from '@/src/features/explore/data/ExploreRepository';
import { Project } from '@/src/features/explore/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import { Card, GradientButton, OutlineButton } from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestSent'>;

export default function RequestSentScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ExploreRepository>(TOKENS.ExploreRepo),
    [di],
  );
  const { showError, showSuccess } = useFeedback();
  const [project, setProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    repository.getProjectById(projectId).then(setProject).catch(() => {});
  }, [projectId, repository]);

  const cancel = async () => {
    setSubmitting(true);
    try {
      await repository.cancelRequest(projectId);
      showSuccess('Postulación cancelada', 'Ya no apareces como postulante.');
      navigation.popToTop();
    } catch (error) {
      showError('No se pudo cancelar', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.checkCircle}>
          <MaterialCommunityIcons name="check" size={60} color={colors.green} />
        </View>
        <Text style={styles.title}>¡Solicitud Enviada!</Text>
        <Text style={styles.message}>
          {project?.authorName ?? 'El autor'} ha sido notificado. Recibirás una
          notificación en Nexus cuando revise tu solicitud.
        </Text>

        {project ? (
          <Card style={{ marginTop: 28, width: '100%' }}>
            <View style={styles.summaryRow}>
              <LinearGradient
                colors={[...gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryIcon}
              >
                <MaterialCommunityIcons
                  name="folder"
                  size={22}
                  color={colors.white}
                />
              </LinearGradient>
              <Text style={styles.summaryTitle}>{project.title}</Text>
            </View>
          </Card>
        ) : null}

        <View style={{ flex: 1 }} />

        <GradientButton
          label="Volver a Explorar"
          icon="magnify"
          onPress={() => navigation.popToTop()}
        />
        <Text style={styles.hint}>¿Cambiaste de opinión?</Text>
        <OutlineButton
          label="Cancelar Postulación"
          color={colors.primaryDark}
          onPress={cancel}
          disabled={submitting}
        />
        {submitting ? <Text style={styles.submitting}>Cancelando…</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.greenBg,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    fontSize: 24,
    fontWeight: '800',
    color: colors.textSoft,
    textAlign: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: 'center',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSoft,
  },
  hint: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 13,
    color: colors.subtle,
    textAlign: 'center',
  },
  submitting: { textAlign: 'center', marginTop: 8, color: colors.muted },
});
