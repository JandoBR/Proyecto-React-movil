import type { RobleApiClient } from "roble-client";

import { RobleClient, RobleClientConfig } from "../../src/core/roble/client";
import { TokenStorage } from "../../src/core/roble/storage";

class MemoryStorage implements TokenStorage {
  values = new Map<string, string>();
  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  async removeItem(key: string) {
    this.values.delete(key);
  }
}

const config: RobleClientConfig = {
  baseUrl: "https://roble.example",
  contractId: "contract_1",
  timeoutMs: 1000,
};

function fakeSdk(overrides: Record<string, jest.Mock> = {}) {
  return {
    isLoggedIn: true,
    login: jest.fn(async () => ({ userId: "user-1", email: "ana@test.com" })),
    register: jest.fn(async () => ({ userId: "user-1" })),
    logout: jest.fn(async () => undefined),
    currentUser: jest.fn(async () => ({ userId: "user-1", name: "Ana" })),
    restoreSession: jest.fn(async () => true),
    create: jest.fn(async () => ({ _id: "row-1" })),
    read: jest.fn(async () => [{ id: "p1" }]),
    update: jest.fn(async () => ({ _id: "row-1" })),
    delete: jest.fn(async () => ({ deleted: true })),
    executeQueryByName: jest.fn(async () => ({
      rows: [{ id: "p1" }],
      rowCount: 1,
      fields: [],
    })),
    ...overrides,
  } as unknown as RobleApiClient;
}

describe("RobleClient", () => {
  it("delegates auth calls to the official SDK", async () => {
    const sdk = fakeSdk();
    const client = new RobleClient(new MemoryStorage(), config, sdk);

    await client.login("ana@test.com", "secret");
    expect(sdk.login).toHaveBeenCalledWith({
      email: "ana@test.com",
      password: "secret",
    });

    await client.register("ana@test.com", "secret", "Ana", { career: "Sistemas" });
    expect(sdk.register).toHaveBeenCalledWith({
      email: "ana@test.com",
      password: "secret",
      name: "Ana",
      extra: { career: "Sistemas" },
    });

    await client.restoreSession(false);
    expect(sdk.restoreSession).toHaveBeenCalledWith({ verify: false });

    await client.logout();
    expect(sdk.logout).toHaveBeenCalled();
  });

  it("delegates CRUD and maps remove to delete", async () => {
    const sdk = fakeSdk();
    const client = new RobleClient(new MemoryStorage(), config, sdk);

    await client.read("project", { author_id: "user-1" });
    expect(sdk.read).toHaveBeenCalledWith("project", { author_id: "user-1" });

    await client.create("project", { title: "Nuevo" });
    expect(sdk.create).toHaveBeenCalledWith("project", { title: "Nuevo" });

    await client.update("project", "row-1", { title: "Editado" });
    expect(sdk.update).toHaveBeenCalledWith("project", "row-1", {
      title: "Editado",
    });

    await client.remove("project", "row-1");
    expect(sdk.delete).toHaveBeenCalledWith("project", "row-1");
  });

  it("normalizes saved query results", async () => {
    const sdk = fakeSdk();
    const client = new RobleClient(new MemoryStorage(), config, sdk);

    const result = await client.executeQueryByName("proyectos_completos", [
      "",
      20,
      0,
      "user-1",
    ]);
    expect(result.rows).toEqual([{ id: "p1" }]);
    expect(result.rowCount).toBe(1);
    expect(sdk.executeQueryByName).toHaveBeenCalledWith("proyectos_completos", [
      "",
      20,
      0,
      "user-1",
    ]);
  });
});
