import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/core/theme/colors';
import { ACCOUNT_TYPE_LABEL, AccountType } from './domain/models';

export const ACCOUNT_TYPE_ICON: Record<
  AccountType,
  React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  student: 'school-outline',
  teacher: 'human-male-board',
};

/** Dos botones para elegir entre «Estudiante» y «Profesor». */
export function AccountTypePicker({
  value,
  onChange,
  error = false,
}: {
  value: AccountType | null;
  onChange: (value: AccountType) => void;
  error?: boolean;
}) {
  return (
    <View style={styles.row}>
      {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            testID={`account-type-${option}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[
              styles.option,
              selected && styles.optionActive,
              error && styles.optionError,
            ]}
          >
            <MaterialCommunityIcons
              name={ACCOUNT_TYPE_ICON[option]}
              size={22}
              color={selected ? colors.primary : colors.muted}
            />
            <Text style={[styles.text, selected && styles.textActive]}>
              {ACCOUNT_TYPE_LABEL[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,112,67,0.12)',
  },
  optionError: { borderColor: colors.danger },
  text: { fontSize: 15, color: colors.body },
  textActive: { color: colors.primary, fontWeight: '700' },
});
