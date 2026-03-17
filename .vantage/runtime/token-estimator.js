import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFileSync as _readSync, writeFileSync as _writeSync, existsSync as _existsSync } from 'node:fs';

const PHASES = ['discovery', 'architecture', 'security', 'implementation', 'qa', 'operations'];
const COMPLEXITY_FACTOR = { simple: 0.7, medium: 1.0, complex: 1.5 };
const BASE_COST_PER_AGENT_PER_PHASE = 4000;
const SPEC_OVERHEAD = 2000;
const SCOUT_OVERHEAD = 1000;
const MEMORY_SAVING = 500;
const SCOUT_SAVING = 2000;
const PARALLEL_DISCOUNT = 0.80;

const PHASE_WEIGHTS = {
  discovery: 0.12, architecture: 0.18, security: 0.12,
  implementation: 0.30, qa: 0.18, operations: 0.10,
};

export function estimate(config) {
  const agentCount = config.team.agents.length;
  const factor = COMPLEXITY_FACTOR[config.complexity] || 1.0;

  let baseCost = agentCount * PHASES.length * BASE_COST_PER_AGENT_PER_PHASE * factor;
  baseCost += (config.specCount || 0) * SPEC_OVERHEAD;
  baseCost += (config.requirementCount || 0) * SCOUT_OVERHEAD;
  baseCost *= PARALLEL_DISCOUNT;

  const memorySavings = (config.cachedLearnings || 0) * MEMORY_SAVING;
  const scoutSavings = (config.cachedPackages || 0) * SCOUT_SAVING;
  const totalSavings = memorySavings + scoutSavings;

  const netCost = Math.max(baseCost - totalSavings, agentCount * 5000);

  const total = {
    min: Math.round(netCost * 0.8),
    max: Math.round(netCost * 1.3),
  };

  const phases = PHASES.map(name => ({
    name,
    min: Math.round(total.min * PHASE_WEIGHTS[name]),
    max: Math.round(total.max * PHASE_WEIGHTS[name]),
  }));

  const factors = [
    `${agentCount} agents active across ${PHASES.length} phases`,
    `Complexity: ${config.complexity} (factor: ${factor})`,
    `${config.specCount || 0} specs to generate (+${(config.specCount || 0) * SPEC_OVERHEAD} tokens)`,
    `${config.requirementCount || 0} requirements to scout (+${(config.requirementCount || 0) * SCOUT_OVERHEAD} tokens)`,
    `Parallel subagent discount: -20%`,
  ];

  if (memorySavings > 0) factors.push(`Memory cache savings: -${memorySavings} tokens`);
  if (scoutSavings > 0) factors.push(`Scout cache savings: -${scoutSavings} tokens`);

  return { total, phases, savings: { memory: memorySavings, scout: scoutSavings }, factors };
}

export function formatEstimate(est, projectName = 'unnamed') {
  const lines = [
    `VANTAGE v2.0 — Token Estimate`,
    ``,
    `Project: ${projectName}`,
    `Estimated range: ${Math.round(est.total.min / 1000)}K - ${Math.round(est.total.max / 1000)}K tokens`,
    ``,
    `Breakdown:`,
    ...est.phases.map(p => `  · ${p.name.padEnd(20)} ${Math.round(p.min / 1000)}K - ${Math.round(p.max / 1000)}K`),
    ``,
    ...est.savings.memory > 0 ? [`Memory savings (est.): -${Math.round(est.savings.memory / 1000)}K`] : [],
    ...est.savings.scout > 0 ? [`Scout savings (est.):  -${Math.round(est.savings.scout / 1000)}K`] : [],
  ];
  return lines.join('\n');
}

// --- Cost Tracking (P3 Enhancement) ---

const COST_LEDGER_PATH = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..', 'memory', 'cost-ledger.yml'
);

export function track(agentId, phaseId, tokensUsed) {
  let ledger = { entries: [], totals: { byAgent: {}, byPhase: {}, grand: 0 } };

  if (_existsSync(COST_LEDGER_PATH)) {
    try {
      const raw = _readSync(COST_LEDGER_PATH, 'utf-8');
      // Simple YAML-like parsing for the ledger
      ledger = JSON.parse(raw);
    } catch {
      // Start fresh if corrupted
    }
  }

  const entry = {
    agent: agentId,
    phase: phaseId,
    tokens: tokensUsed,
    timestamp: new Date().toISOString(),
  };

  ledger.entries.push(entry);

  // Update totals
  ledger.totals.byAgent[agentId] = (ledger.totals.byAgent[agentId] || 0) + tokensUsed;
  ledger.totals.byPhase[phaseId] = (ledger.totals.byPhase[phaseId] || 0) + tokensUsed;
  ledger.totals.grand += tokensUsed;

  _writeSync(COST_LEDGER_PATH, JSON.stringify(ledger, null, 2));
  return ledger.totals;
}

export function formatDashboard(estimate, ledger) {
  const lines = [
    'VANTAGE — Cost Dashboard',
    '',
    `Estimated: ${Math.round(estimate.total.min / 1000)}K - ${Math.round(estimate.total.max / 1000)}K tokens`,
    `Actual:    ${Math.round((ledger?.totals?.grand || 0) / 1000)}K tokens`,
    '',
    'By Phase:',
  ];

  for (const phase of PHASES) {
    const est = estimate.phases.find(p => p.name === phase);
    const actual = ledger?.totals?.byPhase?.[phase] || 0;
    const variance = est ? Math.round(((actual - est.min) / est.min) * 100) : 0;
    lines.push(`  · ${phase.padEnd(20)} est: ${Math.round((est?.min || 0) / 1000)}K-${Math.round((est?.max || 0) / 1000)}K  actual: ${Math.round(actual / 1000)}K  (${variance > 0 ? '+' : ''}${variance}%)`);
  }

  lines.push('');
  lines.push('By Agent (top 5):');
  const agentEntries = Object.entries(ledger?.totals?.byAgent || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  for (const [agent, tokens] of agentEntries) {
    lines.push(`  · Agent ${agent.padEnd(15)} ${Math.round(tokens / 1000)}K tokens`);
  }

  return lines.join('\n');
}

// CLI interface — guarded
const _argv1te = process.argv[1] || '';
const _metaUrlTe = fileURLToPath(import.meta.url);
if (_argv1te.replace(/\\/g, '/') === _metaUrlTe.replace(/\\/g, '/')) {
  const [,, command] = process.argv;
  if (command === 'estimate') {
    const args = process.argv.slice(3);
    const preset = args.find((_, i) => args[i - 1] === '--preset') || 'fullstack';
    const complexity = args.find((_, i) => args[i - 1] === '--complexity') || 'medium';
    const agents = args.find((_, i) => args[i - 1] === '--agents')?.split(',') || ['00', '02', '08', '12', '17'];
    const result = estimate({
      team: { preset, agents },
      complexity,
      specCount: 4, requirementCount: 6, cachedLearnings: 0, cachedPackages: 0,
    });
    console.log(formatEstimate(result));
  }
  else if (command === 'dashboard') {
    const agents = ['00', '02', '08', '12', '17'];
    const est = estimate({
      team: { preset: 'fullstack', agents },
      complexity: 'medium',
      specCount: 4, requirementCount: 6, cachedLearnings: 0, cachedPackages: 0,
    });
    let ledger = null;
    if (_existsSync(COST_LEDGER_PATH)) {
      try { ledger = JSON.parse(_readSync(COST_LEDGER_PATH, 'utf-8')); } catch { /* empty */ }
    }
    console.log(formatDashboard(est, ledger));
  }
}
