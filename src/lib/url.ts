// Configuración de la URL base para rutas absolutas
const BASE_PATH = "/rv-parks-for-sale";
const DOMAIN = "https://roverpass.com";

/**
 * Genera una URL absoluta basada en la ruta base configurada
 * @param path Ruta relativa que se convertirá en absoluta
 * @returns URL relativa con el prefijo de ruta base
 */
export const absoluteUrl = (path: string): string => {
  // Si la ruta ya empieza con la base, no la agregamos de nuevo
  if (path.startsWith(BASE_PATH)) {
    return path;
  }
  
  // Asegurarse de que la ruta comience con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalizedPath}`;
};

/**
 * Genera una URL completa con dominio
 * @param path Ruta relativa que se convertirá en absoluta
 * @returns URL completa con dominio
 */
export const fullUrl = (path: string): string => {
  const url = absoluteUrl(path);
  return `${DOMAIN}${url}`;
};

/**
 * Determina si se debe usar un enlace externo en lugar de React Router
 */
export const shouldUseExternalLink = (): boolean => {
  // Verificar si estamos en production o si el dominio actual no es roverpass.com
  return window.location.hostname !== 'roverpass.com' && 
         window.location.hostname !== 'localhost' &&
         !window.location.hostname.includes('127.0.0.1');
};