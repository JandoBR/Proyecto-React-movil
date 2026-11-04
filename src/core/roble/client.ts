import { RobleApiClient } from 'roble-client';

import { ROBLE_BASE_URL, ROBLE_CONTRACT_ID } from './constants';
import { TokenStorage, robleTokenStorage } from './storage';

export type RobleRecord = Record<string, any>;

export interface RobleQueryResult {
  rows: RobleRecord[];
  rowCount: number;
  fields?: unknown;
}

export interface RobleClientConfig {
  baseUrl: string;
  contractId: string;
  timeoutMs: number;
}

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Adaptador fino sobre el cliente oficial `roble-client`.
 *
 * Misma sesión, mismos endpoints y mismos errores que el SDK de Flutter; aquí
 * solo se mantienen los nombres que ya usan los repositorios.
 */
export class RobleClient {
  readonly sdk: RobleApiClient;

  constructor(
    readonly storage: TokenStorage = robleTokenStorage,
    readonly config: RobleClientConfig = {
      baseUrl: ROBLE_BASE_URL,
      contractId: ROBLE_CONTRACT_ID,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    },
    sdk?: RobleApiClient,
  ) {
    this.sdk =
      sdk ??
      new RobleApiClient({
        baseUrl: config.baseUrl,
        contractId: config.contractId,
        timeoutMs: config.timeoutMs,
        storage,
      });
  }

  get isLoggedIn(): boolean {
    return this.sdk.isLoggedIn;
  }

  restoreSession(verify = true): Promise<boolean> {
    return this.sdk.restoreSession({ verify });
  }

  login(email: string, password: string): Promise<RobleRecord> {
    return this.sdk.login({ email, password }) as Promise<RobleRecord>;
  }

  register(
    email: string,
    password: string,
    name: string,
    extra?: RobleRecord,
  ): Promise<RobleRecord> {
    return this.sdk.register({
      email,
      password,
      name,
      ...(extra ? { extra } : {}),
    }) as Promise<RobleRecord>;
  }

  logout(): Promise<void> {
    return this.sdk.logout();
  }

  currentUser(): Promise<RobleRecord> {
    return this.sdk.currentUser() as Promise<RobleRecord>;
  }

  create(tableName: string, record: RobleRecord): Promise<RobleRecord> {
    return this.sdk.create(tableName, record);
  }

  read(tableName: string, filters?: RobleRecord): Promise<RobleRecord[]> {
    return this.sdk.read(tableName, filters);
  }

  update(
    tableName: string,
    id: string,
    data: RobleRecord,
  ): Promise<RobleRecord> {
    return this.sdk.update(tableName, id, data);
  }

  remove(tableName: string, id: string): Promise<RobleRecord> {
    return this.sdk.delete(tableName, id);
  }

  async executeQueryByName(
    name: string,
    params?: unknown[],
  ): Promise<RobleQueryResult> {
    const result = await this.sdk.executeQueryByName(name, params);
    return {
      rows: result.rows as RobleRecord[],
      rowCount: result.rowCount,
      fields: result.fields,
    };
  }
}
