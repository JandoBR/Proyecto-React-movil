import { RobleService } from '@/src/core/roble/service';
import { UserSession, userSessionFrom } from '../domain/models';

export class AuthRepository {
  constructor(private readonly roble: RobleService) {}

  get isLoggedIn(): boolean {
    return this.roble.isLoggedIn;
  }

  get currentUser(): UserSession | null {
    if (!this.roble.cachedUser) return null;
    return userSessionFrom(this.roble.cachedUser);
  }

  async login(email: string, password: string): Promise<UserSession> {
    return userSessionFrom(await this.roble.login(email, password));
  }

  async register(email: string, password: string, name: string): Promise<UserSession> {
    return userSessionFrom(await this.roble.register(email, password, name));
  }

  async logout(): Promise<void> {
    await this.roble.logout();
  }

  async restoreSession(): Promise<boolean> {
    return this.roble.restoreSession();
  }
}
