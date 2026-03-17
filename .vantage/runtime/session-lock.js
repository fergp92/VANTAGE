import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCK_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'locks');
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export function acquireLock(phaseId, agentId, taskId = null) {
  mkdirSync(LOCK_DIR, { recursive: true });
  const timestamp = Date.now();
  const lockFile = join(LOCK_DIR, `${phaseId}-${timestamp}.lock`);
  const lockData = {
    phase: phaseId,
    agent: agentId,
    task: taskId,
    startTime: new Date(timestamp).toISOString(),
    timestampMs: timestamp,
    pid: process.pid,
  };
  writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
  return lockFile;
}

export function releaseLock(lockFile) {
  if (existsSync(lockFile)) {
    unlinkSync(lockFile);
  }
}

export function checkStaleLocks() {
  if (!existsSync(LOCK_DIR)) return [];
  const now = Date.now();
  const files = readdirSync(LOCK_DIR).filter(f => f.endsWith('.lock'));
  const staleLocks = [];

  for (const file of files) {
    const fullPath = join(LOCK_DIR, file);
    try {
      const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
      const age = now - data.timestampMs;
      if (age > STALE_THRESHOLD_MS) {
        staleLocks.push({
          file: fullPath,
          ...data,
          ageMinutes: Math.round(age / 60000),
        });
      }
    } catch {
      // Corrupted lock file — treat as stale
      staleLocks.push({ file: fullPath, corrupted: true });
    }
  }

  return staleLocks;
}

export function generateRecoveryBriefing(staleLocks) {
  if (staleLocks.length === 0) return null;

  const lines = [
    '# Recovery Briefing',
    '',
    `Found ${staleLocks.length} stale lock(s) from a previous session:`,
    '',
  ];

  for (const lock of staleLocks) {
    if (lock.corrupted) {
      lines.push(`- **Corrupted lock**: ${basename(lock.file)} (recommend deletion)`);
    } else {
      lines.push(`- **Phase ${lock.phase}** (Agent ${lock.agent}): started ${lock.startTime}, stale for ${lock.ageMinutes} minutes`);
      if (lock.task) lines.push(`  - Task: ${lock.task}`);
    }
  }

  lines.push('');
  lines.push('## Recommended Actions');
  lines.push('1. Review PROJECT-STATE.md for last known good state');
  lines.push('2. Check git log for last committed work');
  lines.push('3. Resume from the last completed gate');
  lines.push('4. Clear stale locks with: `node .vantage/runtime/session-lock.js clear`');

  return lines.join('\n');
}

export function clearStaleLocks() {
  const stale = checkStaleLocks();
  for (const lock of stale) {
    if (existsSync(lock.file)) {
      unlinkSync(lock.file);
    }
  }
  return stale.length;
}

// CLI interface — guarded
const _cliArg = process.argv[1] || '';
const _moduleUrl = fileURLToPath(import.meta.url);
if (_cliArg.replace(/\\/g, '/') === _moduleUrl.replace(/\\/g, '/')) {
  const [,, command] = process.argv;
  if (command === 'check') {
    const stale = checkStaleLocks();
    if (stale.length === 0) {
      console.log('No stale locks found. Session state is clean.');
    } else {
      console.log(generateRecoveryBriefing(stale));
    }
  } else if (command === 'clear') {
    const cleared = clearStaleLocks();
    console.log(`Cleared ${cleared} stale lock(s).`);
  } else {
    console.log('Usage: session-lock.js [check|clear]');
  }
}
