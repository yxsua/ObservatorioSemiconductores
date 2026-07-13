import { afterEach, describe, expect, it } from "vitest";
import {
  readStoredToken,
  removeStoredToken,
  storeToken
} from "./session-storage";

describe("almacenamiento de sesión", () => {
  afterEach(() => window.sessionStorage.clear());

  it("guarda, recupera y elimina el token de la pestaña", () => {
    expect(readStoredToken()).toBeNull();
    storeToken("token-de-prueba");
    expect(readStoredToken()).toBe("token-de-prueba");
    removeStoredToken();
    expect(readStoredToken()).toBeNull();
  });
});
