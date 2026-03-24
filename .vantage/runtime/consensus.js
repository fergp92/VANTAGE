import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Consensus Voting — weighted multi-agent decision making
// ---------------------------------------------------------------------------
// For NON-security decisions where multiple agents have valid opinions.
// Security decisions are EXCLUDED — Security Architect (08) retains absolute
// veto via the gate-hooks system.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Weight maps per decision type — higher weight = more influence
// ---------------------------------------------------------------------------
export const DECISION_WEIGHTS = {
  'tech-stack': {
    '04': 3, '05': 2, '06': 2, '15': 2,  // architects
    '12': 1, '14': 1, '17': 1,             // implementers/testers
  },
  'ux-design': {
    '32': 3, '15': 2, '16': 2,  // UX/frontend
    '02': 1, '26': 1,            // requirements/product
  },
  'priority': {
    '26': 3, '28': 2,  // product/backlog
    '24': 1, '02': 1,  // PM/requirements
  },
  'library-choice': {
    '25': 3, '12': 2, '17': 2,  // scout/domain/test
    '04': 1, '08': 1,            // architects
  },
  'api-design': {
    '06': 3, '04': 2, '05': 2,  // integration/enterprise/data
    '12': 1, '13': 1,            // domain/app services
  },
};

// ---------------------------------------------------------------------------
// Security-related decision types — these use veto, not voting
// ---------------------------------------------------------------------------
const SECURITY_TYPES = new Set([
  'security-control',
  'auth-flow',
  'encryption',
  'access-policy',
  'threat-model',
  'vulnerability-response',
]);

let _voteCounter = 0;

// ---------------------------------------------------------------------------
// createVote — initialize a voting session
// ---------------------------------------------------------------------------
export function createVote(decisionType, question, options) {
  if (!decisionType || typeof decisionType !== 'string') {
    throw new Error('decisionType is required and must be a string');
  }
  if (!question || typeof question !== 'string') {
    throw new Error('question is required and must be a string');
  }
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error('options must be an array with at least 2 items');
  }
  if (isSecurityDecision(decisionType)) {
    throw new Error(
      `Decision type "${decisionType}" is security-related and cannot use consensus voting. ` +
      'Security decisions require Security Architect (08) veto authority.'
    );
  }

  _voteCounter += 1;
  return {
    voteId: `vote-${_voteCounter}`,
    decisionType,
    question,
    options: [...options],
    votes: [],
    status: 'open',
  };
}

// ---------------------------------------------------------------------------
// castVote — agent casts a weighted vote
// ---------------------------------------------------------------------------
export function castVote(voteSession, agentId, option, confidence, reasoning) {
  if (!voteSession || voteSession.status !== 'open') {
    throw new Error('Vote session is not open');
  }
  if (!agentId || typeof agentId !== 'string') {
    throw new Error('agentId is required');
  }
  if (!voteSession.options.includes(option)) {
    throw new Error(`Option "${option}" is not a valid choice. Valid: ${voteSession.options.join(', ')}`);
  }
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error('confidence must be a number between 0 and 1');
  }
  if (!reasoning || typeof reasoning !== 'string') {
    throw new Error('reasoning is required');
  }

  // Look up weight from decision type map; default to 1 for unknown agents
  const weightMap = DECISION_WEIGHTS[voteSession.decisionType] || {};
  const weight = weightMap[agentId] ?? 1;

  const vote = {
    agentId,
    option,
    confidence,
    reasoning,
    weight,
    score: weight * confidence,
  };

  return {
    ...voteSession,
    votes: [...voteSession.votes, vote],
  };
}

// ---------------------------------------------------------------------------
// tally — count votes and determine winner
// ---------------------------------------------------------------------------
export function tally(voteSession, method = 'weighted') {
  if (!voteSession) {
    throw new Error('voteSession is required');
  }
  if (!['weighted', 'majority', 'advisory'].includes(method)) {
    throw new Error(`Unknown tally method: "${method}". Use weighted, majority, or advisory.`);
  }

  const { votes, options } = voteSession;

  // Initialize scores for all options
  const scores = {};
  for (const opt of options) {
    scores[opt] = 0;
  }

  // Build breakdown
  const breakdown = [];

  for (const vote of votes) {
    let contribution;
    if (method === 'majority') {
      contribution = 1;
    } else {
      // weighted and advisory both use weight * confidence
      contribution = vote.score;
    }
    scores[vote.option] += contribution;
    breakdown.push({
      agentId: vote.agentId,
      option: vote.option,
      weight: vote.weight,
      confidence: vote.confidence,
      score: contribution,
      reasoning: vote.reasoning,
    });
  }

  // Round scores to avoid floating point noise
  for (const opt of Object.keys(scores)) {
    scores[opt] = Math.round(scores[opt] * 1000) / 1000;
  }

  // Determine winner (advisory mode has no winner)
  let winner = null;
  if (method !== 'advisory' && votes.length > 0) {
    let maxScore = -1;
    let tied = false;
    for (const [opt, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = opt;
        tied = false;
      } else if (score === maxScore) {
        tied = true;
      }
    }
    // On tie, no clear winner
    if (tied) {
      winner = null;
    }
  }

  // Check unanimity — all votes picked the same option
  const unanimous = votes.length > 0 &&
    votes.every(v => v.option === votes[0].option);

  return {
    winner,
    scores,
    breakdown,
    method,
    unanimous,
  };
}

