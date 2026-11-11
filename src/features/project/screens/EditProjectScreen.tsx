import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors, cardShadow } from '@/src/core/theme/colors';
import { ProjectRepository } from '@/src/features/project/data/ProjectRepository';
import {
  CREATED_PROJECT_STATUS_LABEL,
  CreatedProject,
  CreatedProjectStatus,
} from '@/src/features/project/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import {
  AppTextInput,
  CircleIconButton,
  EmptyState,
  GradientButton,
} from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProject'>;

const AVAILABLE_CATEGORIES = [
  'Tech',
  'Medio Ambiente',
  'Arte y Diseño',
  'Salud',
  'Investigación Académica',
  'Impacto Social',
  'Educación',
];

export default function EditProjectScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProjectRepository>(TOKENS.ProjectRepo),
    [di],
  );
  const { showSuccess, showError } = useFeedback();

  const [project, setProject] = useState<CreatedProject | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vision, setVision] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState('');
  const [vacancies, setVacancies] = useState(2);
  const [status, setStatus] = useState<CreatedProjectStatus>('recruiting');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    repository
      .getCreatedProjectById(projectId)
      .then((loaded) => {
        if (!active) return;
        setLoadError(null);
        setProject(loaded);
        setTitle(loaded.title);
        setDescription(loaded.description);
        setVision(loaded.vision);
        setImageUrl(loaded.imageUrl);
        setCategories(loaded.categories);
        setRoles(loaded.roles);
        setVacancies(loaded.vacancies);
        setStatus(loaded.status);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError('No se pudo cargar el proyecto.');
        showError('No se pudo cargar el proyecto', error);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [projectId, repository, showError]);

  const toggleCategory = (category: string) => {
    setCategories((current) => {
      if (!current.includes(category)) return [...current, category];
      if (current.length === 1) return current;
      return current.filter((value) => value !== category);
    });
  };

  const addRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed || roles.includes(trimmed)) return;
    setRoles((current) => [...current, trimmed]);
    setRoleInput('');
  };

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle) {
      showError('Campo obligatorio', 'Por favor ingresa el título del proyecto');
      return;
    }
    if (!cleanDescription) {
      showError('Campo obligatorio', 'Por favor ingresa una breve descripción');
      return;
    }
    if (!categories.length) {
      showError('Categoría requerida', 'Selecciona al menos una categoría');
      return;
    }
    if (!roles.length) {
      showError('Roles requeridos', 'Agrega al menos un rol que busques en tu equipo');
      return;
    }

    setSaving(true);
    try {
      await repository.updateProject({
        projectId,
        title: cleanTitle,
        description: cleanDescription,
        vision: vision.trim() || cleanDescription,
        vacancies,
        status,
        categories,
        roles,
        imageUrl: imageUrl.trim(),
      });
      showSuccess('Proyecto actualizado', `Los cambios en "${cleanTitle}" se guardaron correctamente.`);
      navigation.goBack();
    } catch (error) {
      showError('No se pudo actualizar', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
            <Text style={styles.title}>Editar Proyecto</Text>
          </View>

          {loading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !project ? (
            <View style={{ marginTop: 24 }}>
              <EmptyState
                icon="cloud-off-outline"
                title={loadError ?? 'Proyecto no disponible'}
                message="Revisa tu conexión e inténtalo de nuevo."
              />
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Información General</Text>
              <FormCard>
                <View style={{ gap: 16 }}>
                  <AppTextInput
                    label="Título del proyecto *"
                    icon="lightbulb-outline"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                  />
                  <AppTextInput
                    label="Descripción corta *"
                    icon="note-outline"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={2}
                    style={styles.input}
                  />
                  <AppTextInput
                    label="Visión del proyecto"
                    icon="eye-outline"
                    value={vision}
                    onChangeText={setVision}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                  />
                </View>
              </FormCard>

              <Text style={styles.sectionTitle}>Categorías</Text>
              <FormCard>
                <Text style={styles.helperText}>Selecciona una o más áreas afines:</Text>
                <View style={styles.wrap}>
                  {AVAILABLE_CATEGORIES.map((category) => {
                    const selected = categories.includes(category);
                    return (
                      <Pressable
                        key={category}
                        onPress={() => toggleCategory(category)}
                        style={[styles.filterChip, selected && styles.filterChipActive]}
                      >
                        {selected ? (
                          <MaterialCommunityIcons
                            name="check"
                            size={14}
                            color={colors.primary}
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.filterChipText,
                            selected && { color: colors.primary, fontWeight: '700' },
                          ]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </FormCard>

              <Text style={styles.sectionTitle}>Roles que buscas</Text>
              <FormCard>
                <View style={styles.roleInputRow}>
                  <View style={{ flex: 1 }}>
                    <AppTextInput
                      label="Nombre del rol"
                      icon="account-plus-outline"
                      value={roleInput}
                      onChangeText={setRoleInput}
                      onSubmitEditing={addRole}
                      style={styles.input}
                    />
                  </View>
                  <Pressable onPress={addRole} style={styles.addRoleButton}>
                    <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
                  </Pressable>
                </View>
                {roles.length === 0 ? (
                  <Text style={styles.helperText}>Aún no has agregado roles.</Text>
                ) : (
                  <View style={styles.wrap}>
                    {roles.map((role) => (
                      <View key={role} style={styles.roleChip}>
                        <Text style={styles.roleChipText}>{role}</Text>
                        <Pressable
                          hitSlop={6}
                          onPress={() =>
                            setRoles((current) =>
                              current.filter((value) => value !== role),
                            )
                          }
                        >
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
              </FormCard>

              <Text style={styles.sectionTitle}>Capacidad y estado</Text>
              <FormCard>
                <View style={styles.vacancyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vacancyTitle}>Vacantes disponibles</Text>
                    <Text style={styles.vacancyHint}>Colaboradores buscados</Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => setVacancies((value) => Math.max(1, value - 1))}
                      style={styles.stepButton}
                    >
                      <MaterialCommunityIcons name="minus" size={18} color={colors.textSoft} />
                    </Pressable>
                    <Text style={styles.stepValue}>{vacancies}</Text>
                    <Pressable
                      onPress={() => setVacancies((value) => Math.min(20, value + 1))}
                      style={styles.stepButton}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={colors.textSoft} />
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.statusLabel}>Estado del proyecto</Text>
                <View style={styles.wrap}>
                  {(['recruiting', 'active', 'completed'] as CreatedProjectStatus[]).map(
                    (value) => {
                      const selected = status === value;
                      return (
                        <Pressable
                          key={value}
                          onPress={() => setStatus(value)}
                          style={[styles.filterChip, selected && styles.filterChipActive]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selected && {
                                color: colors.primary,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {CREATED_PROJECT_STATUS_LABEL[value]}
                          </Text>
                        </Pressable>
                      );
                    },
                  )}
                </View>
              </FormCard>

              <Text style={styles.sectionTitle}>Imagen (URL)</Text>
              <FormCard>
                <AppTextInput
                  label="URL de la imagen de portada"
                  placeholder="https://..."
                  icon="image-outline"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                  style={styles.input}
                />
              </FormCard>

              <GradientButton
                label="Guardar cambios"
                onPress={save}
                loading={saving}
                style={{ marginTop: 32 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.formCard}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textSoft },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    ...cardShadow,
  },
  input: { backgroundColor: colors.inputFill },
  helperText: { fontSize: 13, color: colors.muted, marginTop: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chipBg,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterChipText: { fontSize: 13, color: colors.body },
  roleInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addRoleButton: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  roleChipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  vacancyRow: { flexDirection: 'row', alignItems: 'center' },
  vacancyTitle: { fontSize: 15, fontWeight: '600', color: colors.textSoft },
  vacancyHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  statusLabel: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSoft,
  },
});
