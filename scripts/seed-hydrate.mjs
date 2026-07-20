/**
 * Siembra la tabla `hydrate` con los textos de src/app/translations.
 *
 * Uso:
 *   node scripts/seed-hydrate.mjs                 # SQLite local (o Postgres si hay DATABASE_URL)
 *   DATABASE_URL=postgres://... node scripts/seed-hydrate.mjs
 *   node scripts/seed-hydrate.mjs --overwrite     # pisa lo ya editado
 *   node scripts/seed-hydrate.mjs --dry-run       # solo reporta
 *
 * Por defecto NO pisa filas existentes: los textos que ya se editaron desde el
 * admin ganan sobre el hardcodeado. Con --overwrite se fuerza la sincronizacion
 * en sentido contrario.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRANSLATIONS_DIR = path.join(ROOT, 'src', 'app', 'translations');
const PROJECT_SLUG = process.env.APPSTRACT_PROJECT_SLUG || 'refautomex';
const LOCALES = ['es', 'en'];

// Mismo mapa de namespaces que arma i18next-translation.js.
const NAMESPACES = [
  'index',
  'navbar',
  'about',
  'contact',
  'promotions',
  'products',
  'account',
  'faqs',
  'footer',
  'mailbox',
  'invoice',
  'privacy',
];

const overwrite = process.argv.includes('--overwrite');
const dryRun = process.argv.includes('--dry-run');

/**
 * Los archivos son .jsx pero contienen objetos planos, y Node no resuelve esa
 * extension. Se importan como modulo en memoria via data: URI.
 */
const loadNamespace = async (ns) => {
  const source = await fs.readFile(path.join(TRANSLATIONS_DIR, `${ns}.jsx`), 'utf8');
  const mod = await import(`data:text/javascript,${encodeURIComponent(source)}`);
  return mod[ns];
};

const flatten = (node, prefix, out) => {
  for (const [key, value] of Object.entries(node)) {
    const full = `${prefix}.${key}`;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, full, out);
    } else if (typeof value === 'string') {
      out.push([full, value]);
    }
  }
  return out;
};

const collectEntries = async () => {
  const entries = [];

  for (const ns of NAMESPACES) {
    const bundle = await loadNamespace(ns);
    if (!bundle) {
      console.warn(`  aviso: ${ns}.jsx no exporta "${ns}", se omite`);
      continue;
    }
    for (const locale of LOCALES) {
      if (!bundle[locale]) {
        console.warn(`  aviso: ${ns} no tiene locale "${locale}", se omite`);
        continue;
      }
      flatten(bundle[locale], `${locale}.${ns}`, entries);
    }
  }

  return entries;
};

const seedPostgres = async (url, entries) => {
  const { default: postgres } = await import('postgres');
  const sql = postgres(url, { max: 1 });
  let inserted = 0;
  let skipped = 0;

  try {
    for (const [contentKey, contentValue] of entries) {
      const conflict = overwrite
        ? sql`DO UPDATE SET content_value = EXCLUDED.content_value, updated_at = now()`
        : sql`DO NOTHING`;
      const rows = await sql`
        INSERT INTO hydrate (id, project_slug, content_key, content_value)
        VALUES (${crypto.randomUUID()}, ${PROJECT_SLUG}, ${contentKey}, ${contentValue})
        ON CONFLICT (project_slug, content_key) ${conflict}
        RETURNING id`;
      if (rows.length > 0) inserted += 1;
      else skipped += 1;
    }
    const total = await sql`SELECT COUNT(*)::int AS c FROM hydrate WHERE project_slug = ${PROJECT_SLUG}`;
    return { inserted, skipped, total: total[0].c };
  } finally {
    await sql.end();
  }
};

const seedSqlite = async (entries) => {
  const { default: Database } = await import('better-sqlite3');
  const dbPath =
    process.env.APPSTRACT_DB_PATH || path.join(ROOT, '..', 'appstract', 'local.db');
  const db = new Database(dbPath);
  const verb = overwrite ? 'INSERT OR REPLACE' : 'INSERT OR IGNORE';
  const stmt = db.prepare(
    `${verb} INTO hydrate (id, project_slug, content_key, content_value) VALUES (?, ?, ?, ?)`
  );

  let inserted = 0;
  let skipped = 0;
  for (const [contentKey, contentValue] of entries) {
    const info = stmt.run(crypto.randomUUID(), PROJECT_SLUG, contentKey, contentValue);
    if (info.changes > 0) inserted += 1;
    else skipped += 1;
  }
  const total = db
    .prepare('SELECT COUNT(*) AS c FROM hydrate WHERE project_slug = ?')
    .get(PROJECT_SLUG).c;
  db.close();
  return { inserted, skipped, total };
};

const main = async () => {
  const entries = await collectEntries();
  const url = process.env.APPSTRACT_DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const usePg = Boolean(url && (url.startsWith('postgres://') || url.startsWith('postgresql://')));

  console.log(`Textos encontrados: ${entries.length} (proyecto "${PROJECT_SLUG}")`);
  console.log(`Destino: ${usePg ? 'PostgreSQL' : 'SQLite local'}`);
  console.log(`Modo: ${overwrite ? 'overwrite' : 'preservar lo existente'}`);

  if (dryRun) {
    console.log('\n--dry-run: no se escribio nada. Muestra de keys:');
    for (const [key, value] of entries.slice(0, 10)) {
      console.log(`  ${key} = ${JSON.stringify(value.slice(0, 60))}`);
    }
    return;
  }

  const result = usePg ? await seedPostgres(url, entries) : await seedSqlite(entries);
  console.log(`\nInsertados: ${result.inserted}`);
  console.log(`Sin cambio: ${result.skipped}`);
  console.log(`Total en hydrate: ${result.total}`);
};

main().catch((error) => {
  console.error('Fallo la siembra:', error);
  process.exit(1);
});
