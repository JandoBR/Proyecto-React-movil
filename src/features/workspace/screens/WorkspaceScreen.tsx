import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import {
  dateOnly,
  daysBetween,
  isSameDay,
  relativeDate,
  shortDate,
  shortWithTime,
} from '@/src/core/date-labels';
import { cardShadow, colors, gradient } from '@/src/core/theme/colors';
import { WorkspaceRepository } from '@/src/features/workspace/data/WorkspaceRepository';
import {
  CalendarEntry,
  EVENT_KIND_LABEL,
  ProjectEvent,
  ProjectEventKind,
  ProjectTask,
  WorkspaceMember,
  isTaskOverdue,
} from '@/src/features/workspace/domain/models';
import { RootStackParamList } from '@/src/navigation/types';
import {
  Avatar,
  Card,
  CircleIconButton,
  EmptyState,
  SegmentedTabs,
  SectionLabel,
} from '@/src/ui/components';
import { useDialog } from '@/src/ui/dialogs';
import { useFeedback } from '@/src/ui/feedback';
import { DayMarkers, MonthCalendar } from '@/src/ui/month-calendar';
import { EventFormModal, TaskFormModal } from '../components/WorkspaceForms';

type Props = NativeStackScreenProps<RootStackParamList, 'Workspace'>;
type Tab = 'tasks' | 'calendar' | 'log';

