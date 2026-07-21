import { eq } from 'drizzle-orm';

import { getHydrateDb } from './db';
import { hydrate } from './schema';

/**
 * Lee los overrides de texto de la tabla `hydrate` y los expande al arbol que
 * consume TextProvider.
 *
 * Cada fila trae el locale como primer segmento del content_key:
 *   "es.navbar.home" -> { es: { navbar: { home: "..." } } }
 *
 * Solo se aceptan los locales que el sitio realmente maneja; cualquier fila con
 * un prefijo distinto se ignora en vez de inventar un idioma nuevo.
 */

const PROJECT_SLUG = process.env.APPSTRACT_PROJECT_SLUG || 'refautomex';
const SUPPORTED_LOCALES = ['es', 'en'];
const CACHE_TTL_MS = Number(process.env.HYDRATE_CACHE_TTL_MS ?? 10_000);

let cache = null;
let cachedAt = 0;

const setDeep = (root, segments, value) => {
  let node = root;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    // Si una key mas corta ya ocupo el lugar con un string, no la pisamos con
    // un objeto: dejaria el arbol inconsistente.
    if (typeof node[segment] !== 'object' || node[segment] === null) {
      if (segment in node) return;
      node[segment] = {};
    }
    node = node[segment];
  }

  node[segments[segments.length - 1]] = value;
};

export const getHydratedResources = async () => {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache;

  const db = getHydrateDb();
  if (!db) return {};

  let rows;
  try {
    rows = await db
      .select({ contentKey: hydrate.contentKey, contentValue: hydrate.contentValue })
      .from(hydrate)
      .where(eq(hydrate.projectSlug, PROJECT_SLUG));
  } catch (error) {
    console.error('No se pudieron leer los textos de hidratacion:', error.message);
    return {};
  }

  const resources = {};

  for (const row of rows) {
    const segments = row.contentKey.split('.').filter(Boolean);
    // Hace falta al menos locale + una key: "es.home" es lo minimo util.
    if (segments.length < 2) continue;
    if (!SUPPORTED_LOCALES.includes(segments[0])) continue;

    setDeep(resources, segments, row.contentValue);
  }

  cache = resources;
  cachedAt = now;
  return resources;
};
