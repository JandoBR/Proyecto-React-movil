import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
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
import { TextInput } from 'react-native-paper';

import { colors } from '@/src/core/theme/colors';
import { useAuth } from '@/src/features/auth/AuthContext';
import { RootStackParamList } from '@/src/navigation/types';
import { CircleIconButton, GradientButton } from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { showError, showSuccess } = useFeedback();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const submit = async () => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Ingresa tu nombre completo';
    if (!email.trim()) next.email = 'Ingresa tu correo';
    else if (!email.includes('@') || !email.includes('.')) {
      next.email = 'Ingresa un correo válido';
    }
    if (!password) next.password = 'Ingresa una contraseña';
    else if (password.length < 8) next.password = 'Mínimo 8 caracteres';
    else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$_-]/.test(password)
    ) {
      next.password =
        'Requiere mayúscula, minúscula, número y símbolo (!, @, #, $, _, -)';
    }
    if (confirm !== password) next.confirm = 'Las contraseñas no coinciden';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register(email, password, name);
      showSuccess('Cuenta creada', `Bienvenido a Nexus, ${name.trim()}`);
    } catch (error) {
      showError('Error al registrarse', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignSelf: 'flex-start' }}>
            <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>

          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a la comunidad de innovadores y colaboradores
          </Text>

          <View style={{ marginTop: 30, gap: 16 }}>
            <View>
              <TextInput
                mode="outlined"
                label="Nombre completo"
                placeholder="Ej. Laura Martínez"
                value={name}
                onChangeText={setName}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
                error={!!errors.name}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  />
                }
              />
              {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
            </View>

            <View>
              <TextInput
                mode="outlined"
                label="Correo electrónico"
                placeholder="ejemplo@uninorte.edu.co"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
                error={!!errors.email}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  />
                }
              />
              {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
            </View>

            <View>
              <TextInput
                mode="outlined"
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
                error={!!errors.password}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons
                        name="lock-outline"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  />
                }
                right={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons
                        name={secure ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.muted}
                      />
                    )}
                    onPress={() => setSecure((value) => !value)}
                  />
                }
              />
              <Text style={styles.helper}>
                Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo
                (!@#$_)
              </Text>
              {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
            </View>

            <View>
              <TextInput
                mode="outlined"
                label="Confirmar contraseña"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={secure}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                style={styles.input}
                error={!!errors.confirm}
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons
                        name="lock-check-outline"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  />
                }
              />
              {errors.confirm ? (
                <Text style={styles.error}>{errors.confirm}</Text>
              ) : null}
            </View>
          </View>

          <GradientButton
            label="Crear Cuenta"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 28 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Inicia sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  title: { marginTop: 20, fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.muted },
  input: { backgroundColor: colors.white },
  helper: { fontSize: 12, color: colors.subtle, marginTop: 6, marginLeft: 4 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.muted },
  link: { color: colors.primary, fontWeight: '700' },
});
