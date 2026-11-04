import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { dateOnly, relativeDate, shortDate } from '@/src/core/date-labels';
import { colors } from '@/src/core/theme/colors';

export function DateField({
  label,
  value,
  onChange,
  allowClear = false,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());

  const openPicker = () => {
    setTemp(value ?? new Date());
    setOpen(true);
  };

  return (
    <View>
      <Pressable onPress={openPicker} style={styles.field}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={value ? styles.value : styles.placeholder}>
            {value
              ? `${shortDate(value)} ${value.getFullYear()} · ${relativeDate(value)}`
              : 'Sin fecha'}
          </Text>
        </View>
        {allowClear && value ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setOpen(false);
              onChange(null);
            }}
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.subtle} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.subtle} />
        )}
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={temp}
          mode="date"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(dateOnly(date));
          }}
        />
      ) : null}

      {open && Platform.OS !== 'android' ? (
        <View style={styles.inlinePicker}>
          <DateTimePicker
            value={temp}
            mode="date"
            display="spinner"
            onChange={(_, date) => date && setTemp(date)}
          />
          <View style={styles.inlineActions}>
            <Button onPress={() => setOpen(false)} textColor={colors.muted}>
              Cancelar
            </Button>
            <Button
              onPress={() => {
                onChange(dateOnly(temp));
                setOpen(false);
              }}
              textColor={colors.primary}
            >
              Listo
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: { fontSize: 12, color: colors.muted },
  value: { fontSize: 14, color: colors.textSoft, marginTop: 1 },
  placeholder: { fontSize: 14, color: colors.subtle, marginTop: 1 },
  inlinePicker: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
  },
  inlineActions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
