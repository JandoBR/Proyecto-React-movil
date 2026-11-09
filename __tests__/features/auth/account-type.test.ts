import { userSessionFrom } from "../../../src/features/auth/domain/models";

describe("userSessionFrom", () => {
  it("reads the account type from the register extra", () => {
    const session = userSessionFrom({
      userId: "u1",
      role: "user",
      extra: { account_type: "teacher" },
    });
    expect(session.accountType).toBe("teacher");
    expect(session.role).toBe("user");
  });

  it("ignores unknown account types", () => {
    expect(userSessionFrom({ account_type: "admin" }).accountType).toBeNull();
  });
});
