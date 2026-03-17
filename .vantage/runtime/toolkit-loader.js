import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { sanitizeId } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOLKITS_DIR = path.join(__dirname, '..', 'toolkits');
export const TOOLS_DIR = path.join(TOOLKITS_DIR, 'tools');

export function loadIndex(agentId) {
  const filePath = path.join(TOOLKITS_DIR, `${sanitizeId(agentId)}.index.yml`);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

export function loadTool(toolId) {
  const filePath = path.join(TOOLS_DIR, `${sanitizeId(toolId)}.tool.yml`);
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
}

export function listTools(agentId) {
  const indexContent = loadIndex(agentId);
  if (!indexContent) return [];
  const parsed = yaml.load(indexContent);
  if (!parsed || !parsed.tools) return [];
  return parsed.tools.map(t => ({ id: t.id, description: t.description }));
}

// CLI interface — guarded
const _cliArg = process.argv[1] || '';
const _moduleUrl = fileURLToPath(import.meta.url);
if (_cliArg.replace(/\\/g, '/') === _moduleUrl.replace(/\\/g, '/')) {
  const [,, command, id] = process.argv;
  if (command === 'index') {
    process.stdout.write(loadIndex(id));
  } else if (command === 'load') {
    process.stdout.write(loadTool(id));
  } else if (command === 'list') {
    console.log(JSON.stringify(listTools(id), null, 2));
  }
}
