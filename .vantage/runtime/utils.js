import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Sanitize ID to prevent path traversal */
export function sanitizeId(id) {
  return path.basename(id).replace(/[^a-zA-Z0-9._-]/g, '');
}

/** Get __dirname equivalent for ES modules */
export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}
