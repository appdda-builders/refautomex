/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 es un modulo nativo: se carga en runtime desde node_modules
  // en vez de pasar por el bundler.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
