import {
  RobleApiAuthException,
  RobleApiException,
  RobleApiForbiddenException,
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiNotFoundException,
  RobleApiTimeoutException,
} from 'roble-client';

export {
  RobleApiAuthException,
  RobleApiException,
  RobleApiForbiddenException,
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiNotFoundException,
  RobleApiTimeoutException,
} from 'roble-client';

export function getErrorMessage(error: unknown): string {
  if (error instanceof RobleApiNetworkException) {
    return 'Sin conexión a internet o el servidor no responde.';
  }
  if (error instanceof RobleApiTimeoutException) {
    return 'Tiempo de espera agotado. Por favor intenta de nuevo.';
  }
  if (error instanceof RobleApiAuthException) {
    return 'Credenciales inválidas o la sesión ha expirado.';
  }
  if (error instanceof RobleApiForbiddenException) {
    return 'No tienes permisos para realizar esta acción.';
  }
  if (error instanceof RobleApiNotFoundException) {
    return 'El elemento solicitado no fue encontrado.';
  }
  if (error instanceof RobleApiHttpException) {
    if (error.statusCode === 429) {
      return 'Demasiados intentos seguidos. El servidor tiene un límite temporal de seguridad. Espera unos minutos.';
    }
    if (error.statusCode === 409) {
      return 'Ya existe una cuenta o registro con esa información.';
    }
    let clean = error.message;
    const colon = clean.indexOf(': ');
    if (colon >= 0) clean = clean.slice(colon + 2);
    if (clean.startsWith('[') && clean.endsWith(']')) {
      clean = clean.slice(1, -1);
    }
    return clean || `Error en la solicitud (código ${error.statusCode}).`;
  }
  if (error instanceof RobleApiException) {
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return 'Ocurrió un error inesperado.';
}
