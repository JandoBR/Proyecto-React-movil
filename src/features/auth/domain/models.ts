export type AccountType = 'student' | 'teacher';

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  student: 'Estudiante',
  teacher: 'Profesor',
};

export function accountTypeFrom(value: unknown): AccountType | null {
  return value === 'student' || value === 'teacher' ? value : null;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role?: string | null;
  accountType: AccountType | null;
}

export function userSessionFrom(map: Record<string, unknown>): UserSession {
  const extra = (map.extra ?? null) as Record<string, unknown> | null;
  return {
    userId: String(map.userId ?? map.user_id ?? map._id ?? map.id ?? ''),
    email: String(map.email ?? ''),
    name: String(map.name ?? ''),
    role: map.role == null ? null : String(map.role),
    accountType: accountTypeFrom(map.account_type ?? extra?.account_type),
  };
}
