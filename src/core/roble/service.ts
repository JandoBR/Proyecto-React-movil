import { RobleClient, RobleClientConfig, RobleRecord } from './client';
import { ROBLE_BASE_URL, ROBLE_CONTRACT_ID } from './constants';

export class RobleService {
  cachedUser: RobleRecord | null = null;

  constructor(readonly client: RobleClient = new RobleClient()) {}

  get isLoggedIn(): boolean {
    return this.client.isLoggedIn;
  }

  get currentUserId(): string {
    const user = this.cachedUser;
    return String(user?.userId ?? user?.user_id ?? user?._id ?? user?.id ?? '');
  }

  async restoreSession(): Promise<boolean> {
    const restored = await this.client.restoreSession(true);
    if (restored) this.cachedUser = await this.client.currentUser();
    return restored;
  }

  async login(email: string, password: string): Promise<RobleRecord> {
    const user = await this.client.login(email.trim(), password);
    this.cachedUser = user;
    return user;
  }

  /**
   * `accountType` es `student` o `teacher`; `career` es su etiqueta, que queda
   * como carrera inicial del perfil hasta que la persona la edite.
   */
  async register(
    email: string,
    password: string,
    name: string,
    { accountType, career }: { accountType: string; career: string },
  ): Promise<RobleRecord> {
    await this.client.register(email.trim(), password, name.trim(), {
      career,
      account_type: accountType,
      avatar_url:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });
    const user = await this.client.login(email.trim(), password);
    this.cachedUser = { ...user, account_type: accountType, career };

    const profile = {
      id: this.currentUserId,
      name: name.trim(),
      career,
      avatar_url:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };
    try {
      await this.client.create('collaborator', { ...profile, account_type: accountType });
    } catch {
      // The table may not have the account_type column yet.
      try {
        await this.client.create('collaborator', profile);
      } catch {
        // The profile may already exist or the table may not accept the row yet.
      }
    }

    return this.cachedUser;
  }

  async logout(): Promise<void> {
    try {
      await this.client.logout();
    } finally {
      this.cachedUser = null;
    }
  }

  setCachedUser(user: RobleRecord): void {
    this.cachedUser = user;
  }

  updateCachedUser(data: RobleRecord): void {
    this.cachedUser = { ...(this.cachedUser ?? {}), ...data };
  }

  async findCollaborator(userId: string): Promise<RobleRecord | null> {
    if (!userId) return null;
    for (const field of ['id', '_id']) {
      try {
        const rows = await this.client.read('collaborator', { [field]: userId });
        if (rows.length > 0) return rows[0];
      } catch {
        // Try the next column name.
      }
    }
    return null;
  }
}

export const robleService = new RobleService(
  new RobleClient(undefined, {
    baseUrl: ROBLE_BASE_URL,
    contractId: ROBLE_CONTRACT_ID,
    timeoutMs: 30000,
  } satisfies RobleClientConfig),
);
