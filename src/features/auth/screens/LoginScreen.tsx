import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
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
import { GradientButton } from '@/src/ui/components';
import { useFeedback } from '@/src/ui/feedback';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { showError, showSuccess } = useFeedback();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = 'Ingresa tu correo';
    else if (!email.includes('@') || !email.includes('.')) {
      nextErrors.email = 'Ingresa un correo válido';
    }
    if (!password) nextErrors.password = 'Ingresa tu contraseña';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const session = await login(email, password);
      showSuccess('Bienvenido', `Sesión iniciada como ${session.name || session.email}`);
    } catch (error) {
      showError('Error al iniciar sesión', error);
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
          <View style={styles.logoTile}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MaterialCommunityIcons name="hub" size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>¡Hola de nuevo!</Text>
          <Text style={styles.subtitle}>
            Ingresa a tu cuenta para continuar explorando y colaborando
          </Text>

          <View style={{ marginTop: 36, gap: 16 }}>
            <TextInput
              mode="outlined"
              label="Correo institucional o personal"
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
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>

          <GradientButton
            label="Iniciar Sesión"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 24 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Regístrate aquí</Text>
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
    paddingVertical: 24,
  },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
  input: { backgroundColor: colors.white },
  error: { color: colors.danger, fontSize: 12, marginTop: -8, marginLeft: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: colors.muted },
  link: { color: colors.primary, fontWeight: '700' },
});
