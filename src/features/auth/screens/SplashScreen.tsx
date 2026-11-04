import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { colors } from '@/src/core/theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logo}
      >
        <MaterialCommunityIcons name="hub" size={50} color={colors.white} />
      </LinearGradient>
      <Text style={styles.title}>NEXUS</Text>
      <Text style={styles.subtitle}>Conectando talento y proyectos</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  title: {
    marginTop: 24,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#8D8D8D',
  },
});
