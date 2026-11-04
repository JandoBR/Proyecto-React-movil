export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role?: string | null;
}

export function userSessionFrom(map: Record<string, unknown>): UserSession {
  return {
    userId: String(map.userId ?? map.user_id ?? map._id ?? map.id ?? ''),
    email: String(map.email ?? ''),
    name: String(map.name ?? ''),
    role: map.role == null ? null : String(map.role),
  };
}
