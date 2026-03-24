import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createVote,
  castVote,
  tally,
  generateADR,
  isSecurityDecision,
  DECISION_WEIGHTS,
} from '../consensus.js';

// ---------------------------------------------------------------------------
// createVote
// ---------------------------------------------------------------------------
describe('createVote', () => {
  it('initializes a vote session with correct structure', () => {
    const session = createVote('tech-stack', 'Which framework?', ['Fastify', 'Express']);
    assert.ok(session.voteId.startsWith('vote-'));
    assert.equal(session.decisionType, 'tech-stack');
    assert.equal(session.question, 'Which framework?');
    assert.deepEqual(session.options, ['Fastify', 'Express']);
    assert.deepEqual(session.votes, []);
    assert.equal(session.status, 'open');
  });

  it('rejects empty options array', () => {
    assert.throws(
      () => createVote('tech-stack', 'Which framework?', []),
      /at least 2 items/
    );
  });

  it('rejects single option', () => {
    assert.throws(
      () => createVote('tech-stack', 'Only one?', ['solo']),
      /at least 2 items/
    );
  });

  it('rejects missing decisionType', () => {
    assert.throws(
      () => createVote('', 'Q?', ['a', 'b']),
      /decisionType is required/
    );
  });

  it('rejects security decision types', () => {
    assert.throws(
      () => createVote('security-control', 'Which auth?', ['OAuth', 'SAML']),
      /security-related/
    );
  });
});

// ---------------------------------------------------------------------------
// castVote
// ---------------------------------------------------------------------------
describe('castVote', () => {
  it('applies correct weight from DECISION_WEIGHTS map', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    const updated = castVote(session, '04', 'Fastify', 0.9, 'Best performance');
    assert.equal(updated.votes.length, 1);
    const vote = updated.votes[0];
    assert.equal(vote.agentId, '04');
    assert.equal(vote.weight, 3); // '04' has weight 3 in tech-stack
    assert.equal(vote.confidence, 0.9);
    assert.equal(vote.score, 2.7); // 3 * 0.9
  });

  it('uses weight 1 for unknown agent', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    const updated = castVote(session, '99', 'Express', 0.8, 'Widely known');
    const vote = updated.votes[0];
    assert.equal(vote.weight, 1);
    assert.equal(vote.score, 0.8); // 1 * 0.8
  });

  it('rejects invalid option', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    assert.throws(
      () => castVote(session, '04', 'Koa', 0.5, 'Alternative'),
      /not a valid choice/
    );
  });

  it('rejects confidence out of range', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    assert.throws(
      () => castVote(session, '04', 'Fastify', 1.5, 'Too confident'),
      /between 0 and 1/
    );
    assert.throws(
      () => castVote(session, '04', 'Fastify', -0.1, 'Negative'),
      /between 0 and 1/
    );
  });

  it('rejects vote on closed session', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    session.status = 'closed';
    assert.throws(
      () => castVote(session, '04', 'Fastify', 0.9, 'reason'),
      /not open/
    );
  });

  it('allows multiple votes accumulating immutably', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    const s1 = castVote(session, '04', 'Fastify', 0.9, 'Performance');
    const s2 = castVote(s1, '05', 'Express', 0.7, 'Familiarity');
    assert.equal(session.votes.length, 0);  // original unchanged
    assert.equal(s1.votes.length, 1);
    assert.equal(s2.votes.length, 2);
  });
});

// ---------------------------------------------------------------------------
// tally — weighted
// ---------------------------------------------------------------------------
describe('tally (weighted)', () => {
  it('higher-weight agents have more influence', () => {
    let session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    // Agent 04 (weight 3) votes Fastify with high confidence
    session = castVote(session, '04', 'Fastify', 0.9, 'Best performance');
    // Agent 12 (weight 1) votes Express with high confidence
    session = castVote(session, '12', 'Express', 1.0, 'Simpler');

    const result = tally(session, 'weighted');
    assert.equal(result.winner, 'Fastify');
    // Fastify: 3 * 0.9 = 2.7, Express: 1 * 1.0 = 1.0
    assert.equal(result.scores['Fastify'], 2.7);
    assert.equal(result.scores['Express'], 1);
    assert.equal(result.method, 'weighted');
    assert.equal(result.unanimous, false);
  });

  it('defaults to weighted method', () => {
    let session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    session = castVote(session, '04', 'Fastify', 0.9, 'reason');
    const result = tally(session);
    assert.equal(result.method, 'weighted');
  });
});

