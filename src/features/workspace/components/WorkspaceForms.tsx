import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Appbar } from 'react-native-paper';

import { colors } from '@/src/core/theme/colors';
import { DateField } from '@/src/ui/date-field';
import { AppTextInput, GradientButton } from '@/src/ui/components';
import {
  EVENT_KIND_LABEL,
  ProjectEventKind,
  WorkspaceMember,
} from '../domain/models';

function SheetFrame({
  visible,
  title,
  icon,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={{ flex: 1, width: '100%' }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Appbar.Action
                icon="close"
                onPress={onClose}
                size={20}
                testID="workspace-form-close"
              />
            </View>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function TaskFormModal({
  visible,
  members,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  members: WorkspaceMember[];
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string;
    assignees: WorkspaceMember[];
    dueDate: Date | null;
  }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<WorkspaceMember[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setDescription('');
    setAssignees([]);
    setDueDate(null);
    setSaving(false);
    setShowError(false);
    setSaveError(false);
  }, [visible]);

  const save = async () => {
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    setSaving(true);
    setSaveError(false);
    const ok = await onSubmit({ title, description, assignees, dueDate });
    setSaving(false);
    if (ok) onClose();
    else setSaveError(true);
  };

  return (
    <SheetFrame
      visible={visible}
      title="Nueva tarea"
      icon="checkbox-marked-outline"
      onClose={onClose}
    >
      <View style={{ gap: 14 }}>
        <AppTextInput
          label="Título *"
          placeholder="Ej. Diseñar el prototipo en Figma"
          icon="checkbox-marked-outline"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            if (showError) setShowError(false);
          }}
          error={showError}
          style={styles.input}
        />
        <AppTextInput
          label="Descripción"
          placeholder="Detalles, enlaces o criterios de terminado"
          icon="note-outline"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          style={styles.input}
        />

        <Text style={styles.label}>Responsables</Text>
        <Text style={styles.hint}>Puedes elegir a más de una persona.</Text>
        <View style={styles.wrap}>
          <Pressable
            onPress={() => setAssignees([])}
            style={[styles.chip, !assignees.length && styles.chipActive]}
          >
            <Text style={[styles.chipText, !assignees.length && styles.chipTextActive]}>
              Sin asignar
            </Text>
          </Pressable>
          {members.map((member) => {
            const selected = assignees.some((item) => item.id === member.id);
            return (
              <Pressable
                key={member.id}
                testID={`assignee-${member.id}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  setAssignees((current) =>
                    selected
                      ? current.filter((item) => item.id !== member.id)
                      : [...current, member],
                  )
                }
                style={[styles.chip, styles.chipRow, selected && styles.chipActive]}
              >
                {selected ? (
                  <MaterialCommunityIcons name="check" size={14} color={colors.primary} />
                ) : null}
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {member.role ? `${member.name} · ${member.role}` : member.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <DateField label="Fecha límite" value={dueDate} onChange={setDueDate} allowClear />

        {saveError ? (
          <Text style={styles.saveError}>
            No se pudo crear la tarea. Revisa tu conexión e inténtalo de nuevo.
          </Text>
        ) : null}

        <GradientButton
          label="Crear tarea"
          icon="check"
          onPress={save}
          loading={saving}
          style={{ marginTop: 10 }}
        />
      </View>
    </SheetFrame>
  );
}

export function EventFormModal({
  visible,
  initialDate,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initialDate: Date;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string;
    date: Date;
    kind: ProjectEventKind;
  }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(initialDate);
  const [kind, setKind] = useState<ProjectEventKind>('milestone');
  const [saving, setSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setDescription('');
    setDate(initialDate);
    setKind('milestone');
    setSaving(false);
    setShowError(false);
    setSaveError(false);
  }, [visible, initialDate]);

  const save = async () => {
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    setSaving(true);
    setSaveError(false);
    const ok = await onSubmit({ title, description, date, kind });
    setSaving(false);
    if (ok) onClose();
    else setSaveError(true);
  };

  return (
    <SheetFrame
      visible={visible}
      title="Nueva fecha importante"
      icon="calendar-plus"
      onClose={onClose}
    >
      <View style={{ gap: 14 }}>
        <View style={styles.wrap}>
          {(Object.keys(EVENT_KIND_LABEL) as ProjectEventKind[]).map((value) => {
            const selected = kind === value;
            return (
              <Pressable
                key={value}
                onPress={() => setKind(value)}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {EVENT_KIND_LABEL[value]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppTextInput
          label="Título *"
          placeholder="Ej. Entrega del MVP"
          icon="flag-outline"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            if (showError) setShowError(false);
          }}
          error={showError}
          style={styles.input}
        />
        <AppTextInput
          label="Nota"
          placeholder="Ej. Presentación en el aula 3-201"
          icon="note-outline"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
        <DateField label="Fecha" value={date} onChange={(value) => value && setDate(value)} />

        {saveError ? (
          <Text style={styles.saveError}>
            No se pudo guardar la fecha. Revisa tu conexión e inténtalo de nuevo.
          </Text>
        ) : null}

        <GradientButton
          label="Guardar fecha"
          icon="check"
          onPress={save}
          loading={saving}
          style={{ marginTop: 10 }}
        />
      </View>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: colors.textSoft },
  input: { backgroundColor: colors.inputFill },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  hint: { fontSize: 12, color: colors.subtle, marginTop: -10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, color: colors.body },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  saveError: {
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.red,
    textAlign: 'center',
  },
});