function sortedByDue(tasks: ProjectTask[]): ProjectTask[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return a.title.localeCompare(b.title);
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

export default function WorkspaceScreen({ navigation, route }: Props) {
  const { projectId, projectTitle, isOwner } = route.params;
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<WorkspaceRepository>(TOKENS.WorkspaceRepo),
    [di],
  );
  const { confirm } = useDialog();
  const { showError } = useFeedback();
  const insets = useSafeAreaInsets();

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('tasks');
  const [selectedDay, setSelectedDay] = useState(() => dateOnly(new Date()));
  const [focusedMonth, setFocusedMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [form, setForm] = useState<'task' | 'event' | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextTasks, nextEvents, nextMembers] = await Promise.all([
        repository.getTasks(projectId),
        repository.getEvents(projectId),
        repository.getMembers(projectId),
      ]);
      setTasks(nextTasks);
      setEvents(nextEvents);
      setMembers(nextMembers);
    } catch {
      setError('No se pudo cargar el espacio de trabajo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [repository, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const doneCount = tasks.filter((task) => task.isDone).length;
  const totalCount = tasks.length;
  const progress = totalCount ? doneCount / totalCount : 0;
  const overdue = useMemo(
    () => sortedByDue(tasks.filter((task) => isTaskOverdue(task))),
    [tasks],
  );
  const upcoming = useMemo(
    () => sortedByDue(tasks.filter((task) => !task.isDone && !isTaskOverdue(task))),
    [tasks],
  );
  const completedLog = useMemo(() => {
    return tasks
      .filter((task) => task.isDone)
      .sort((a, b) => {
        if (!a.completedAt && !b.completedAt) return 0;
        if (!a.completedAt) return 1;
        if (!b.completedAt) return -1;
        return b.completedAt.getTime() - a.completedAt.getTime();
      });
  }, [tasks]);
  const nextDeadline = upcoming.find((task) => !!task.dueDate) ?? null;

  const entriesFor = (day: Date): CalendarEntry[] => [
    ...events
      .filter((event) => isSameDay(event.date, day))
      .map((event) => ({ date: event.date, title: event.title, event })),
    ...tasks
      .filter((task) => task.dueDate && isSameDay(task.dueDate, day))
      .map((task) => ({ date: task.dueDate as Date, title: task.title, task })),
  ];

  const upcomingEntries = (limit = 5): CalendarEntry[] => {
    const today = dateOnly(new Date());
    const entries: CalendarEntry[] = [
      ...events
        .filter((event) => event.date.getTime() >= today.getTime())
        .map((event) => ({ date: event.date, title: event.title, event })),
      ...tasks
        .filter(
          (task) =>
            !task.isDone &&
            task.dueDate &&
            task.dueDate.getTime() >= today.getTime(),
        )
        .map((task) => ({
          date: task.dueDate as Date,
          title: task.title,
          task,
        })),
    ];
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    return entries.slice(0, limit);
  };

  const currentUserId = repository.currentUserId;

  const toggleTask = async (task: ProjectTask) => {
    const index = tasks.findIndex((item) => item.id === task.id);
    if (index < 0) return;
    const previous = tasks[index];
    const updated: ProjectTask = {
      ...previous,
      isDone: !previous.isDone,
      completedAt: previous.isDone ? null : new Date(),
      completedByName: previous.isDone ? '' : repository.currentUserName,
    };
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? updated : item)),
    );
    try {
      await repository.updateTask(updated);
    } catch {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? previous : item)),
      );
      showError('No se pudo actualizar la tarea', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const deleteTask = async (task: ProjectTask) => {
    const ok = await confirm({
      title: 'Eliminar tarea',
      message: `¿Eliminar "${task.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await repository.deleteTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch {
      showError('No se pudo eliminar la tarea', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const deleteEvent = async (event: ProjectEvent) => {
    const ok = await confirm({
      title: 'Eliminar fecha',
      message: `¿Eliminar "${event.title}" del calendario?`,
      confirmText: 'Sí, eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await repository.deleteEvent(event.id);
      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch {
      showError('No se pudo eliminar la fecha', 'Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const canDeleteTask = (task: ProjectTask) =>
    isOwner || (!!task.createdById && task.createdById === currentUserId);
  const canDeleteEvent = (event: ProjectEvent) =>
    isOwner || (!!event.createdById && event.createdById === currentUserId);

  const openChat = () => navigation.navigate('ProjectChat', { projectId, projectTitle });

  const markersFor = (day: Date): DayMarkers => {
    const entries = entriesFor(day);
    return {
      hasEvent: entries.some((entry) => !entry.task),
      hasDeadline: entries.some((entry) => !!entry.task),
    };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <CircleIconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.headerSubtitle}>Espacio de trabajo</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {projectTitle}
            </Text>
          </View>
          {members.length ? <TeamStack members={members} /> : null}
          <View style={{ marginLeft: 10 }}>
            <CircleIconButton icon="chat-outline" onPress={openChat} />
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          {loading && !tasks.length && !events.length ? (
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <EmptyState
              icon="cloud-off-outline"
              title={error}
              message="Desliza hacia abajo para volver a intentarlo."
            />
          ) : (
            <>
              <ProgressCard
                progress={progress}
                doneCount={doneCount}
                totalCount={totalCount}
                overdueCount={overdue.length}
                nextDeadline={nextDeadline}
              />

              <Pressable onPress={openChat} style={styles.chatCard} testID="open-chat">
                <View style={styles.chatIcon}>
                  <MaterialCommunityIcons
                    name="chat-processing-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatTitle}>Chat del equipo</Text>
                  <Text style={styles.chatSubtitle}>
                    Habla con los integrantes del proyecto
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.subtle} />
              </Pressable>

              <View style={{ marginTop: 22 }}>
                <SegmentedTabs
                  segments={[
                    { label: 'Tareas', value: 'tasks' },
                    { label: 'Calendario', value: 'calendar' },
                    { label: 'Registro', value: 'log' },
                  ]}
                  selected={tab}
                  onSelect={setTab}
                />
              </View>

              <View style={{ marginTop: 20 }}>
                {tab === 'tasks' ? (
                  <>
                    {overdue.length ? (
                      <>
                        <SectionHeader label="VENCIDAS" count={overdue.length} danger />
                        <View style={{ height: 10 }} />
                        {overdue.map((task) => (
                          <TaskTile
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(task)}
                            onDelete={
                              canDeleteTask(task) ? () => deleteTask(task) : undefined
                            }
                          />
                        ))}
                        <View style={{ height: 12 }} />
                      </>
                    ) : null}

                    {upcoming.length ? (
                      <>
                        <SectionHeader label="PENDIENTES" count={upcoming.length} />
                        <View style={{ height: 10 }} />
                        {upcoming.map((task) => (
                          <TaskTile
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(task)}
                            onDelete={
                              canDeleteTask(task) ? () => deleteTask(task) : undefined
                            }
                          />
                        ))}
                      </>
                    ) : null}

                    {!overdue.length && !upcoming.length ? (
                      <EmptyState
                        icon={doneCount ? 'party-popper' : 'playlist-check'}
                        title={
                          doneCount
                            ? '¡No quedan tareas pendientes!'
                            : 'Aún no hay tareas'
                        }
                        message={
                          doneCount
                            ? 'Revisa lo completado en la pestaña Registro.'
                            : 'Divide el proyecto en tareas con responsable y fecha límite para seguir el avance del equipo.'
                        }
                      />
                    ) : null}

                    {doneCount ? (
                      <Pressable onPress={() => setTab('log')} style={styles.logLink}>
                        <MaterialCommunityIcons
                          name="history"
                          size={18}
                          color={colors.primary}
                        />
                        <Text style={styles.logLinkText}>
                          {doneCount === 1
                            ? 'Ver 1 tarea completada'
                            : `Ver ${doneCount} tareas completadas`}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}

                {tab === 'calendar' ? (
                  <>
                    <MonthCalendar
                      month={focusedMonth}
                      selectedDay={selectedDay}
                      markersFor={markersFor}
                      onDaySelected={(day) => {
                        setSelectedDay(dateOnly(day));
                        setFocusedMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                      }}
                      onPreviousMonth={() =>
                        setFocusedMonth(
                          (current) =>
                            new Date(current.getFullYear(), current.getMonth() - 1, 1),
                        )
                      }
                      onNextMonth={() =>
                        setFocusedMonth(
                          (current) =>
                            new Date(current.getFullYear(), current.getMonth() + 1, 1),
                        )
                      }
                    />

                    <View style={{ marginTop: 22 }}>
                      <SectionLabel>
                        {isSameDay(selectedDay, new Date())
                          ? `HOY · ${shortDate(selectedDay).toUpperCase()}`
                          : shortDate(selectedDay).toUpperCase()}
                      </SectionLabel>
                    </View>
                    <View style={{ marginTop: 10 }}>
                      {entriesFor(selectedDay).length ? (
                        entriesFor(selectedDay).map((entry, index) => (
                          <CalendarEntryTile
                            key={`${entry.title}-${index}`}
                            entry={entry}
                            onDelete={
                              entry.event && canDeleteEvent(entry.event)
                                ? () => deleteEvent(entry.event as ProjectEvent)
                                : undefined
                            }
                          />
                        ))
                      ) : (
                        <InlineHint
                          text="Nada programado este día."
                          actionLabel="Agregar fecha"
                          onAction={() => setForm('event')}
                        />
                      )}
                    </View>

                    <View style={{ marginTop: 18, marginBottom: 10 }}>
                      <SectionLabel>Próximas fechas</SectionLabel>
                    </View>
                    {upcomingEntries().length ? (
                      upcomingEntries().map((entry, index) => (
                        <CalendarEntryTile
                          key={`${entry.title}-upcoming-${index}`}
                          entry={entry}
                          showDate
                          onDelete={
                            entry.event && canDeleteEvent(entry.event)
                              ? () => deleteEvent(entry.event as ProjectEvent)
                              : undefined
                          }
                        />
                      ))
                    ) : (
                      <InlineHint text="No hay hitos ni deadlines próximos." />
                    )}
                  </>
                ) : null}

                {tab === 'log' ? (
                  completedLog.length ? (
                    <>
                      <SectionHeader label="TAREAS REALIZADAS" count={completedLog.length} />
                      <View style={{ marginTop: 14 }}>
                        {completedLog.map((task, index) => (
                          <LogItem
                            key={task.id}
                            task={task}
                            isLast={index === completedLog.length - 1}
                            onReopen={() => toggleTask(task)}
                          />
                        ))}
                      </View>
                    </>
                  ) : (
                    <EmptyState
                      icon="history"
                      title="Todavía no hay tareas completadas"
                      message="Cada tarea que el equipo marque como hecha quedará registrada aquí, con quién la terminó y cuándo."
                    />
                  )
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {tab !== 'log' ? (
        <Pressable
          onPress={() => setForm(tab === 'tasks' ? 'task' : 'event')}
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
        >
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
            <Text style={styles.fabText}>
              {tab === 'tasks' ? 'Nueva tarea' : 'Nueva fecha'}
            </Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      <TaskFormModal
        visible={form === 'task'}
        members={members}
        onClose={() => setForm(null)}
        onSubmit={async ({ title, description, assignees, dueDate }) => {
          if (!title.trim()) return false;
          try {
            const created = await repository.createTask({
              id: '',
              projectId,
              title: title.trim(),
              description: description.trim(),
              assigneeIds: assignees.map((member) => member.id),
              assigneeNames: assignees.map((member) => member.name),
              dueDate: dueDate ? dateOnly(dueDate) : null,
              isDone: false,
              completedAt: null,
              completedByName: '',
              createdById: currentUserId,
            });
            setTasks((current) => [...current, created]);
            return true;
          } catch (formError) {
            showError('No se pudo crear la tarea', formError);
            return false;
          }
        }}
      />

      <EventFormModal
        visible={form === 'event'}
        initialDate={selectedDay}
        onClose={() => setForm(null)}
        onSubmit={async ({ title, description, date, kind }) => {
          if (!title.trim()) return false;
          try {
            const created = await repository.createEvent({
              id: '',
              projectId,
              title: title.trim(),
              description: description.trim(),
              date: dateOnly(date),
              kind,
              createdById: currentUserId,
            });
            setEvents((current) => [...current, created]);
            setSelectedDay(dateOnly(date));
            setFocusedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            return true;
          } catch (formError) {
            showError('No se pudo guardar la fecha', formError);
            return false;
          }
        }}
      />
    </SafeAreaView>
  );
}

function ProgressCard({
  progress,
  doneCount,
  totalCount,
  overdueCount,
  nextDeadline,
}: {
  progress: number;
  doneCount: number;
  totalCount: number;
  overdueCount: number;
  nextDeadline: ProjectTask | null;
}) {
  const percent = Math.round(progress * 100);
  const finished = totalCount > 0 && doneCount === totalCount;
  return (
    <LinearGradient
      colors={[...gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.progressCard}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.progressLabel}>Progreso del proyecto</Text>
          <Text style={styles.progressTitle}>
            {totalCount === 0
              ? 'Aún no hay tareas'
              : finished
                ? '¡Todas las tareas listas!'
                : `${doneCount} de ${totalCount} tareas completadas`}
          </Text>
        </View>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.progressPills}>
        <View style={styles.progressPill}>
          <MaterialCommunityIcons name="flag-outline" size={14} color={colors.white} />
          <Text style={styles.progressPillText}>
            {nextDeadline?.dueDate
              ? `Próximo: ${relativeDate(nextDeadline.dueDate)}`
              : 'Sin deadlines próximos'}
          </Text>
        </View>
        {overdueCount > 0 ? (
          <View style={[styles.progressPill, { backgroundColor: colors.white }]}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={14}
              color={colors.red}
            />
            <Text style={[styles.progressPillText, { color: colors.red }]}>
              {overdueCount === 1 ? '1 tarea vencida' : `${overdueCount} tareas vencidas`}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

function TeamStack({ members }: { members: WorkspaceMember[] }) {
  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((member, index) => (
        <View
          key={member.id}
          style={{
            marginLeft: index === 0 ? 0 : -8,
            borderWidth: 2,
            borderColor: colors.white,
            borderRadius: 17,
          }}
        >
          <Avatar uri={member.avatarUrl} size={30} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={styles.extraAvatar}>
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SectionHeader({
  label,
  count,
  danger = false,
}: {
  label: string;
  count: number;
  danger?: boolean;
}) {
  const color = danger ? colors.red : colors.subtle;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={[styles.sectionHeaderText, { color }]}>{label}</Text>
      <View style={[styles.countPill, { backgroundColor: `${color}1F` }]}>
        <Text style={[styles.countText, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

function TaskTile({
  task,
  onToggle,
  onDelete,
}: {
  task: ProjectTask;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const overdue = isTaskOverdue(task);
  const daysLeft = task.dueDate ? daysBetween(task.dueDate, new Date()) : 0;
  const dueForeground = task.isDone
    ? colors.green
    : daysLeft < 0
      ? colors.red
      : daysLeft <= 2
        ? colors.amber
        : colors.muted;
  const dueBackground = task.isDone
    ? colors.greenBg
    : daysLeft < 0
      ? colors.redBg
      : daysLeft <= 2
        ? colors.amberBg
        : colors.chipBg;

  return (
    <View
      style={[
        styles.taskCard,
        overdue && { borderWidth: 1.2, borderColor: '#F3C4C4' },
      ]}
    >
      <Pressable
        onPress={onToggle}
        style={styles.checkCircleWrap}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.isDone }}
        accessibilityLabel={task.isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {task.isDone ? (
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkCircle}
          >
            <MaterialCommunityIcons name="check" size={16} color={colors.white} />
          </LinearGradient>
        ) : (
          <View style={styles.checkCircleEmpty} />
        )}
      </Pressable>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={[
            styles.taskTitle,
            task.isDone && {
              color: colors.subtle,
              textDecorationLine: 'line-through',
            },
          ]}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        {task.assigneeNames.length || task.dueDate ? (
          <View style={styles.taskMetaRow}>
            {task.dueDate ? (
              <MetaChip
                icon={overdue ? 'alert-outline' : 'calendar-blank-outline'}
                label={
                  overdue
                    ? `Venció ${relativeDate(task.dueDate).toLowerCase()}`
                    : relativeDate(task.dueDate)
                }
                foreground={dueForeground}
                background={dueBackground}
              />
            ) : null}
            {task.assigneeNames.map((assigneeName, index) => (
              <MetaChip
                key={`${task.assigneeIds[index] ?? ''}-${index}`}
                icon="account-outline"
                label={assigneeName}
                foreground={colors.muted}
                background={colors.chipBg}
              />
            ))}
          </View>
        ) : null}
      </View>

      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8} style={{ padding: 4 }}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={colors.disabled}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function MetaChip({
  icon,
  label,
  foreground = colors.muted,
  background = colors.chipBg,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  foreground?: string;
  background?: string;
}) {
  return (
    <View style={[styles.metaChip, { backgroundColor: background }]}>
      <MaterialCommunityIcons name={icon} size={13} color={foreground} />
      <Text style={[styles.metaChipText, { color: foreground }]}>{label}</Text>
    </View>
  );
}

function InlineHint({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.inlineHint}>
      <Text style={styles.inlineHintText}>{text}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.inlineHintAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CalendarEntryTile({
  entry,
  showDate = false,
  onDelete,
}: {
  entry: CalendarEntry;
  showDate?: boolean;
  onDelete?: () => void;
}) {
  const task = entry.task;
  const event = entry.event;
  const isTask = !!task;
  const done = task?.isDone ?? false;
  const accent = isTask ? (done ? colors.green : colors.body) : colors.primary;
  const subtitle = isTask
    ? done
      ? 'Tarea completada'
      : task.assigneeNames.length
        ? `Deadline · ${task.assigneeNames.join(', ')}`
        : 'Deadline de tarea'
    : event?.description
      ? `${EVENT_KIND_LABEL[event.kind]} · ${event.description}`
      : EVENT_KIND_LABEL[event?.kind ?? 'other'];

  return (
    <View style={styles.entryCard}>
      {showDate ? (
        <View style={styles.entryDate}>
          <Text style={styles.entryDay}>{entry.date.getDate()}</Text>
          <Text style={styles.entryMonth}>
            {shortDate(entry.date).split(' ').pop()}
          </Text>
        </View>
      ) : null}
      <View style={[styles.entryIcon, { backgroundColor: `${accent}1F` }]}>
        <MaterialCommunityIcons
          name={
            isTask
              ? done
                ? 'check-circle'
                : 'checkbox-marked-circle-outline'
              : eventIcon(event?.kind)
          }
          size={20}
          color={accent}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={[
            styles.entryTitle,
            done && { textDecorationLine: 'line-through' },
          ]}
          numberOfLines={1}
        >
          {entry.title}
        </Text>
        <Text style={styles.entrySubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={colors.disabled}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function eventIcon(kind: ProjectEventKind | undefined) {
  switch (kind) {
    case 'milestone':
      return 'flag';
    case 'meeting':
      return 'account-group';
    case 'delivery':
      return 'package-variant-closed';
    default:
      return 'star-outline';
  }
}

function LogItem({
  task,
  isLast,
  onReopen,
}: {
  task: ProjectTask;
  isLast: boolean;
  onReopen: () => void;
}) {
  const who = task.completedByName || 'Alguien';
  const when = task.completedAt;
  const due = task.dueDate;
  const lateDays = when && due ? daysBetween(when, due) : 0;
  const timing = when
    ? shortWithTime(when)
    : 'Fecha no registrada';

  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ alignItems: 'center', width: 28 }}>
        <View style={styles.logDot}>
          <MaterialCommunityIcons name="check" size={16} color={colors.green} />
        </View>
        {!isLast ? <View style={styles.logLine} /> : null}
      </View>
      <View style={{ flex: 1, marginLeft: 12, paddingBottom: isLast ? 0 : 18 }}>
        <Card>
          <Text style={styles.logWho}>
            <Text style={{ fontWeight: '700' }}>{who}</Text> completó
          </Text>
          <Text style={styles.logTitle}>{task.title}</Text>
          <View style={styles.logMetaRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={colors.subtle}
            />
            <Text
              style={[
                styles.logMeta,
                { color: lateDays > 0 ? colors.amber : colors.subtle },
              ]}
            >
              {[
                timing,
                lateDays > 0
                  ? `${lateDays} ${lateDays === 1 ? 'día' : 'días'} tarde`
                  : due && when
                    ? 'a tiempo'
                    : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Pressable onPress={onReopen} style={{ marginLeft: 'auto' }}>
              <Text style={styles.reopen}>Reabrir</Text>
            </Pressable>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerSubtitle: { fontSize: 13, color: colors.subtle },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textSoft, marginTop: 2 },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.gradientEnd,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  progressLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  progressTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  progressPercent: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
    lineHeight: 38,
  },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 10, backgroundColor: colors.white, borderRadius: 10 },
  progressPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressPillText: { fontSize: 12, fontWeight: '700', color: colors.white },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  countPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: '800' },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  checkCircleWrap: { marginTop: 1 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleEmpty: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.body,
  },
  taskTitle: { fontSize: 15, fontWeight: '700', color: colors.textSoft },
  taskDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    ...cardShadow,
  },
  chatIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  chatTitle: { fontSize: 15, fontWeight: '700', color: colors.textSoft },
  chatSubtitle: { marginTop: 2, fontSize: 12.5, color: colors.muted },
  taskMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaChipText: { fontSize: 11.5, fontWeight: '600' },
  logLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 10,
  },
  logLinkText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  fab: { position: 'absolute', right: 20, bottom: 24 },
  fabGradient: {
    height: 52,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 6,
    shadowColor: colors.gradientEnd,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  fabText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  extraAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  extraText: { fontSize: 11, fontWeight: '800', color: colors.white },
  inlineHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inlineHintText: { flex: 1, fontSize: 13, color: colors.subtle },
  inlineHintAction: { fontSize: 13, fontWeight: '700', color: colors.primary },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  entryDate: { width: 44, alignItems: 'center' },
  entryDay: { fontSize: 18, fontWeight: '900', color: colors.textSoft },
  entryMonth: { fontSize: 11, fontWeight: '600', color: colors.subtle },
  entryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: { fontSize: 14, fontWeight: '700', color: colors.textSoft },
  entrySubtitle: { marginTop: 2, fontSize: 12, color: colors.subtle },
  logDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  logWho: { fontSize: 12.5, color: colors.muted },
  logTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSoft,
  },
  logMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  logMeta: { fontSize: 12, fontWeight: '500', flex: 1 },
  reopen: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
});
