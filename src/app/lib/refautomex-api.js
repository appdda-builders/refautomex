const sanitizePath = (path) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (path = '') => {
  if (!path) return '/api/refautomex';
  return `/api/refautomex${sanitizePath(path)}`;
};

export default buildApiUrl;
