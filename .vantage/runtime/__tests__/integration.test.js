import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { estimate, formatEstimate } from '../token-estimator.js';
import { loadAgent, getTeamAgents, buildPrompt } from '../agent-registry.js';
import { load, appendLearning, graduate, compactIfNeeded } from '../memory-manager.js';
import { loadIndex, loadTool, listTools } from '../toolkit-loader.js';
import { saveEvaluation, search, loadCache } from '../scout-service.js';
import { shouldRun, audit } from '../maintenance.js';

const EVAL_FILE = path.join(import.meta.dirname, '../../memory/evaluations.md');
const EVAL_BACKUP = EVAL_FILE + '.integration.bak';

describe('VANTAGE v2.0 Integration', () => {
  const TEST_AGENT = 'integration-test-agent';
  const TEST_FILE = path.join(import.meta.dirname, '../../memory/agents', `${TEST_AGENT}.md`);

  beforeEach(() => {
    // Isolate evaluations.md — backup original
    if (fs.existsSync(EVAL_FILE)) fs.copyFileSync(EVAL_FILE, EVAL_BACKUP);
    fs.writeFileSync(EVAL_FILE, '# VANTAGE Evaluation Cache\n\n', 'utf-8');
  });

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
    // Restore evaluations.md
    if (fs.existsSync(EVAL_BACKUP)) {
      fs.copyFileSync(EVAL_BACKUP, EVAL_FILE);
      fs.unlinkSync(EVAL_BACKUP);
    }
  });

  it('full flow: estimate → load agent → build prompt → save learning → graduate → compact', () => {
    // 1. Get team agents
    const team = getTeamAgents('minimum-viable');
    assert.ok(team.length >= 4);

    // 2. Estimate tokens + format
    const est = estimate({
      team: { preset: 'minimum-viable', agents: team },
      complexity: 'simple',
      specCount: 2,
      requirementCount: 3,
      cachedLearnings: 0,
      cachedPackages: 0,
    });
    assert.ok(est.total.min > 0);
    const display = formatEstimate(est, 'integration-test');
    assert.ok(display.includes('integration-test'));
    assert.ok(display.includes('Token Estimate'));

    // 3. Load a real agent
    const agent = loadAgent('08-security-architect', { memory: { injection_budget: 500 } });
    assert.ok(agent.prompt.length > 0);
    assert.ok(agent.toolkitIndex.includes('stride-analysis'));

    // 4. Build prompt for dispatch
    const prompt = buildPrompt('08-security-architect', 'Review auth module', { projectStack: ['node'] }, {});
    assert.ok(prompt.includes('Review auth module'));
    assert.ok(prompt.includes('Agent Definition'));

    // 5. Load a tool on-demand + list tools
    const tool = loadTool('stride-analysis');
    assert.ok(tool.includes('STRIDE'));
    const tools = listTools('08-security-architect');
    assert.ok(tools.length >= 3);

    // 6. Save a learning
    appendLearning(TEST_AGENT, { type: 'DECISION', content: 'Integration test decision', project: 'test', reusable: true });
    assert.ok(fs.existsSync(TEST_FILE));

    // 7. Graduate
    const gradResult = graduate(TEST_AGENT, {
      decisions: [{ content: 'Good choice', project: 'test', reusable: true, roundtrips: 1 }],
      errors: [],
      discoveries: [],
    });
    assert.ok(gradResult.graduated >= 0);

    // 8. Load memory back + compact
    const memory = load(TEST_AGENT);
    assert.ok(memory.includes('Integration test decision'));
    const compactResult = compactIfNeeded(TEST_AGENT, 100000);
    assert.equal(compactResult.compacted, false);

    // 9. Scout: save evaluation + search
    saveEvaluation('test-pkg', { registry: 'npm', rating: 4, verdict: 'USE', license: 'MIT' });
    const scoutResults = search('test-pkg', { cacheOnly: true });
    assert.ok(scoutResults.length >= 1);
    assert.equal(scoutResults[0].verdict, 'USE');

    // 10. Maintenance check
    assert.equal(shouldRun({ maintenance: { auto_trigger_days: 30 } }), true);
    const auditResult = audit();
    assert.ok(auditResult.report.includes('Maintenance Report'));
  });
});
