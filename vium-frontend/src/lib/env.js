// Central environment helper: detects local vs production and builds URLs.
// Logs current environment at import time for visibility during dev/build.

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

export const isLocal = hostname === 'localhost' || hostname.startsWith('127.');
export const isProd = !isLocal;

// Use dynamic origin in local to avoid port mismatch; production uses fixed domain.
export const BASE_URL = isLocal
  ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
  : 'https://vium-dmd.vercel.app';

export const API_URL = isLocal
  ? 'http://localhost:3000'
  : 'https://vium-backend.onrender.com';

export function getRedirectUrl(path = '') {
  return `${BASE_URL}${path}`;
}

// Build/dev logs
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('Ambiente atual:', isLocal ? 'Desenvolvimento' : 'Produção');
  // eslint-disable-next-line no-console
  console.log('URL base usada:', BASE_URL);
}