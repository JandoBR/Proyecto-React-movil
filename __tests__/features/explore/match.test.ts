import { computeMatch } from "../../../src/features/explore/domain/match";

describe("computeMatch", () => {
  it("returns 0 when the project has no tags", () => {
    expect(
      computeMatch({
        userSkills: ["React"],
        userInterests: ["Tech"],
        projectRoles: [],
        projectCategories: [],
      }),
    ).toBe(0);
  });

  it("returns 100 when every project tag matches", () => {
    expect(
      computeMatch({
        userSkills: ["Diseño UI/UX", "React"],
        userInterests: ["Tech"],
        projectRoles: ["Diseño UI/UX"],
        projectCategories: ["Tech"],
      }),
    ).toBe(100);
  });

  it("returns 0 when nothing matches", () => {
    expect(
      computeMatch({
        userSkills: ["Contabilidad"],
        userInterests: ["Deportes"],
        projectRoles: ["Visión por Computadora"],
        projectCategories: ["Salud"],
      }),
    ).toBe(0);
  });

  it("matches accents, case and shared words", () => {
    expect(
      computeMatch({
        userSkills: ["diseno grafico"],
        userInterests: ["inteligencia artificial"],
        projectRoles: ["Diseño Gráfico"],
        projectCategories: ["Inteligencia Artificial"],
      }),
    ).toBe(100);
  });

  it("weights categories and roles equally", () => {
    expect(
      computeMatch({
        userSkills: ["React"],
        userInterests: ["Deportes"],
        projectRoles: ["React"],
        projectCategories: ["Salud"],
      }),
    ).toBe(50);
  });
});