// ---------------------------------------------------------------------------
// generateADR — create Architecture Decision Record from vote results
// ---------------------------------------------------------------------------
export function generateADR(voteSession, tallyResult) {
  if (!voteSession || !tallyResult) {
    throw new Error('Both voteSession and tallyResult are required');
  }

  const { voteId, question, decisionType } = voteSession;
  const { winner, scores, breakdown, method, unanimous } = tallyResult;

  const adrNumber = voteId.replace('vote-', '').padStart(3, '0');
  const status = winner ? 'Accepted' : 'Proposed';
  const decisionText = winner
    ? `${winner} — selected via ${method} voting${unanimous ? ' (unanimous)' : ''}`
    : `No clear winner — requires further discussion (${method} voting)`;

  // Vote breakdown table
  const tableRows = breakdown.map(b =>
    `| ${b.agentId} | ${b.option} | ${b.weight} | ${b.confidence} | ${b.score} | ${b.reasoning} |`
  ).join('\n');

  // Scores list
  const scoreLines = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([opt, score]) => `- ${opt}: ${score}`)
    .join('\n');

  return `# ADR-${adrNumber}: ${question}

## Status
${status}

## Context
${question}

Decision type: ${decisionType}

## Decision
${decisionText}

## Vote Breakdown
| Agent | Vote | Weight | Confidence | Score | Reasoning |
|-------|------|--------|------------|-------|-----------|
${tableRows}

## Scores
${scoreLines}

## Consequences
[To be filled by team]
`;
}

// ---------------------------------------------------------------------------
// isSecurityDecision — guard against voting on security matters
// ---------------------------------------------------------------------------
export function isSecurityDecision(decisionType) {
  return SECURITY_TYPES.has(decisionType);
}

// ---------------------------------------------------------------------------
// CLI interface — guarded
// ---------------------------------------------------------------------------
const _argv1 = process.argv[1] || '';
const _metaUrl = fileURLToPath(import.meta.url);
if (_argv1.replace(/\\/g, '/') === _metaUrl.replace(/\\/g, '/')) {
  const [,, command, ...rest] = process.argv;

  if (command === 'types') {
    process.stdout.write('Available decision types for consensus voting:\n\n');
    for (const dtype of Object.keys(DECISION_WEIGHTS)) {
      const agentCount = Object.keys(DECISION_WEIGHTS[dtype]).length;
      process.stdout.write(`  ${dtype.padEnd(20)} (${agentCount} agents)\n`);
    }
    process.stdout.write('\nSecurity-related types (veto only, no voting):\n\n');
    for (const stype of SECURITY_TYPES) {
      process.stdout.write(`  ${stype}\n`);
    }
  } else if (command === 'weights') {
    const dtype = rest[0];
    if (!dtype) {
      process.stdout.write('Usage: node consensus.js weights <decision-type>\n');
      process.exit(1);
    }
    const weights = DECISION_WEIGHTS[dtype];
    if (!weights) {
      process.stderr.write(`Unknown decision type: "${dtype}"\n`);
      process.stderr.write(`Available: ${Object.keys(DECISION_WEIGHTS).join(', ')}\n`);
      process.exit(1);
    }
    process.stdout.write(`Weights for "${dtype}":\n\n`);
    const sorted = Object.entries(weights).sort(([, a], [, b]) => b - a);
    for (const [agentId, weight] of sorted) {
      process.stdout.write(`  Agent ${agentId}: weight ${weight}\n`);
    }
  } else {
    process.stdout.write('Usage: node consensus.js <command>\n');
    process.stdout.write('Commands: types, weights <type>\n');
  }
}
