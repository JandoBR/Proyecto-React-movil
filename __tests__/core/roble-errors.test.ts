import {
  RobleApiAuthException,
  RobleApiForbiddenException,
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiNotFoundException,
  RobleApiTimeoutException,
} from "roble-client";

import { getErrorMessage } from "../../src/core/roble/errors";

describe("getErrorMessage", () => {
  it("maps network and timeout errors", () => {
    expect(getErrorMessage(new RobleApiNetworkException("boom"))).toBe(
      "Sin conexión a internet o el servidor no responde.",
    );
    expect(getErrorMessage(new RobleApiTimeoutException("boom"))).toBe(
      "Tiempo de espera agotado. Por favor intenta de nuevo.",
    );
  });

  it("maps auth, forbidden and not found errors", () => {
    expect(getErrorMessage(new RobleApiAuthException("boom"))).toBe(
      "Credenciales inválidas o la sesión ha expirado.",
    );
    expect(getErrorMessage(new RobleApiForbiddenException("boom"))).toBe(
      "No tienes permisos para realizar esta acción.",
    );
    expect(getErrorMessage(new RobleApiNotFoundException("boom"))).toBe(
      "El elemento solicitado no fue encontrado.",
    );
  });

  it("maps rate limit and conflict status codes", () => {
    expect(getErrorMessage(new RobleApiHttpException(429, "too many"))).toContain(
      "Demasiados intentos",
    );
    expect(getErrorMessage(new RobleApiHttpException(409, "duplicado"))).toBe(
      "Ya existe una cuenta o registro con esa información.",
    );
  });

  it("cleans server messages with prefixes and brackets", () => {
    expect(
      getErrorMessage(new RobleApiHttpException(400, "Bad Request: [falta título]")),
    ).toBe("falta título");
    expect(getErrorMessage(new RobleApiHttpException(400, ""))).toBe(
      "Error en la solicitud (código 400).",
    );
  });

  it("falls back to ordinary errors", () => {
    expect(getErrorMessage(new Error("algo raro"))).toBe("algo raro");
    expect(getErrorMessage("texto")).toBe("texto");
    expect(getErrorMessage(null)).toBe("Ocurrió un error inesperado.");
  });
});
