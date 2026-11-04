import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useMemo, useState } from 'react';
import {
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
import { CreateRepository } from '@/src/features/create/data/CreateRepository';
import { TabParamList } from '@/src/navigation/types';
import { AppTextInput, GradientButton } from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = BottomTabScreenProps<TabParamList, 'Create'>;

const AVAILABLE_CATEGORIES = [
  'Tech',
  'Medio Ambiente',
  'Arte y Diseño',
  'Salud',
  'Investigación Académica',
  'Impacto Social',
  'Educación',
];

const DEFAULT_ROLES = ['Desarrollo Frontend', 'Diseño UI/UX'];

export default function CreateProjectScreen({ navigation }: Props) {
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<CreateRepository>(TOKENS.CreateRepo),
    [di],
  );
  const { showSuccess, showError } = useFeedback();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vision, setVision] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<string[]>(['Tech']);
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [roleInput, setRoleInput] = useState('');
  const [vacancies, setVacancies] = useState(2);
  const [loading, setLoading] = useState(false);

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

  const reset = () => {
    setTitle('');
    setDescription('');
    setVision('');
    setImageUrl('');
    setCategories(['Tech']);
    setRoles(DEFAULT_ROLES);
    setRoleInput('');
    setVacancies(2);
  };

  const submit = async () => {
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

    setLoading(true);
    try {
      await repository.createProject({
        title: cleanTitle,
        description: cleanDescription,
        vision: vision.trim() || cleanDescription,
        categories,
        roles,
        vacancies,
        imageUrl: imageUrl.trim() || null,
      });
      showSuccess(
        'Proyecto Publicado',
        `Tu proyecto "${cleanTitle}" está activo y abierto a postulaciones.`,
      );
      reset();
      navigation.navigate('Projects');
    } catch (error) {
      showError('Error al publicar proyecto', error);
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Nuevo Proyecto</Text>
          <Text style={styles.subtitle}>
            Publica tu iniciativa y encuentra los colaboradores idóneos
          </Text>

          <Text style={styles.sectionTitle}>Información General</Text>
          <FormCard>
            <View style={{ gap: 16 }}>
              <AppTextInput
                label="Título del proyecto *"
                placeholder="Ej. EcoCampus Sorter"
                icon="lightbulb-outline"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <AppTextInput
                label="Descripción corta *"
                placeholder="¿En qué consiste el proyecto en pocas palabras?"
                icon="note-outline"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                style={styles.input}
              />
              <AppTextInput
                label="Visión del proyecto"
                placeholder="¿Cuál es el impacto a largo plazo que buscas alcanzar?"
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
                  placeholder="Ej. UI/UX Designer"
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
            <View style={styles.wrap}>
              {roles.map((role) => (
                <View key={role} style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{role}</Text>
                  <Pressable
                    hitSlop={6}
                    onPress={() =>
                      setRoles((current) => current.filter((value) => value !== role))
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
          </FormCard>

          <Text style={styles.sectionTitle}>Capacidad del equipo</Text>
          <FormCard>
            <View style={styles.vacancyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.vacancyTitle}>Vacantes disponibles</Text>
                <Text style={styles.helperText}>Colaboradores buscados</Text>
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
            label="Publicar Proyecto"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 32 }}
          />
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
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.muted },
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
  helperText: { fontSize: 13, color: colors.muted, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,112,67,0.15)',
    borderColor: colors.primary,
  },
  filterChipText: { fontSize: 13, color: '#424242' },
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
    borderColor: '#FFAB91',
    backgroundColor: 'rgba(255,112,67,0.1)',
  },
  roleChipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  vacancyRow: { flexDirection: 'row', alignItems: 'center' },
  vacancyTitle: { fontSize: 15, fontWeight: '600', color: colors.textSoft },
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
});
