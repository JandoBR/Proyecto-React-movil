import {
  ProjectTask,
  taskFromJson,
  taskToJson,
} from "../../../src/features/workspace/domain/models";

const base: ProjectTask = {
  id: "",
  projectId: "p1",
  title: "Prototipo",
  description: "",
  assigneeIds: [],
  assigneeNames: [],
  dueDate: null,
  isDone: false,
  completedAt: null,
  completedByName: "",
  createdById: "u0",
};

describe("task assignees", () => {
  it("round-trips several assignees through the existing columns", () => {
    const json = taskToJson({
      ...base,
      assigneeIds: ["u1", "u2"],
      assigneeNames: ["Ana", "Luis"],
    });
    expect(json.assignee_id).toBe("u1");
    expect(json.assignee_ids).toBe("u1,u2");
    expect(json.assignee_name).toBe("Ana, Luis");

    const task = taskFromJson(json as Record<string, unknown>);
    expect(task.assigneeIds).toEqual(["u1", "u2"]);
    expect(task.assigneeNames).toEqual(["Ana", "Luis"]);
  });

  it("stores no assignee as null", () => {
    expect(taskToJson(base).assignee_id).toBeNull();
    expect(taskToJson(base).assignee_ids).toBeNull();
    expect(taskFromJson({ assignee_id: null, assignee_name: "" }).assigneeNames).toEqual([]);
  });

  it("reads old single-assignee rows", () => {
    const task = taskFromJson({ assignee_id: "u1", assignee_name: "Ana María" });
    expect(task.assigneeIds).toEqual(["u1"]);
    expect(task.assigneeNames).toEqual(["Ana María"]);
  });

  it("keeps a name with a comma whole when counts do not match", () => {
    const task = taskFromJson({ assignee_id: "u1", assignee_name: "Pérez, Ana" });
    expect(task.assigneeNames).toEqual(["Pérez, Ana"]);
  });
});
