import { dateOnly, parseDate, toIsoDate } from '@/src/core/date-labels';

export type ProjectEventKind = 'milestone' | 'meeting' | 'delivery' | 'other';

export const EVENT_KIND_LABEL: Record<ProjectEventKind, string> = {
  milestone: 'Hito',
  meeting: 'Reunión',
  delivery: 'Entrega',
  other: 'Otro',
};

export function eventKindFrom(value: unknown): ProjectEventKind {
  if (value === 'milestone' || value === 'meeting' || value === 'delivery') {
    return value;
  }
  return 'other';
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: Date;
  kind: ProjectEventKind;
  createdById: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: Date | null;
  isDone: boolean;
  completedAt: Date | null;
  completedByName: string;
  createdById: string;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  isOwner: boolean;
}

export interface CalendarEntry {
  date: Date;
  title: string;
  event?: ProjectEvent;
  task?: ProjectTask;
}

export function taskFromJson(json: Record<string, any>): ProjectTask {
  return {
    id: String(json._id ?? json.id ?? ''),
    projectId: String(json.project_id ?? json.projectId ?? ''),
    title: String(json.title ?? 'Sin título'),
    description: String(json.description ?? ''),
    assigneeId: String(json.assignee_id ?? ''),
    assigneeName: String(json.assignee_name ?? ''),
    dueDate: parseDate(json.due_date),
    isDone: String(json.status ?? '') === 'done',
    completedAt: parseDate(json.completed_at),
    completedByName: String(json.completed_by_name ?? ''),
    createdById: String(json.created_by ?? ''),
  };
}

export function taskToJson(task: ProjectTask): Record<string, unknown> {
  return {
    project_id: task.projectId,
    title: task.title,
    description: task.description,
    assignee_id: task.assigneeId || null,
    assignee_name: task.assigneeName,
    due_date: task.dueDate ? toIsoDate(task.dueDate) : null,
    status: task.isDone ? 'done' : 'todo',
    completed_at: task.completedAt ? task.completedAt.toISOString() : null,
    completed_by_name: task.completedByName,
    created_by: task.createdById || null,
  };
}

export function eventFromJson(json: Record<string, any>): ProjectEvent {
  return {
    id: String(json._id ?? json.id ?? ''),
    projectId: String(json.project_id ?? json.projectId ?? ''),
    title: String(json.title ?? 'Sin título'),
    description: String(json.description ?? ''),
    date: parseDate(json.event_date) ?? dateOnly(new Date()),
    kind: eventKindFrom(json.kind),
    createdById: String(json.created_by ?? ''),
  };
}

export function eventToJson(event: ProjectEvent): Record<string, unknown> {
  return {
    project_id: event.projectId,
    title: event.title,
    description: event.description,
    event_date: toIsoDate(event.date),
    kind: event.kind,
    created_by: event.createdById || null,
  };
}

export function isTaskOverdue(task: ProjectTask, now: Date = new Date()): boolean {
  if (task.isDone || !task.dueDate) return false;
  return dateOnly(task.dueDate).getTime() < dateOnly(now).getTime();
}
