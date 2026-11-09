import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/core/theme/colors';
import { ACCOUNT_TYPE_LABEL, AccountType } from '@/src/features/auth/domain/models';

/** Etiqueta «Estudiante» / «Profesor» bajo el nombre del perfil. */
export function AccountTypeBadge({ accountType }: { accountType: AccountType | null }) {
  if (!accountType) return null;
  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons
        name={accountType === 'teacher' ? 'human-male-board' : 'school-outline'}
        size={14}
        color={colors.primary}
      />
      <Text style={styles.text}>{ACCOUNT_TYPE_LABEL[accountType]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,112,67,0.12)',
  },
  text: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