// ---------------------------------------------------------------------------
// tally — majority
// ---------------------------------------------------------------------------
describe('tally (majority)', () => {
  it('one-agent-one-vote regardless of weight', () => {
    let session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    // Agent 04 (weight 3) votes Fastify
    session = castVote(session, '04', 'Fastify', 0.9, 'Performance');
    // Two agents vote Express
    session = castVote(session, '12', 'Express', 0.8, 'Simpler');
    session = castVote(session, '14', 'Express', 0.7, 'More plugins');

    const result = tally(session, 'majority');
    assert.equal(result.winner, 'Express');
    assert.equal(result.scores['Express'], 2);
    assert.equal(result.scores['Fastify'], 1);
    assert.equal(result.method, 'majority');
  });
});

// ---------------------------------------------------------------------------
// tally — advisory
// ---------------------------------------------------------------------------
describe('tally (advisory)', () => {
  it('returns all scores with no winner declared', () => {
    let session = createVote('api-design', 'REST or GraphQL?', ['REST', 'GraphQL']);
    session = castVote(session, '06', 'REST', 0.8, 'Simpler');
    session = castVote(session, '04', 'GraphQL', 0.9, 'Flexible');

    const result = tally(session, 'advisory');
    assert.equal(result.winner, null);
    assert.ok(result.scores['REST'] > 0);
    assert.ok(result.scores['GraphQL'] > 0);
    assert.equal(result.method, 'advisory');
  });
});

// ---------------------------------------------------------------------------
// tally — edge cases
// ---------------------------------------------------------------------------
describe('tally edge cases', () => {
  it('empty votes returns no winner', () => {
    const session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    const result = tally(session, 'weighted');
    assert.equal(result.winner, null);
    assert.equal(result.scores['Fastify'], 0);
    assert.equal(result.scores['Express'], 0);
    assert.equal(result.unanimous, false);
    assert.deepEqual(result.breakdown, []);
  });

  it('tie results in no winner', () => {
    let session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    session = castVote(session, '04', 'Fastify', 0.5, 'ok');
    session = castVote(session, '04', 'Express', 0.5, 'ok too');
    // Both get 3 * 0.5 = 1.5
    const result = tally(session, 'weighted');
    assert.equal(result.winner, null);
  });

  it('detects unanimous vote', () => {
    let session = createVote('tech-stack', 'Framework?', ['Fastify', 'Express']);
    session = castVote(session, '04', 'Fastify', 0.9, 'reason1');
    session = castVote(session, '05', 'Fastify', 0.8, 'reason2');
    session = castVote(session, '12', 'Fastify', 0.7, 'reason3');

    const result = tally(session, 'weighted');
    assert.equal(result.unanimous, true);
    assert.equal(result.winner, 'Fastify');
  });
});

// ---------------------------------------------------------------------------
// isSecurityDecision
// ---------------------------------------------------------------------------
describe('isSecurityDecision', () => {
  it('returns true for security-related types', () => {
    assert.equal(isSecurityDecision('security-control'), true);
    assert.equal(isSecurityDecision('auth-flow'), true);
    assert.equal(isSecurityDecision('encryption'), true);
    assert.equal(isSecurityDecision('access-policy'), true);
    assert.equal(isSecurityDecision('threat-model'), true);
    assert.equal(isSecurityDecision('vulnerability-response'), true);
  });

  it('returns false for non-security types', () => {
    assert.equal(isSecurityDecision('tech-stack'), false);
    assert.equal(isSecurityDecision('ux-design'), false);
    assert.equal(isSecurityDecision('priority'), false);
    assert.equal(isSecurityDecision('library-choice'), false);
    assert.equal(isSecurityDecision('api-design'), false);
  });

  it('returns false for unknown types', () => {
    assert.equal(isSecurityDecision('random-type'), false);
  });
});

