import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimate, formatEstimate } from '../token-estimator.js';

describe('token-estimator', () => {
  it('returns estimate with total range, phases, savings, factors', () => {
    const config = {
      team: { preset: 'fullstack', agents: ['00', '02', '05', '06', '08', '12', '13', '14', '15', '17'] },
      complexity: 'medium',
      specCount: 4,
      requirementCount: 6,
      cachedLearnings: 3,
      cachedPackages: 2,
    };
    const result = estimate(config);
    assert.ok(result.total.min > 0);
    assert.ok(result.total.max > result.total.min);
    assert.ok(result.phases.length === 6);
    assert.ok(result.savings.memory >= 0);
    assert.ok(result.savings.scout >= 0);
    assert.ok(result.factors.length > 0);
  });

  it('simple complexity produces lower estimate than complex', () => {
    const base = { team: { preset: 'api', agents: ['00', '02', '08', '12', '14', '17'] }, specCount: 2, requirementCount: 3, cachedLearnings: 0, cachedPackages: 0 };
    const simple = estimate({ ...base, complexity: 'simple' });
    const complex = estimate({ ...base, complexity: 'complex' });
    assert.ok(simple.total.max < complex.total.max);
  });

  it('cached learnings reduce estimate', () => {
    const base = { team: { preset: 'api', agents: ['00', '02', '08', '12', '14', '17'] }, complexity: 'medium', specCount: 2, requirementCount: 3, cachedPackages: 0 };
    const noCache = estimate({ ...base, cachedLearnings: 0 });
    const withCache = estimate({ ...base, cachedLearnings: 10 });
    assert.ok(withCache.total.min < noCache.total.min);
  });

  it('formats display string', () => {
    const config = { team: { preset: 'fullstack', agents: ['00', '02', '08'] }, complexity: 'medium', specCount: 2, requirementCount: 3, cachedLearnings: 0, cachedPackages: 0 };
    const result = estimate(config);
    assert.ok(result.factors.some(f => f.includes('agents')));
  });

  it('defaults to factor 1.0 for unknown complexity', () => {
    const config = { team: { agents: ['00'] }, complexity: 'extreme', specCount: 0, requirementCount: 0, cachedLearnings: 0, cachedPackages: 0 };
    const medium = estimate({ ...config, complexity: 'medium' });
    const unknown = estimate(config);
    assert.equal(unknown.total.min, medium.total.min);
  });

  it('handles empty agents array without error', () => {
    const config = { team: { agents: [] }, complexity: 'simple', specCount: 0, requirementCount: 0, cachedLearnings: 0, cachedPackages: 0 };
    const result = estimate(config);
    assert.ok(result.total.min >= 0);
  });

  it('formatEstimate() produces readable output with project name and phases', () => {
    const est = estimate({ team: { agents: ['00', '02'] }, complexity: 'medium', specCount: 2, requirementCount: 3, cachedLearnings: 0, cachedPackages: 0 });
    const output = formatEstimate(est, 'test-project');
    assert.ok(output.includes('test-project'));
    assert.ok(output.includes('discovery'));
    assert.ok(output.includes('Token Estimate'));
  });
});
