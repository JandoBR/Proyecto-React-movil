import { RobleService } from "../../../src/core/roble/service";
import { ChatRepository } from "../../../src/features/workspace/data/ChatRepository";
import {
  messageFromJson,
  sortMessages,
} from "../../../src/features/workspace/domain/chat";

/** A fake Roble table shared by every account, like the real database. */
function fakeTable() {
  const rows: Record<string, any>[] = [];
  return {
    rows,
    read: jest.fn(async (_table: string, filters: Record<string, unknown>) =>
      rows.filter((row) => row.project_id === filters.project_id),
    ),
    create: jest.fn(async (_table: string, record: Record<string, unknown>) => {
      const row = { ...record, _id: `id${rows.length + 1}` };
      rows.push(row);
      return row;
    }),
  };
}

function repositoryAs(table: ReturnType<typeof fakeTable>, userId: string, name: string) {
  const roble = { cachedUser: { userId, name }, client: table } as unknown as RobleService;
  Object.defineProperty(roble, "currentUserId", { get: () => userId });
  return new ChatRepository(roble);
}

describe("project chat", () => {
  it("lets two accounts read the same conversation", async () => {
    const table = fakeTable();
    await repositoryAs(table, "u1", "Ana").sendMessage("p1", " hola ");
    await repositoryAs(table, "u2", "Luis").sendMessage("p1", "qué tal");

    const seenByAna = await repositoryAs(table, "u1", "Ana").getMessages("p1");
    expect(seenByAna.map((m) => [m.senderName, m.text])).toEqual([
      ["Ana", "hola"],
      ["Luis", "qué tal"],
    ]);
    expect(table.rows[0]).toMatchObject({ project_id: "p1", sender_id: "u1" });
  });

  it("keeps each project's chat apart", async () => {
    const table = fakeTable();
    await repositoryAs(table, "u1", "Ana").sendMessage("p1", "solo p1");
    expect(await repositoryAs(table, "u1", "Ana").getMessages("p2")).toEqual([]);
  });

  it("returns the id the database gave the new message", async () => {
    const sent = await repositoryAs(fakeTable(), "u1", "Ana").sendMessage("p1", "hola");
    expect(sent.id).toBe("id1");
  });

  it("orders by send time, then by id", () => {
    const at = (id: string, sent_at: string | null) =>
      messageFromJson({ _id: id, content: id, created_at: sent_at });
    const sorted = sortMessages([
      at("c", null),
      at("b", "2026-11-09T10:00:00Z"),
      at("a", "2026-11-09T10:00:00Z"),
      at("d", "2026-11-09T09:00:00Z"),
    ]);
    expect(sorted.map((m) => m.id)).toEqual(["d", "a", "b", "c"]);
  });
});