// ---------------------------------------------------------------------------
// generateADR
// ---------------------------------------------------------------------------
describe('generateADR', () => {
  it('includes all required sections', () => {
    let session = createVote('tech-stack', 'Which framework?', ['Fastify', 'Express']);
    session = castVote(session, '04', 'Fastify', 0.9, 'Best performance');
    session = castVote(session, '12', 'Express', 0.8, 'Simple');
    const result = tally(session, 'weighted');
    const adr = generateADR(session, result);

    assert.ok(adr.includes('# ADR-'));
    assert.ok(adr.includes('Which framework?'));
    assert.ok(adr.includes('## Status'));
    assert.ok(adr.includes('## Context'));
    assert.ok(adr.includes('## Decision'));
    assert.ok(adr.includes('## Vote Breakdown'));
    assert.ok(adr.includes('## Scores'));
    assert.ok(adr.includes('## Consequences'));
    assert.ok(adr.includes('| Agent | Vote | Weight | Confidence | Score | Reasoning |'));
    assert.ok(adr.includes('Fastify'));
    assert.ok(adr.includes('Express'));
    assert.ok(adr.includes('weighted'));
  });

  it('marks status as Accepted when there is a winner', () => {
    let session = createVote('tech-stack', 'Q?', ['A', 'B']);
    session = castVote(session, '04', 'A', 0.9, 'reason');
    const result = tally(session);
    const adr = generateADR(session, result);
    assert.ok(adr.includes('Accepted'));
  });

  it('marks status as Proposed when no winner', () => {
    const session = createVote('tech-stack', 'Q?', ['A', 'B']);
    const result = tally(session); // no votes
    const adr = generateADR(session, result);
    assert.ok(adr.includes('Proposed'));
  });

  it('notes unanimous decisions', () => {
    let session = createVote('tech-stack', 'Q?', ['A', 'B']);
    session = castVote(session, '04', 'A', 0.9, 'r1');
    session = castVote(session, '05', 'A', 0.8, 'r2');
    const result = tally(session);
    const adr = generateADR(session, result);
    assert.ok(adr.includes('unanimous'));
  });

  it('includes vote breakdown rows for each vote', () => {
    let session = createVote('api-design', 'REST or GraphQL?', ['REST', 'GraphQL']);
    session = castVote(session, '06', 'REST', 0.8, 'Simpler integration');
    session = castVote(session, '04', 'GraphQL', 0.9, 'Flexible queries');
    const result = tally(session);
    const adr = generateADR(session, result);

    // Should have agent rows
    assert.ok(adr.includes('| 06 |'));
    assert.ok(adr.includes('| 04 |'));
    assert.ok(adr.includes('Simpler integration'));
    assert.ok(adr.includes('Flexible queries'));
  });
});

// ---------------------------------------------------------------------------
// DECISION_WEIGHTS export
// ---------------------------------------------------------------------------
describe('DECISION_WEIGHTS', () => {
  it('exports all five decision types', () => {
    const types = Object.keys(DECISION_WEIGHTS);
    assert.ok(types.includes('tech-stack'));
    assert.ok(types.includes('ux-design'));
    assert.ok(types.includes('priority'));
    assert.ok(types.includes('library-choice'));
    assert.ok(types.includes('api-design'));
    assert.equal(types.length, 5);
  });

  it('all weights are positive integers', () => {
    for (const [, weightMap] of Object.entries(DECISION_WEIGHTS)) {
      for (const [, w] of Object.entries(weightMap)) {
        assert.ok(Number.isInteger(w) && w > 0, `Weight must be positive integer, got ${w}`);
      }
    }
  });
});
