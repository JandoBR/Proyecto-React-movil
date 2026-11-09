import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { colors, cardShadow } from '@/src/core/theme/colors';
import { AccountTypePicker } from '@/src/features/auth/AccountTypePicker';
import { ACCOUNT_TYPE_LABEL, AccountType } from '@/src/features/auth/domain/models';
import { AccountTypeBadge } from '@/src/features/profile/AccountTypeBadge';
import { ProfileRepository } from '@/src/features/profile/data/ProfileRepository';
import { RootStackParamList } from '@/src/navigation/types';
import {
  AppTextInput,
  Avatar,
  CircleIconButton,
  GradientButton,
  SectionLabel,
} from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProfileRepository>(TOKENS.ProfileRepo),
    [di],
  );
  const { showSuccess, showError } = useFeedback();

  const [name, setName] = useState('');
  const [career, setCareer] = useState('');
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; career?: string }>({});

  useEffect(() => {
    repository
      .getProfile()
      .then((profile) => {
        setName(profile.name);
        setCareer(profile.career);
        setAccountType(profile.accountType);
        setAvatarUrl(profile.avatarUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [repository]);

  const save = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Ingresa tu nombre';
    if (!career.trim()) next.career = 'Ingresa tu carrera';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const accountTypeSaved = await repository.updateProfile({
        name: name.trim(),
        career: career.trim(),
        avatarUrl: avatarUrl.trim(),
        accountType,
      });
      if (accountTypeSaved) {
        showSuccess('Perfil actualizado', 'Tus cambios se guardaron con éxito');
      } else {
        showError(
          'Rol no guardado',
          'Se guardó el resto del perfil, pero la base de datos aún no acepta el rol.',
        );
      }
      navigation.goBack();
    } catch (error) {
      showError('Error al actualizar perfil', error);
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
            <Text style={styles.title}>Editar Perfil</Text>
          </View>

          {loading ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.preview}>
                {avatarUrl && !avatarError ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.previewImage}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Avatar size={92} />
                )}
                <Text style={styles.previewName}>{name || 'Tu nombre'}</Text>
                <Text style={styles.previewCareer}>{career || 'Tu carrera'}</Text>
                <AccountTypeBadge accountType={accountType} />
              </View>

              <View style={{ marginTop: 24 }}>
                <SectionLabel>Soy</SectionLabel>
              </View>
              <View style={styles.formCard}>
                <AccountTypePicker
                  value={accountType}
                  onChange={(value) => {
                    // Keep the career in step while it is still just the old label.
                    const labels = Object.values(ACCOUNT_TYPE_LABEL);
                    if (!career.trim() || labels.includes(career.trim())) {
                      setCareer(ACCOUNT_TYPE_LABEL[value]);
                    }
                    setAccountType(value);
                  }}
                />
              </View>

              <View style={{ marginTop: 24 }}>
                <SectionLabel>Información personal</SectionLabel>
              </View>
              <View style={styles.formCard}>
                <View style={{ gap: 16 }}>
                  <AppTextInput
                    label="Nombre completo"
                    placeholder="Ej. Laura Martínez"
                    icon="account-outline"
                    value={name}
                    onChangeText={setName}
                    error={!!errors.name}
                    style={styles.input}
                  />
                  <AppTextInput
                    label="Carrera o especialidad"
                    placeholder="Ej. Ingeniería de Sistemas"
                    icon="school-outline"
                    value={career}
                    onChangeText={setCareer}
                    error={!!errors.career}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={{ marginTop: 24 }}>
                <SectionLabel>Foto de perfil</SectionLabel>
              </View>
              <View style={styles.formCard}>
                <AppTextInput
                  label="URL de la imagen"
                  placeholder="https://..."
                  icon="link"
                  value={avatarUrl}
                  onChangeText={(value) => {
                    setAvatarUrl(value);
                    setAvatarError(false);
                  }}
                  autoCapitalize="none"
                  style={styles.input}
                  right={
                    avatarUrl ? (
                      <TextInput.Icon
                        icon={() => (
                          <MaterialCommunityIcons
                            name="close"
                            size={18}
                            color={colors.subtle}
                          />
                        )}
                        onPress={() => {
                          setAvatarUrl('');
                          setAvatarError(false);
                        }}
                      />
                    ) : undefined
                  }
                />
                <View style={styles.hintRow}>
                  <MaterialCommunityIcons
                    name={avatarError ? 'alert-circle-outline' : 'information-outline'}
                    size={16}
                    color={avatarError ? colors.red : colors.subtle}
                  />
                  <Text
                    style={[
                      styles.hintText,
                      avatarError && { color: colors.red },
                    ]}
                  >
                    {avatarError
                      ? 'No pudimos cargar la imagen. Revisa que el enlace sea público y directo.'
                      : 'Pega el enlace directo a una imagen. Verás la vista previa arriba.'}
                  </Text>
                </View>
              </View>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textSoft },
  preview: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    ...cardShadow,
  },
  previewImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.avatarBg,
  },
  previewName: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textSoft,
  },
  previewCareer: { marginTop: 4, fontSize: 14, color: colors.muted },
  formCard: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    ...cardShadow,
  },
  input: { backgroundColor: colors.inputFill },
  hintRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  hintText: { flex: 1, fontSize: 12.5, lineHeight: 17, color: colors.subtle },
});
