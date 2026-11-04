import {
  buildProjectShareMessage,
  projectShareLink,
} from "../../src/core/project-share";

describe("project-share", () => {
  it("builds the public link for a project", () => {
    expect(projectShareLink("abc")).toBe(
      "https://nexus-app.uninorte.edu.co/proyecto/abc",
    );
  });

  it("builds a share message with title and description", () => {
    const message = buildProjectShareMessage({
      projectId: "abc",
      title: "EcoCampus",
      description: "Clasificación de residuos",
    });
    expect(message).toContain("¡Mira este proyecto en Nexus!");
    expect(message).toContain('"EcoCampus"');
    expect(message).toContain("Clasificación de residuos");
    expect(message).toContain("https://nexus-app.uninorte.edu.co/proyecto/abc");
  });

  it("omits the description block when empty", () => {
    const message = buildProjectShareMessage({
      projectId: "abc",
      title: "EcoCampus",
    });
    expect(message).not.toContain("\n\n\n");
  });
});
