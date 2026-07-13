const TOKEN_KEY = "observatorio.session.token";

export function readStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string) {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // La sesión en memoria sigue funcionando si el navegador bloquea storage.
  }
}

export function removeStoredToken() {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // No se propaga un error de almacenamiento durante logout.
  }
}
