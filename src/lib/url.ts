// Configuración de la URL base para rutas absolutas
const BASE_PATH = "/rv-parks-for-sale";

/**
 * Genera una URL absoluta basada en la ruta base configurada
 * @param path Ruta relativa que se convertirá en absoluta
 * @returns URL absoluta
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

// Versión completa con dominio para enlaces externos
export const fullUrl = (path: string): string => {
  const url = absoluteUrl(path);
  return `https://roverpass.com${url}`;
};